import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useResources } from '../../hooks/useResources.js';
import { useCategories } from '../../hooks/useCategories.js';
import { supabase } from '../../lib/supabase.js';
import { deleteImage } from '../../lib/storage.js';
import { SearchBar } from '../../components/SearchBar.jsx';
import { AdminResourceCard } from '../../components/AdminResourceCard.jsx';

export default function ResourceList() {
  const { data: resources, loading, error, reload } = useResources();
  const { data: categories } = useCategories();
  const [busyId, setBusyId] = useState(null);
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('all');

  const categoriesById = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c])),
    [categories]
  );

  // Filtern: Suchstring matched Titel/Beschreibung/Tags/Kategorie-Label.
  // Sortierung kommt aus useResources (updated_at desc) — bewusst NICHT
  // umgeordnet wie im Public-Katalog, weil Admins typisch „was hab ich
  // grad bearbeitet" oder „was ist neu" suchen.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return resources.filter((r) => {
      if (cat !== 'all' && r.category_id !== cat) return false;
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
  }, [query, cat, resources, categoriesById]);

  async function handleDelete(resource) {
    const ok = window.confirm(`„${resource.title}" wirklich löschen? Das Bild im Storage wird mit gelöscht.`);
    if (!ok) return;
    setBusyId(resource.id);
    try {
      const { error: dbErr } = await supabase.from('resources').delete().eq('id', resource.id);
      if (dbErr) throw dbErr;
      await deleteImage(resource.image_path);
      reload();
    } catch (e) {
      alert(`Löschen fehlgeschlagen: ${e.message}`);
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <div className="loading-state">Lade Ressourcen …</div>;
  if (error) return (
    <div className="error-state">
      <h1>Konnte Ressourcen nicht laden</h1>
      <pre>{error.message}</pre>
    </div>
  );

  return (
    <>
      <div className="admin-page-head">
        <h1>Ressourcen</h1>
        <Link to="/admin/app/new" className="admin-btn admin-btn-primary">+ Neue Ressource</Link>
      </div>

      <div className="admin-toolbar">
        <SearchBar value={query} onChange={setQuery} />
        <select
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          className="admin-toolbar-select"
        >
          <option value="all">Alle Kategorien ({resources.length})</option>
          {categories.map((c) => {
            const n = resources.filter((r) => r.category_id === c.id).length;
            return <option key={c.id} value={c.id}>{c.label} ({n})</option>;
          })}
        </select>
      </div>

      <div className="admin-toolbar-meta">
        <span>{filtered.length} Ressource{filtered.length === 1 ? '' : 'n'}</span>
        <span className="admin-toolbar-sub">sortiert nach: zuletzt bearbeitet</span>
      </div>

      {filtered.length === 0 ? (
        <div className="admin-empty">
          {resources.length === 0
            ? <>Noch keine Ressourcen. Lege die erste an, oder führe <code>seed.sql</code> in Supabase aus.</>
            : <>Kein Treffer für diese Filter-Kombination.</>}
        </div>
      ) : (
        <div className="grid grid-grid">
          {filtered.map((r) => (
            <AdminResourceCard
              key={r.id}
              resource={r}
              category={categoriesById[r.category_id]}
              onDelete={() => handleDelete(r)}
              deleting={busyId === r.id}
            />
          ))}
        </div>
      )}
    </>
  );
}
