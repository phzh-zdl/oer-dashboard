// Generates a subtly-striped SVG placeholder with a category hint and resource title.
// Returns a data: URL usable as an <img src>.

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function categoryPalette(catId) {
  // Each category gets a consistent muted hue, all at similar chroma/lightness.
  const map = {
    bpa: { bg: '#eae4d6', stripe: '#d8cfb9', fg: '#5a4e30' },
    spr: { bg: '#e4e0d4', stripe: '#d1cbb9', fg: '#4a4530' },
    nmg: { bg: '#dbe3d8', stripe: '#c5d0bf', fg: '#2f4a36' },
    ges: { bg: '#ede0d8', stripe: '#dcc9bd', fg: '#5a3824' },
    mus: { bg: '#e0dbe6', stripe: '#cbc3d5', fg: '#42365a' },
    bs:  { bg: '#dde3e6', stripe: '#c3ced3', fg: '#2c4550' },
    mi:  { bg: '#d9dfe6', stripe: '#bfc9d4', fg: '#2a3d55' },
    uek: { bg: '#e4e1d4', stripe: '#d0ccb9', fg: '#4d4728' },
    stw: { bg: '#e2dcd4', stripe: '#ccc5b9', fg: '#453c2b' },
    ibe: { bg: '#dce2de', stripe: '#c3cec7', fg: '#2e4a3f' },
  };
  return map[catId] || map.spr;
}

function escapeXml(s) {
  return String(s).replace(/[<>&'"]/g, c => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;'
  }[c]));
}

function placeholderSVG(resource, catLabel, w = 480, h = 300) {
  const pal = categoryPalette(resource.cat);
  const seed = hashStr(resource.id);
  // Vary stripe angle by category to give each section its own "weave"
  const angle = 20 + (seed % 50);
  // Vary element a bit per resource
  const variant = seed % 3;
  const orn = variant === 0
    ? `<circle cx="${w - 60}" cy="60" r="26" fill="none" stroke="${pal.fg}" stroke-width="1"/>`
    : variant === 1
      ? `<rect x="${w - 86}" y="34" width="52" height="52" fill="none" stroke="${pal.fg}" stroke-width="1"/>`
      : `<path d="M${w - 86} 86 L${w - 34} 34" stroke="${pal.fg}" stroke-width="1" fill="none"/>
         <path d="M${w - 86} 34 L${w - 34} 86" stroke="${pal.fg}" stroke-width="1" fill="none"/>`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
    <defs>
      <pattern id="p-${resource.id}" patternUnits="userSpaceOnUse" width="14" height="14" patternTransform="rotate(${angle})">
        <rect width="14" height="14" fill="${pal.bg}"/>
        <line x1="0" y1="0" x2="0" y2="14" stroke="${pal.stripe}" stroke-width="1.2"/>
      </pattern>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#p-${resource.id})"/>
    ${orn}
    <g font-family="'IBM Plex Mono', ui-monospace, monospace" fill="${pal.fg}">
      <text x="24" y="36" font-size="11" letter-spacing="1.4" opacity="0.75">${escapeXml(catLabel.toUpperCase())}</text>
      <text x="24" y="${h - 24}" font-size="10" letter-spacing="0.6" opacity="0.6">OER · PH ZÜRICH</text>
    </g>
  </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

window.PHZH_PLACEHOLDER = { placeholderSVG, categoryPalette };
