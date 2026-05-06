// Kompakter Header — Logo via background-image (siehe styles.css).
// Logo-Datei: src/assets/phzh-logo.png — wird von Vite gebündelt und
// gefingerprintet (Cache-Busting bei Wechsel). Tausch über das File reicht.
export function Topbar({ totalCount, categoryCount }) {
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
          <a href="/admin" className="topbar-cta">Admin&nbsp;↗</a>
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
          <span>CC-lizenziert</span>
        </div>
      </div>
    </header>
  );
}
