import { Link } from 'react-router-dom';
import { useResources } from '../../hooks/useResources.js';
import { useCategories } from '../../hooks/useCategories.js';
import { supabase } from '../../lib/supabase.js';
import { deleteImage } from '../../lib/storage.js';
import { useState } from 'react';

export default function ResourceList() {
  const { data: resources, loading, error, reload } = useResources();
  const { data: categories } = useCategories();
  const [busyId, setBusyId] = useState(null);

  const catLabel = (id) => categories.find((c) => c.id === id)?.short || id;

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

      {resources.length === 0 ? (
        <div className="admin-empty">
          Noch keine Ressourcen. Lege die erste an, oder führe <code>seed.sql</code> in Supabase aus.
        </div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Titel</th>
              <th>Kategorie</th>
              <th>Tags</th>
              <th>Featured</th>
              <th>Bild</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {resources.map((r) => (
              <tr key={r.id}>
                <td>
                  <Link to={`/admin/app/${r.id}/edit`} className="admin-table-title">{r.title}</Link>
                  <div className="admin-table-sub">{r.description.slice(0, 80)}{r.description.length > 80 ? '…' : ''}</div>
                </td>
                <td>{catLabel(r.category_id)}</td>
                <td className="admin-table-tags">{(r.tags || []).join(', ')}</td>
                <td>{r.featured ? '★' : ''}</td>
                <td>{r.image_path ? '✓' : '—'}</td>
                <td className="admin-table-actions">
                  <Link to={`/admin/app/${r.id}/edit`} className="admin-btn admin-btn-ghost">Bearbeiten</Link>
                  <button
                    onClick={() => handleDelete(r)}
                    disabled={busyId === r.id}
                    className="admin-btn admin-btn-danger"
                  >
                    {busyId === r.id ? '…' : 'Löschen'}
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
