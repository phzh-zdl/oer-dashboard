import { Link } from 'react-router-dom';
import { resolveImage } from '../lib/image.js';

// Wie eine Katalog-Kachel, aber:
//  - Card-Body (Bild, Titel) klickt auf das Edit-Form, nicht auf die externe URL
//  - Footer enthält Bearbeiten-/Löschen-Buttons statt „Öffnen ↗"
//  - „Im Fokus"-Badge oben rechts auf dem Bild
//  - „aktualisiert vor X" als kleiner Vermerk
//
// Aktion-Buttons sind absichtlich AUSSERHALB des Link-Wrappers, damit
// Klick auf „Löschen" nicht gleichzeitig auf das Edit-Form navigiert.
function relativeTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'gerade eben';
  if (diff < 3600) return `vor ${Math.floor(diff / 60)} Min`;
  if (diff < 86400) return `vor ${Math.floor(diff / 3600)} Std`;
  if (diff < 30 * 86400) return `vor ${Math.floor(diff / 86400)} Tagen`;
  return d.toLocaleDateString('de-CH');
}

export function AdminResourceCard({ resource, category, onDelete, deleting }) {
  const cat = category || { label: '—', short: '—', color: '#6b6e75' };
  const img = resolveImage(resource, cat, 480, 300);
  const catStyle = { '--cat-color': cat.color };
  const tags = (resource.tags && resource.tags.length) ? resource.tags : ['Material'];
  const editPath = `/admin/app/${resource.id}/edit`;

  return (
    <div className="rcard rcard-grid d-comfortable admin-rcard" style={catStyle}>
      <Link to={editPath} className="admin-rcard-content">
        <div className="rcard-img" style={{ backgroundImage: `url("${img}")` }}>
          {resource.featured && <span className="admin-rcard-badge">★ Im Fokus</span>}
          {!resource.image_path && <span className="admin-rcard-noimg">kein Bild</span>}
        </div>
        <div className="rcard-body">
          <div className="rcard-cat"><span className="cat-swatch" /> {cat.label}</div>
          <h3 className="rcard-title">{resource.title}</h3>
          {resource.description && <p className="rcard-desc">{resource.description}</p>}
          <div className="rcard-foot">
            <span className="tag-list">{tags.map((t, i) => <span key={i} className="tag">{t}</span>)}</span>
          </div>
          <div className="admin-rcard-meta">
            aktualisiert {relativeTime(resource.updated_at)}
          </div>
        </div>
      </Link>
      <div className="admin-rcard-actions">
        <Link to={editPath} className="admin-btn admin-btn-ghost">Bearbeiten</Link>
        <button
          onClick={onDelete}
          disabled={deleting}
          className="admin-btn admin-btn-danger"
        >
          {deleting ? '…' : 'Löschen'}
        </button>
      </div>
    </div>
  );
}
