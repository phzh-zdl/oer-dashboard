import { safeHttps } from '../lib/safeHttps.js';
import { resolveImage } from '../lib/image.js';

// Eine Karte im Katalog. Layout grid|list, Dichte compact|comfortable.
// Karte wird nur gerendert, wenn die URL sicher https ist — alles andere wird
// stillschweigend übersprungen, damit kompromittierte Daten keine Links setzen.
export function ResourceCard({ resource, category, layout = 'grid', density = 'comfortable' }) {
  const url = safeHttps(resource.url);
  if (!url) return null;
  const cat = category || { label: '—', short: '—', color: '#6b6e75' };
  const img = resolveImage(resource, cat, 480, 300);
  const catStyle = { '--cat-color': cat.color };
  const tags = (resource.tags && resource.tags.length) ? resource.tags : ['Material'];

  if (layout === 'list') {
    return (
      <a className={`rcard rcard-list d-${density}`} style={catStyle} href={url} target="_blank" rel="noopener noreferrer">
        <div className="rcard-img-sm" style={{ backgroundImage: `url("${img}")` }} />
        <div className="rcard-body">
          <div className="rcard-cat"><span className="cat-swatch" /> {cat.label}</div>
          <h3 className="rcard-title">{resource.title}</h3>
          {density !== 'compact' && <p className="rcard-desc">{resource.description}</p>}
        </div>
        <div className="rcard-side">
          <span className="tag-list">{tags.map((t, i) => <span key={i} className="tag">{t}</span>)}</span>
          <span className="link-arrow">↗</span>
        </div>
      </a>
    );
  }

  return (
    <a className={`rcard rcard-grid d-${density}`} style={catStyle} href={url} target="_blank" rel="noopener noreferrer">
      <div className="rcard-img" style={{ backgroundImage: `url("${img}")` }} />
      <div className="rcard-body">
        <div className="rcard-cat"><span className="cat-swatch" /> {cat.label}</div>
        <h3 className="rcard-title">{resource.title}</h3>
        {density !== 'compact' && <p className="rcard-desc">{resource.description}</p>}
        <div className="rcard-foot">
          <span className="tag-list">{tags.map((t, i) => <span key={i} className="tag">{t}</span>)}</span>
          <span className="link-arrow">Öffnen ↗</span>
        </div>
      </div>
    </a>
  );
}
