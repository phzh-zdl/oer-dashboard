/* global React */
const { useState, useEffect, useMemo, useRef } = React;

// ───── Daily deterministic shuffle ─────
// Allow only https:// URLs (or protocol-relative // promoted to https). Returns '' otherwise.
// Blocks javascript:, data:, file:, http: etc. so links from the CSV can't run code.
function safeHttps(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';
  if (/^https:\/\//i.test(s)) return s;
  if (/^\/\//.test(s)) return 'https:' + s;
  return '';
}

function seededRandom(seed) {
  let s = seed >>> 0;
  return () => {
    s = s * 1664525 + 1013904223 >>> 0;
    return s / 0x100000000;
  };
}
function shuffleWithSeed(arr, seed) {
  const rnd = seededRandom(seed);
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function dayOfYear(d = new Date()) {
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d - start;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}
function pickFeatured(resources, strategy, sessionSeed) {
  let seed;
  if (strategy === 'daily') {
    seed = dayOfYear() * 2654435761;
  } else if (strategy === 'session') {
    seed = sessionSeed;
  } else {
    // weekly
    const d = new Date();
    const weekStart = new Date(d.getFullYear(), 0, 1);
    const week = Math.floor((d - weekStart) / (7 * 86400000));
    seed = week * 2654435761;
  }
  return shuffleWithSeed(resources, seed);
}

// ───── Featured period label ─────
function periodLabel(strategy) {
  const d = new Date();
  const months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  if (strategy === 'daily') {
    return `Tagesauswahl · ${d.getDate()}. ${months[d.getMonth()]} ${d.getFullYear()}`;
  }
  if (strategy === 'weekly') {
    const weekStart = new Date(d.getFullYear(), 0, 1);
    const week = Math.floor((d - weekStart) / (7 * 86400000)) + 1;
    return `Woche ${week} · ${d.getFullYear()}`;
  }
  return 'Zufällige Auswahl · diese Sitzung';
}

// ───── Topbar (compact) ─────
function Topbar({ totalCount, categoryCount, accent, sheetStatus }) {
  return (
    <header className="topbar">
      <div className="topbar-row">
        <a href="#" className="wordmark">
          <span className="wm-logo" role="img" aria-label="Pädagogische Hochschule Zürich" />
          <span className="wm-sep">·</span>
          <span className="wm-product">Open Educational Resources</span>
        </a>
        <nav className="topbar-nav">
          <a href="#featured">Im&nbsp;Fokus</a>
          <a href="#katalog">Katalog</a>
          <a href="#ueber">Über</a>
          <a href="#" className="topbar-cta">Ressource&nbsp;einreichen&nbsp;↗</a>
        </nav>
      </div>

      <div className="topbar-lede">
        <h1 className="topbar-title">
          <em>Offene</em> Lehr- und Lernmaterialien für Studium, Praxis und Weiterbildung.
        </h1>
        <div className="topbar-meta">
          <span><b>{totalCount}</b> Ressourcen</span>
          <span className="dot">·</span>
          <span><b>{categoryCount}</b> Fachbereiche</span>
          <span className="dot">·</span>
          {sheetStatus && sheetStatus.kind === 'ok' && sheetStatus.source && sheetStatus.source !== 'resources.csv' ?
          <span className="src-live">● {sheetStatus.source}</span> :
          <span>CC-lizenziert</span>}
        </div>
      </div>
    </header>);

}

// ───── Search bar ─────
function SearchBar({ value, onChange }) {
  return (
    <div className="searchbar">
      <svg className="search-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden>
        <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <line x1="16.5" y1="16.5" x2="21" y2="21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <input
        type="text"
        placeholder="Ressourcen durchsuchen — Titel, Beschreibung, Schlagwort…"
        value={value}
        onChange={(e) => onChange(e.target.value)} />
      
      {value &&
      <button className="search-clear" onClick={() => onChange('')} aria-label="Zurücksetzen">×</button>
      }
    </div>);

}

// ───── Carousel (featured) ─────
function Carousel({ items, categoriesById, strategy }) {
  const [idx, setIdx] = useState(0);
  const [pausedUntil, setPausedUntil] = useState(0);
  const count = items.length;
  const visible = 3;

  useEffect(() => {
    if (strategy === 'session') return;
    const t = setInterval(() => {
      if (Date.now() < pausedUntil) return;
      setIdx((i) => (i + 1) % Math.max(1, count - visible + 1));
    }, 7000);
    return () => clearInterval(t);
  }, [count, strategy, pausedUntil]);

  const bumpPause = () => setPausedUntil(Date.now() + 12000);
  const prev = () => { bumpPause(); setIdx((i) => (i - 1 + (count - visible + 1)) % (count - visible + 1)); };
  const next = () => { bumpPause(); setIdx((i) => (i + 1) % (count - visible + 1)); };

  return (
    <section className="featured" id="featured">
      <div className="featured-head">
        <div>
          <div className="section-label">Redaktionell ausgewählt</div>
          <h2 className="section-title">Im Fokus</h2>
          <div className="period-label">{periodLabel(strategy)}</div>
        </div>
        <div className="featured-ctrl">
          <button onClick={prev} aria-label="Zurück">←</button>
          <span className="pager">{idx + 1}–{Math.min(idx + visible, count)} / {count}</span>
          <button onClick={next} aria-label="Weiter">→</button>
        </div>
      </div>

      <div className="featured-viewport">
        <div className="featured-track" style={{ transform: `translateX(calc(${-idx} * (100% / ${visible})))` }}>
          {items.map((r) =>
          <FeaturedCard key={r.id} r={r} cat={categoriesById[r.cat]} />
          )}
        </div>
      </div>
    </section>);

}

function FeaturedCard({ r, cat }) {
  const url = safeHttps(r.url);
  if (!url) return null;
  const imgSrc = safeHttps(r.img);
  const img = imgSrc || window.PHZH_PLACEHOLDER.placeholderSVG(r, cat.short, 560, 340);
  const catStyle = { '--cat-color': cat.color };
  return (
    <a className="featured-card rcard rcard-grid d-cozy" style={catStyle} href={url} target="_blank" rel="noopener noreferrer">
      <div className="rcard-img" style={{ backgroundImage: `url("${img}")` }} />
      <div className="rcard-body">
        <div className="rcard-cat"><span className="cat-swatch" /> {cat.label}</div>
        <h3 className="rcard-title">{r.title}</h3>
        <p className="rcard-desc">{r.desc}</p>
        <div className="rcard-foot">
          <span className="tag-list">{(r.tags || [r.tag]).map((t, i) => <span key={i} className="tag">{t}</span>)}</span>
          <span className="link-arrow">Öffnen ↗</span>
        </div>
      </div>
    </a>);

}

// ───── Category pills ─────
function CategoryNav({ categories, active, onSelect, counts }) {
  return (
    <div className="catnav">
      <button
        className={`catpill ${active === 'all' ? 'is-active' : ''}`}
        onClick={() => onSelect('all')}>
        
        <span>Alle Bereiche</span>
        <span className="catpill-n">{counts.all}</span>
      </button>
      {categories.map((c) =>
      <button
        key={c.id}
        className={`catpill ${active === c.id ? 'is-active' : ''}`}
        style={{ '--cat-color': c.color }}
        onClick={() => onSelect(c.id)}>
        
          <span className="cat-swatch" />
          <span>{c.short}</span>
          <span className="catpill-n">{counts[c.id] || 0}</span>
        </button>
      )}
    </div>);

}

// ───── Resource card (grid / list) ─────
function ResourceCard({ r, cat, layout, density }) {
  const url = safeHttps(r.url);
  if (!url) return null;
  const imgSrc = safeHttps(r.img);
  const img = imgSrc || window.PHZH_PLACEHOLDER.placeholderSVG(r, cat.short, 480, 300);
  const catStyle = { '--cat-color': cat.color };
  if (layout === 'list') {
    return (
      <a className={`rcard rcard-list d-${density}`} style={catStyle} href={url} target="_blank" rel="noopener noreferrer">
        <div className="rcard-img-sm" style={{ backgroundImage: `url("${img}")` }} />
        <div className="rcard-body">
          <div className="rcard-cat"><span className="cat-swatch" /> {cat.label}</div>
          <h3 className="rcard-title">{r.title}</h3>
          {density !== 'compact' && <p className="rcard-desc">{r.desc}</p>}
        </div>
        <div className="rcard-side">
          <span className="tag-list">{(r.tags || [r.tag]).map((t, i) => <span key={i} className="tag">{t}</span>)}</span>
          <span className="link-arrow">↗</span>
        </div>
      </a>);

  }
  return (
    <a className={`rcard rcard-grid d-${density}`} style={catStyle} href={url} target="_blank" rel="noopener noreferrer">
      <div className="rcard-img" style={{ backgroundImage: `url("${img}")` }} />
      <div className="rcard-body">
        <div className="rcard-cat"><span className="cat-swatch" /> {cat.label}</div>
        <h3 className="rcard-title">{r.title}</h3>
        {density !== 'compact' && <p className="rcard-desc">{r.desc}</p>}
        <div className="rcard-foot">
          <span className="tag-list">{(r.tags || [r.tag]).map((t, i) => <span key={i} className="tag">{t}</span>)}</span>
          <span className="link-arrow">Öffnen ↗</span>
        </div>
      </div>
    </a>);

}

// ───── Tweaks Panel ─────
function Tweaks({ open, onClose, state, setState, sheetStatus, onLoadLocal, localCount }) {
  if (!open) return null;
  const set = (k, v) => setState((s) => ({ ...s, [k]: v }));
  const accents = [
  { id: 'ink', label: 'Tinte', color: '#0a2540' },
  { id: 'rust', label: 'Rost', color: '#9a3d1f' },
  { id: 'forest', label: 'Wald', color: '#2d5a3f' },
  { id: 'plum', label: 'Pflaume', color: '#4a2e4f' }];

  return (
    <div className="tweaks">
      <div className="tweaks-head">
        <span>Tweaks</span>
        <button onClick={onClose} aria-label="Schliessen">×</button>
      </div>
      <div className="tweaks-body">
        <TweakRow label="Auswahl-Rotation">
          <div className="seg">
            {[['daily', 'Täglich'], ['weekly', 'Wöchentlich'], ['session', 'Pro Besuch']].map(([k, v]) =>
            <button key={k} className={state.rotation === k ? 'is-on' : ''} onClick={() => set('rotation', k)}>{v}</button>
            )}
          </div>
          <div className="tweak-hint">Täglich = fair &amp; konsistent: alle sehen heute dieselbe Auswahl.</div>
        </TweakRow>

        <TweakRow label="Akzentfarbe">
          <div className="swatches">
            {accents.map((a) =>
            <button
              key={a.id}
              className={`swatch ${state.accent === a.color ? 'is-on' : ''}`}
              onClick={() => set('accent', a.color)}
              style={{ background: a.color }}
              aria-label={a.label} />

            )}
          </div>
        </TweakRow>

        <TweakRow label="Dichte">
          <div className="seg">
            {[['compact', 'Kompakt'], ['comfortable', 'Komfort']].map(([k, v]) =>
            <button key={k} className={state.density === k ? 'is-on' : ''} onClick={() => set('density', k)}>{v}</button>
            )}
          </div>
        </TweakRow>

        <TweakRow label="Layout">
          <div className="seg">
            {[['grid', 'Raster'], ['list', 'Liste']].map(([k, v]) =>
            <button key={k} className={state.layout === k ? 'is-on' : ''} onClick={() => set('layout', k)}>{v}</button>
            )}
          </div>
        </TweakRow>

        <TweakRow label="Google Sheet (CSV-Link)">
          <input
            className="tweak-input"
            type="text"
            placeholder="https://docs.google.com/…/pub?output=csv"
            value={state.sheetUrl || ''}
            onChange={(e) => set('sheetUrl', e.target.value)} />
          
          <div className="tweak-hint">
            In Sheets: <b>Datei → Freigeben → Im Web veröffentlichen → CSV</b>.
            Überschreibt die lokale <code>resources.csv</code>.
          </div>
        </TweakRow>

        <TweakRow label="Oder lokale Datei (.csv / .xlsx)">
          <label className="tweak-upload">
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => {const f = e.target.files && e.target.files[0];onLoadLocal && onLoadLocal(f);e.target.value = '';}} />
            
            <span>Datei wählen …</span>
          </label>
          <div className="tweak-hint">
            Standardmässig wird <code>resources.csv</code> im Projekt geladen — einfach austauschen.
            Spalten: <code>id, titel, beschreibung, kategorie, url, tag</code>.
          </div>
          {sheetStatus && sheetStatus.kind === 'loading' && <div className="tweak-status">Laden …</div>}
          {sheetStatus && sheetStatus.kind === 'ok' &&
          <div className="tweak-status ok">
              ✓ {sheetStatus.count} Ressourcen · Quelle: {sheetStatus.source}
            </div>
          }
          {sheetStatus && sheetStatus.kind === 'error' && <div className="tweak-status err">Fehler: {sheetStatus.msg}</div>}
        </TweakRow>
      </div>
    </div>);

}
function TweakRow({ label, children }) {
  return (
    <div className="tweak-row">
      <div className="tweak-label">{label}</div>
      <div className="tweak-ctrl">{children}</div>
    </div>);

}

// ───── Main App ─────
function App() {
  const { CATEGORIES, RESOURCES: FALLBACK_RESOURCES } = window.PHZH_DATA;
  const categoriesById = useMemo(() => Object.fromEntries(CATEGORIES.map((c) => [c.id, c])), []);

  const defaults = /*EDITMODE-BEGIN*/{
    "rotation": "daily",
    "accent": "#0a2540",
    "density": "comfortable",
    "layout": "grid",
    "sheetUrl": ""
  } /*EDITMODE-END*/;

  const [state, setState] = useState(defaults);
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('all');
  const [activeTag, setActiveTag] = useState(null);
  const [tweaksOpen, setTweaksOpen] = useState(false);
  const [sheetResources, setSheetResources] = useState(null);
  const [sheetStatus, setSheetStatus] = useState({ kind: 'idle' });
  const sessionSeedRef = useRef(Math.floor(Math.random() * 2 ** 30));

  const RESOURCES = useMemo(() => {
    const src = sheetResources || FALLBACK_RESOURCES;
    return src.map((r) => {
      if (Array.isArray(r.tags) && r.tags.length) return r;
      const tags = (r.tag || 'Material').split(',').map(t => t.trim()).filter(Boolean);
      return { ...r, tags, tag: tags[0] };
    });
  }, [sheetResources]);

  // On first mount: try to auto-load resources.csv from the project root
  useEffect(() => {
    // Only auto-load if no Sheet URL is set
    if ((state.sheetUrl || '').trim()) return;
    let cancelled = false;
    setSheetStatus({ kind: 'loading' });
    window.PHZH_SHEET.loadFromSheet('resources.csv').
    then((res) => {
      if (cancelled) return;
      setSheetResources(res);
      setSheetStatus({ kind: 'ok', count: res.length, at: new Date(), source: 'resources.csv' });
    }).
    catch(() => {
      if (cancelled) return;
      setSheetResources(null);
      setSheetStatus({ kind: 'idle' });
    });
    return () => {cancelled = true;};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load from sheet when URL changes
  useEffect(() => {
    const url = (state.sheetUrl || '').trim();
    if (!url) return; // handled by auto-load
    setSheetStatus({ kind: 'loading' });
    window.PHZH_SHEET.loadFromSheet(url).
    then((res) => {
      setSheetResources(res);
      setSheetStatus({ kind: 'ok', count: res.length, at: new Date(), source: 'Google Sheet' });
    }).
    catch((err) => {
      setSheetResources(null);
      setSheetStatus({ kind: 'error', msg: err.message });
    });
  }, [state.sheetUrl]);

  // Tweaks bridge
  useEffect(() => {
    const onMsg = (e) => {
      const d = e.data || {};
      if (d.type === '__activate_edit_mode') setTweaksOpen(true);
      if (d.type === '__deactivate_edit_mode') setTweaksOpen(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);

  // Persist changes
  useEffect(() => {
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits: state }, '*');
  }, [state]);

  // Apply accent to CSS var
  useEffect(() => {
    document.documentElement.style.setProperty('--accent', state.accent);
  }, [state.accent]);

  // Featured — pinned items (featured=true) first, then deterministic shuffle of the rest
  const featured = useMemo(() => {
    const pinned = RESOURCES.filter((r) => r.featured);
    const rest = RESOURCES.filter((r) => !r.featured);
    const shuffled = pickFeatured(rest, state.rotation, sessionSeedRef.current);
    const combined = [...pinned, ...shuffled];
    // If pinned alone gives us enough, just rotate the rest underneath them
    return combined.slice(0, Math.max(9, pinned.length));
  }, [state.rotation, RESOURCES]);

  // Filtering
  const counts = useMemo(() => {
    const c = { all: RESOURCES.length };
    for (const r of RESOURCES) c[r.cat] = (c[r.cat] || 0) + 1;
    return c;
  }, [RESOURCES]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return RESOURCES.filter((r) => {
      if (cat !== 'all' && r.cat !== cat) return false;
      if (activeTag && !(r.tags || []).includes(activeTag)) return false;
      if (!q) return true;
      const catLabel = categoriesById[r.cat] ? categoriesById[r.cat].label.toLowerCase() : '';
      return (
        r.title.toLowerCase().includes(q) ||
        r.desc.toLowerCase().includes(q) ||
        (r.tags || []).some(t => t.toLowerCase().includes(q)) ||
        catLabel.includes(q));

    });
  }, [query, cat, activeTag, RESOURCES]);

  // All distinct tags from the (category-filtered) resource set, alphabetical.
  const availableTags = useMemo(() => {
    const set = new Set();
    for (const r of RESOURCES) {
      if (cat !== 'all' && r.cat !== cat) continue;
      for (const t of (r.tags || [])) set.add(t);
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'de'));
  }, [RESOURCES, cat]);

  // Drop activeTag if it's no longer present in the (newly filtered) tag set.
  useEffect(() => {
    if (activeTag && !availableTags.includes(activeTag)) setActiveTag(null);
  }, [availableTags, activeTag]);

  const handleLoadLocal = (file) => {
    if (!file) return;
    setSheetStatus({ kind: 'loading' });
    window.PHZH_SHEET.loadFromFile(file).
    then((res) => {
      setSheetResources(res);
      setSheetStatus({ kind: 'ok', count: res.length, at: new Date(), source: 'lokal: ' + file.name });
    }).
    catch((err) => {
      setSheetStatus({ kind: 'error', msg: err.message });
    });
  };

  const onCatSelect = (id) => {
    setCat(id);
    const el = document.getElementById('katalog');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="app">
      <Topbar
        totalCount={RESOURCES.length}
        categoryCount={CATEGORIES.length}
        accent={state.accent}
        sheetStatus={sheetStatus} />
      

      <Carousel items={featured} categoriesById={categoriesById} strategy={state.rotation} />

      <section className="catalog" id="katalog">
        <div className="catalog-head">
          <div className="catalog-head-title">
            <h2 className="section-title">Katalog durchsuchen</h2>
            <div className="section-sub">
              Ein geteiltes Regal für den Unterricht — kuratiert aus Lehre, Forschung und Praxis der PH&nbsp;Zürich.
            </div>
          </div>
          <SearchBar value={query} onChange={setQuery} />
        </div>

        <CategoryNav categories={CATEGORIES} active={cat} onSelect={onCatSelect} counts={counts} />

        {availableTags.length > 1 && (
          <div className="tag-bar">
            <span className="tag-bar-label">Format</span>
            <button
              className={'tag-chip' + (activeTag === null ? ' active' : '')}
              onClick={() => setActiveTag(null)}>Alle</button>
            {availableTags.map((t) => (
              <button
                key={t}
                className={'tag-chip' + (activeTag === t ? ' active' : '')}
                onClick={() => setActiveTag(activeTag === t ? null : t)}>{t}</button>
            ))}
          </div>
        )}

        <div className="result-meta">
          <span>{filtered.length} Ressource{filtered.length === 1 ? '' : 'n'}</span>
          {cat !== 'all' &&
          <span className="result-chip">
              {categoriesById[cat].label}
              <button onClick={() => setCat('all')} aria-label="Filter entfernen">×</button>
            </span>
          }
          {activeTag &&
          <span className="result-chip">
              {activeTag}
              <button onClick={() => setActiveTag(null)} aria-label="Tag entfernen">×</button>
            </span>
          }
          {query &&
          <span className="result-chip">
              „{query}"
              <button onClick={() => setQuery('')} aria-label="Suche leeren">×</button>
            </span>
          }
        </div>

        {filtered.length === 0 ?
        <div className="empty">
            <div className="empty-mark">∅</div>
            <p>Keine Ressource entspricht dieser Kombination.</p>
            <button onClick={() => {setQuery('');setCat('all');setActiveTag(null);}}>Filter zurücksetzen</button>
          </div> :

        <div className={`grid grid-${state.layout}`}>
            {filtered.map((r) =>
          <ResourceCard
            key={r.id}
            r={r}
            cat={categoriesById[r.cat]}
            layout={state.layout}
            density={state.density} />

          )}
          </div>
        }
      </section>

      <footer className="site-foot" id="ueber">
        <div className="foot-col">
          <div className="foot-title">Über diese Sammlung</div>
          <p>Diese Seite versammelt frei zugängliche Lehr- und Lernmaterialien aus Lehre, Forschung und Weiterbildung der PH&nbsp;Zürich. Die Auswahl wird redaktionell kuratiert und laufend ergänzt.</p>
        </div>
        <div className="foot-col">
          <div className="foot-title">Mitwirken</div>
          <p>Sie haben eine Ressource, die hier Platz haben sollte? Wir freuen uns über Hinweise und Einreichungen aus dem Kollegium und von Praxispartner:innen.</p>
          <a className="foot-link" href="#">Ressource einreichen ↗</a>
        </div>
        <div className="foot-col">
          <div className="foot-title">Lizenz</div>
          <p>Sofern nicht anders gekennzeichnet stehen die hier verlinkten Materialien unter einer Creative-Commons-Lizenz.</p>
        </div>
        <div className="foot-meta">
          <span>© {new Date().getFullYear()} Pädagogische Hochschule Zürich</span>
          <span>Impressum · Datenschutz · Kontakt</span>
        </div>
      </footer>

      <Tweaks open={tweaksOpen} onClose={() => setTweaksOpen(false)} state={state} setState={setState} sheetStatus={sheetStatus} onLoadLocal={handleLoadLocal} localCount={sheetResources ? sheetResources.length : 0} />
    </div>);

}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);