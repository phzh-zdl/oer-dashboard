// Generiert ein dezent gestreiftes SVG (Data-URL) als Bild-Fallback,
// solange im Storage noch kein echtes Bild für die Ressource liegt.
// Identische Logik wie im ClaudeDesign-Prototyp, aber als ESM-Modul
// und ohne die hartcodierte Kategorie-Farbpalette: Farben werden jetzt
// aus dem `color`-Feld der Kategorie abgeleitet, das aus der DB kommt.

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// Wandelt #rrggbb in {r,g,b} um. Liefert null bei ungültigem Input.
function hexToRgb(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '').trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

// Mischt eine Farbe weiß-warm aus, damit der Hintergrund gedämpft wirkt
// statt grell. mix=0.85 → sehr hell, mix=0.6 → mittlerer Ton.
function muted({ r, g, b }, mix) {
  const base = { r: 244, g: 241, b: 234 }; // page background
  return {
    r: Math.round(r * (1 - mix) + base.r * mix),
    g: Math.round(g * (1 - mix) + base.g * mix),
    b: Math.round(b * (1 - mix) + base.b * mix),
  };
}

function rgbStr({ r, g, b }) {
  return `rgb(${r},${g},${b})`;
}

function paletteFor(catColor) {
  const rgb = hexToRgb(catColor) || hexToRgb('#7a7368');
  return {
    bg: rgbStr(muted(rgb, 0.85)),
    stripe: rgbStr(muted(rgb, 0.7)),
    fg: rgbStr(muted(rgb, 0.25)),
  };
}

function escapeXml(s) {
  return String(s).replace(/[<>&'"]/g, (c) => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;',
  }[c]));
}

export function placeholderSVG(resource, catShortLabel, catColor, w = 480, h = 300) {
  const pal = paletteFor(catColor);
  const seed = hashStr(resource.id || resource.title || '');
  const angle = 20 + (seed % 50);
  const variant = seed % 3;
  const orn = variant === 0
    ? `<circle cx="${w - 60}" cy="60" r="26" fill="none" stroke="${pal.fg}" stroke-width="1"/>`
    : variant === 1
      ? `<rect x="${w - 86}" y="34" width="52" height="52" fill="none" stroke="${pal.fg}" stroke-width="1"/>`
      : `<path d="M${w - 86} 86 L${w - 34} 34" stroke="${pal.fg}" stroke-width="1" fill="none"/>
         <path d="M${w - 86} 34 L${w - 34} 86" stroke="${pal.fg}" stroke-width="1" fill="none"/>`;

  const patternId = `p-${(resource.id || 'x').toString().replace(/[^a-z0-9]/gi, '')}`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
    <defs>
      <pattern id="${patternId}" patternUnits="userSpaceOnUse" width="14" height="14" patternTransform="rotate(${angle})">
        <rect width="14" height="14" fill="${pal.bg}"/>
        <line x1="0" y1="0" x2="0" y2="14" stroke="${pal.stripe}" stroke-width="1.2"/>
      </pattern>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#${patternId})"/>
    ${orn}
    <g font-family="'IBM Plex Mono', ui-monospace, monospace" fill="${pal.fg}">
      <text x="24" y="36" font-size="11" letter-spacing="1.4" opacity="0.75">${escapeXml((catShortLabel || '').toUpperCase())}</text>
      <text x="24" y="${h - 24}" font-size="10" letter-spacing="0.6" opacity="0.6">OER · PH ZÜRICH</text>
    </g>
  </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}
