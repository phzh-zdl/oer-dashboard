import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useCategories } from '../../hooks/useCategories.js';
import { useResources } from '../../hooks/useResources.js';
import { supabase } from '../../lib/supabase.js';

export default function CategoryList() {
  const { data: categories, loading: catLoading, error: catError, reload } = useCategories();
  const { data: resources, loading: resLoading } = useResources();
  const [busyId, setBusyId] = useState(null);

  // Anzahl Ressourcen pro Kategorie zur Anzeige + Lösch-Schutz.
  const counts = {};
  for (const r of resources) counts[r.category_id] = (counts[r.category_id] || 0) + 1;

  async function handleDelete(category) {
    const n = counts[category.id] || 0;
    if (n > 0) {
      alert(
        `Kategorie „${category.label}" wird von ${n} Ressource${n === 1 ? '' : 'n'} verwendet.\n\n` +
        `Häng die Ressourcen erst auf eine andere Kategorie um (oder lösche sie), dann lässt sich die Kategorie entfernen.`
      );
      return;
    }
    if (!window.confirm(`Kategorie „${category.label}" wirklich löschen?`)) return;
    setBusyId(category.id);
    try {
      const { error } = await supabase.from('categories').delete().eq('id', category.id);
      if (error) throw error;
      reload();
    } catch (e) {
      alert(`Löschen fehlgeschlagen: ${e.message}`);
    } finally {
      setBusyId(null);
    }
  }

  if (catLoading || resLoading) return <div className="loading-state">Lade …</div>;
  if (catError) return (
    <div className="error-state">
      <h1>Konnte Kategorien nicht laden</h1>
      <pre>{catError.message}</pre>
    </div>
  );

  return (
    <>
      <div className="admin-page-head">
        <h1>Kategorien</h1>
        <Link to="/admin/app/categories/new" className="admin-btn admin-btn-primary">+ Neue Kategorie</Link>
      </div>

      {categories.length === 0 ? (
        <div className="admin-empty">Noch keine Kategorien angelegt.</div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Label</th>
              <th>Kurzform</th>
              <th>Farbe</th>
              <th>Reihenfolge</th>
              <th>Ressourcen</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id}>
                <td><code>{c.id}</code></td>
                <td>
                  <Link to={`/admin/app/categories/${c.id}/edit`} className="admin-table-title">{c.label}</Link>
                </td>
                <td>{c.short}</td>
                <td>
                  <span className="cat-color-chip" style={{ background: c.color }} aria-hidden="true" />
                  <code style={{ marginLeft: 8 }}>{c.color}</code>
                </td>
                <td>{c.sort_order}</td>
                <td>{counts[c.id] || 0}</td>
                <td className="admin-table-actions">
                  <Link to={`/admin/app/categories/${c.id}/edit`} className="admin-btn admin-btn-ghost">Bearbeiten</Link>
                  <button
                    onClick={() => handleDelete(c)}
                    disabled={busyId === c.id}
                    className="admin-btn admin-btn-danger"
                  >
                    {busyId === c.id ? '…' : 'Löschen'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
