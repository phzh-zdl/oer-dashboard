import { useMemo, useState, useEffect } from 'react';
import { useResources } from '../hooks/useResources.js';
import { useCategories } from '../hooks/useCategories.js';
import { Topbar } from '../components/Topbar.jsx';
import { SearchBar } from '../components/SearchBar.jsx';
import { Carousel, pickDailyFeatured } from '../components/Carousel.jsx';
import { CategoryNav } from '../components/CategoryNav.jsx';
import { ResourceCard } from '../components/ResourceCard.jsx';

export default function Catalog() {
  const { data: resources, loading: resLoading, error: resError } = useResources();
  const { data: categories, loading: catLoading, error: catError } = useCategories();

  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('all');
  const [activeTag, setActiveTag] = useState(null);

  const categoriesById = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c])),
    [categories]
  );

  const featured = useMemo(() => pickDailyFeatured(resources), [resources]);

  const counts = useMemo(() => {
    const c = { all: resources.length };
    for (const r of resources) c[r.category_id] = (c[r.category_id] || 0) + 1;
    return c;
  }, [resources]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return resources.filter((r) => {
      if (cat !== 'all' && r.category_id !== cat) return false;
      if (activeTag && !(r.tags || []).includes(activeTag)) return false;
      if (!q) return true;
      const catLabel = categoriesById[r.category_id]
        ? categoriesById[r.category_id].label.toLowerCase()
        : '';
      return (
        r.title.toLowerCase().includes(q) ||
        (r.description || '').toLowerCase().includes(q) ||
        (r.tags || []).some((t) => t.toLowerCase().includes(q)) ||
        catLabel.includes(q)
      );
    });
  }, [query, cat, activeTag, resources, categoriesById]);

  const availableTags = useMemo(() => {
    const set = new Set();
    for (const r of resources) {
      if (cat !== 'all' && r.category_id !== cat) continue;
      for (const t of (r.tags || [])) set.add(t);
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'de'));
  }, [resources, cat]);

  useEffect(() => {
    if (activeTag && !availableTags.includes(activeTag)) setActiveTag(null);
  }, [availableTags, activeTag]);

  const onCatSelect = (id) => {
    setCat(id);
    const el = document.getElementById('katalog');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (resLoading || catLoading) {
    return <div className="app"><div className="loading-state">Lade Ressourcen …</div></div>;
  }

  if (resError || catError) {
    return (
      <div className="app">
        <div className="error-state">
          <h1>Daten konnten nicht geladen werden.</h1>
          <pre>{(resError || catError).message}</pre>
          <p>Prüfe, ob VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY korrekt sind und die Migration in Supabase ausgeführt wurde.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Topbar totalCount={resources.length} categoryCount={categories.length} />

      <Carousel items={featured} categoriesById={categoriesById} />

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

        <CategoryNav categories={categories} active={cat} onSelect={onCatSelect} counts={counts} />

        {availableTags.length > 1 && (
          <div className="tag-bar">
            <span className="tag-bar-label">Format</span>
            <button
              className={'tag-chip' + (activeTag === null ? ' active' : '')}
              onClick={() => setActiveTag(null)}
            >Alle</button>
            {availableTags.map((t) => (
              <button
                key={t}
                className={'tag-chip' + (activeTag === t ? ' active' : '')}
                onClick={() => setActiveTag(activeTag === t ? null : t)}
              >{t}</button>
            ))}
          </div>
        )}

        <div className="result-meta">
          <span>{filtered.length} Ressource{filtered.length === 1 ? '' : 'n'}</span>
          {cat !== 'all' && (
            <span className="result-chip">
              {categoriesById[cat] ? categoriesById[cat].label : cat}
              <button onClick={() => setCat('all')} aria-label="Filter entfernen">×</button>
            </span>
          )}
          {activeTag && (
            <span className="result-chip">
              {activeTag}
              <button onClick={() => setActiveTag(null)} aria-label="Tag entfernen">×</button>
            </span>
          )}
          {query && (
            <span className="result-chip">
              „{query}"
              <button onClick={() => setQuery('')} aria-label="Suche leeren">×</button>
            </span>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-mark">∅</div>
            <p>Keine Ressource entspricht dieser Kombination.</p>
            <button onClick={() => { setQuery(''); setCat('all'); setActiveTag(null); }}>
              Filter zurücksetzen
            </button>
          </div>
        ) : (
          <div className="grid grid-grid">
            {filtered.map((r) => (
              <ResourceCard
                key={r.id}
                resource={r}
                category={categoriesById[r.category_id]}
                layout="grid"
                density="comfortable"
              />
            ))}
          </div>
        )}
      </section>

      <footer className="site-foot" id="ueber">
        <div className="foot-col">
          <div className="foot-title">Über diese Sammlung</div>
          <p>Diese Seite versammelt frei zugängliche Lehr- und Lernmaterialien aus Lehre, Forschung und Weiterbildung der PH&nbsp;Zürich. Die Auswahl wird redaktionell kuratiert und laufend ergänzt.</p>
        </div>
        <div className="foot-col">
          <div className="foot-title">Mitwirken</div>
          <p>Sie haben eine Ressource, die hier Platz haben sollte? Wir freuen uns über Hinweise und Einreichungen aus dem Kollegium und von Praxispartner:innen.</p>
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
    </div>
  );
}
