// Loads resources from a Google Sheet published as CSV.
// Sheet must have a header row with these columns (Reihenfolge egal):
//   id, titel, beschreibung, kategorie, url, tag
// "kategorie" = category id (bpa, spr, nmg, ges, mus, bs, mi, uek, stw, ibe)
//
// How to publish: Datei → Freigeben → Im Web veröffentlichen → CSV → Link kopieren.

// Decode a Blob/File or ArrayBuffer to text, auto-detecting UTF-8 vs Windows-1252.
// Excel for Windows often saves CSVs as Windows-1252 (ANSI) — without this,
// umlauts like ä, ö, ü, ß come out garbled.
async function decodeText(source) {
  let buf;
  if (source instanceof ArrayBuffer) buf = source;
  else if (source && typeof source.arrayBuffer === 'function') buf = await source.arrayBuffer();
  else if (typeof source === 'string') return stripBOM(source);
  else throw new Error('Unsupported source for decodeText');

  const bytes = new Uint8Array(buf);
  // BOM = clearly UTF-8
  if (bytes.length >= 3 && bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
    return new TextDecoder('utf-8').decode(bytes.subarray(3));
  }
  // Try strict UTF-8 first
  try {
    const utf8 = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    return utf8;
  } catch (e) {
    // Fall back to Windows-1252 (covers Excel-on-Windows exports)
    return new TextDecoder('windows-1252').decode(bytes);
  }
}

function stripBOM(s) {
  return s && s.charCodeAt(0) === 0xFEFF ? s.slice(1) : s;
}

// Auto-detect delimiter: pick whichever of ; or , appears more in the header line
function detectDelimiter(text) {
  const firstLine = text.split(/\r?\n/, 1)[0] || '';
  // Strip quoted segments so commas/semicolons inside fields don't skew the count
  const stripped = firstLine.replace(/"([^"]|"")*"/g, '');
  const semi = (stripped.match(/;/g) || []).length;
  const comma = (stripped.match(/,/g) || []).length;
  return semi > comma ? ';' : ',';
}

// Minimal RFC-4180-ish CSV parser (handles quoted fields, embedded delimiters, "")
function parseCSV(text, delimiter) {
  const sep = delimiter || detectDelimiter(text);
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i], n = text[i + 1];
    if (inQuotes) {
      if (c === '"' && n === '"') { field += '"'; i++; }
      else if (c === '"') { inQuotes = false; }
      else { field += c; }
    } else {
      if (c === '"') { inQuotes = true; }
      else if (c === sep) { row.push(field); field = ''; }
      else if (c === '\r') { /* skip */ }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else { field += c; }
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.length > 1 || (r.length === 1 && r[0].trim()));
}

function rowsToResources(rows) {
  if (!rows.length) return [];
  const header = rows[0].map(h => h.trim().toLowerCase());
  const col = (name) => header.indexOf(name);
  const iId   = col('id');
  const iTit  = col('titel') >= 0 ? col('titel') : col('title');
  const iDesc = col('beschreibung') >= 0 ? col('beschreibung') : col('desc');
  const iCat  = col('kategorie') >= 0 ? col('kategorie') : col('cat');
  const iUrl  = col('url') >= 0 ? col('url') : col('link');
  const iTag  = col('tag');
  const iImg  = col('bild') >= 0 ? col('bild') : col('image') >= 0 ? col('image') : col('img');
  const iFeat = col('featured') >= 0 ? col('featured') : col('fokus');

  const truthy = (v) => /^(1|true|ja|yes|x|y|fokus)$/i.test(String(v || '').trim());

  // Only allow https:// (and protocol-relative // promoted to https) — blocks
  // javascript:, data:, file:, http:, mailto: etc. Returns '' for invalid input.
  const safeHttps = (raw) => {
    const s = String(raw || '').trim();
    if (!s) return '';
    if (/^https:\/\//i.test(s)) return s;
    if (/^\/\//.test(s)) return 'https:' + s;
    return '';
  };

  const out = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || !r.some(v => (v || '').trim())) continue;
    const title = (r[iTit]  || '').trim();
    const desc  = (r[iDesc] || '').trim();
    const cat   = (r[iCat]  || '').trim().toLowerCase();
    const url   = safeHttps(r[iUrl]);
    const tagRaw = (r[iTag]  || '').trim();
    const tags = tagRaw
      ? tagRaw.split(',').map(t => t.trim()).filter(Boolean)
      : ['Material'];
    const id    = (r[iId]   || '').trim() || `s${i}`;
    const img   = iImg  >= 0 ? safeHttps(r[iImg]) : '';
    const featured = iFeat >= 0 ? truthy(r[iFeat]) : false;
    if (!title || !cat || !url) continue;
    out.push({ id, title, desc, cat, url, tag: tags[0], tags, img, featured });
  }
  return out;
}

async function loadFromSheet(url) {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = await res.arrayBuffer();
  const text = await decodeText(buf);
  const rows = parseCSV(text);
  const resources = rowsToResources(rows);
  if (!resources.length) throw new Error('Keine Ressourcen gefunden');
  return resources;
}

// Load from a local file (.csv or .xlsx). Requires SheetJS for xlsx.
async function loadFromFile(file) {
  const name = (file.name || '').toLowerCase();
  if (name.endsWith('.csv')) {
    const text = await decodeText(file);
    const rows = parseCSV(text);
    const resources = rowsToResources(rows);
    if (!resources.length) throw new Error('Keine Ressourcen gefunden');
    return resources;
  }
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    if (!window.XLSX) throw new Error('XLSX-Bibliothek nicht geladen');
    const buf = await file.arrayBuffer();
    const wb = window.XLSX.read(buf, { type: 'array' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = window.XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false, defval: '' });
    const resources = rowsToResources(rows.map(r => r.map(c => String(c == null ? '' : c))));
    if (!resources.length) throw new Error('Keine Ressourcen gefunden');
    return resources;
  }
  throw new Error('Format nicht unterstützt (CSV oder XLSX)');
}

window.PHZH_SHEET = { loadFromSheet, loadFromFile, parseCSV, rowsToResources };
