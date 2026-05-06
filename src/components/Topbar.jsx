// Kompakter Header — entspricht visuell dem ClaudeDesign-Prototyp,
// aber das Logo ist als Text gerendert (kein externes PNG mehr).
// Wenn ein echtes Logo gewünscht ist: Datei in src/assets/ ablegen,
// und in styles.css `.wm-logo` mit `background-image: url(...)` setzen.
export function Topbar({ totalCount, categoryCount }) {
  return (
    <header className="topbar">
      <div className="topbar-row">
        <a href="#" className="wordmark" aria-label="Pädagogische Hochschule Zürich">
          <span className="wm-logo">PH Zürich</span>
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
