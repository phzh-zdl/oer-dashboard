import { useState, useEffect } from 'react';

// Header mit eingeklapptem Mobile-Menü.
// Logo via background-image (siehe styles.css), echtes Logo durch
// Austausch von src/assets/phzh-logo.png ersetzbar.
export function Topbar({ totalCount, categoryCount }) {
  const [menuOpen, setMenuOpen] = useState(false);

  // ESC schliesst das Menü, Klick außerhalb auch — über Body-Click-Handler.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="topbar">
      <div className="topbar-row">
        <a href="/" className="wordmark">
          <span className="wm-logo" role="img" aria-label="Pädagogische Hochschule Zürich" />
          <span className="wm-sep">·</span>
          <span className="wm-product">Open Educational Resources</span>
        </a>

        <button
          className="topbar-burger"
          aria-label={menuOpen ? 'Menü schliessen' : 'Menü öffnen'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span aria-hidden="true">{menuOpen ? '×' : '☰'}</span>
        </button>

        <nav className={`topbar-nav ${menuOpen ? 'is-open' : ''}`}>
          <a href="#featured" onClick={closeMenu}>Im&nbsp;Fokus</a>
          <a href="#katalog" onClick={closeMenu}>Katalog</a>
          <a href="#ueber" onClick={closeMenu}>Über</a>
          <a href="/admin" className="topbar-cta" onClick={closeMenu}>Admin&nbsp;↗</a>
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
