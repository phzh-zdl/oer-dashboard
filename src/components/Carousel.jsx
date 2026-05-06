import { useState, useEffect } from 'react';
import { safeHttps } from '../lib/safeHttps.js';
import { resolveImage } from '../lib/image.js';

// ─────────── Deterministischer Shuffle ───────────
function seededRandom(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}
function shuffleWithSeed(arr, seed) {
  const rnd = seededRandom(seed);
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function dayOfYear(d = new Date()) {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d - start) / 86400000);
}

// Gepinnte (featured=true) zuerst, danach täglich rotierender Rest.
// Heute sieht jede:r dieselbe Auswahl — fair und konsistent.
export function pickDailyFeatured(resources) {
  const pinned = resources.filter((r) => r.featured);
  const rest = resources.filter((r) => !r.featured);
  const seed = dayOfYear() * 2654435761;
  const shuffled = shuffleWithSeed(rest, seed);
  const combined = [...pinned, ...shuffled];
  return combined.slice(0, Math.max(9, pinned.length));
}

function dailyPeriodLabel() {
  const d = new Date();
  const months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  return `Tagesauswahl · ${d.getDate()}. ${months[d.getMonth()]} ${d.getFullYear()}`;
}

// ─────────── Karte im Karussell ───────────
function FeaturedCard({ resource, category }) {
  const url = safeHttps(resource.url);
  if (!url) return null;
  const cat = category || { label: '—', short: '—', color: '#6b6e75' };
  const img = resolveImage(resource, cat, 560, 340);
  const catStyle = { '--cat-color': cat.color };
  const tags = (resource.tags && resource.tags.length) ? resource.tags : ['Material'];
  return (
    <a className="featured-card rcard rcard-grid d-cozy" style={catStyle} href={url} target="_blank" rel="noopener noreferrer">
      <div className="rcard-img" style={{ backgroundImage: `url("${img}")` }} />
      <div className="rcard-body">
        <div className="rcard-cat"><span className="cat-swatch" /> {cat.label}</div>
        <h3 className="rcard-title">{resource.title}</h3>
        <p className="rcard-desc">{resource.description}</p>
        <div className="rcard-foot">
          <span className="tag-list">{tags.map((t, i) => <span key={i} className="tag">{t}</span>)}</span>
          <span className="link-arrow">Öffnen ↗</span>
        </div>
      </div>
    </a>
  );
}

// ─────────── Karussell ───────────
export function Carousel({ items, categoriesById }) {
  const [idx, setIdx] = useState(0);
  const [pausedUntil, setPausedUntil] = useState(0);
  const count = items.length;
  const visible = 3;
  const maxIdx = Math.max(1, count - visible + 1);

  useEffect(() => {
    if (count <= visible) return;
    // Auf Mobile (≤780px) übernimmt natives Scroll-Snap die Navigation —
    // Auto-Rotation wäre dort nervig, weil sie das Touch-Scrollen
    // permanent zurücksetzen würde.
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 780px)').matches) return;
    const t = setInterval(() => {
      if (Date.now() < pausedUntil) return;
      setIdx((i) => (i + 1) % maxIdx);
    }, 7000);
    return () => clearInterval(t);
  }, [count, pausedUntil, maxIdx]);

  const bumpPause = () => setPausedUntil(Date.now() + 12000);
  const prev = () => { bumpPause(); setIdx((i) => (i - 1 + maxIdx) % maxIdx); };
  const next = () => { bumpPause(); setIdx((i) => (i + 1) % maxIdx); };

  if (count === 0) return null;

  return (
    <section className="featured" id="featured">
      <div className="featured-head">
        <div>
          <div className="section-label">Redaktionell ausgewählt</div>
          <h2 className="section-title">Im Fokus</h2>
          <div className="period-label">{dailyPeriodLabel()}</div>
        </div>
        <div className="featured-ctrl">
          <button onClick={prev} aria-label="Zurück">←</button>
          <span className="pager">{idx + 1}–{Math.min(idx + visible, count)} / {count}</span>
          <button onClick={next} aria-label="Weiter">→</button>
        </div>
      </div>

      <div className="featured-viewport">
        <div className="featured-track" style={{ transform: `translateX(calc(${-idx} * (100% / ${visible})))` }}>
          {items.map((r) => (
            <FeaturedCard key={r.id} resource={r} category={categoriesById[r.category_id]} />
          ))}
        </div>
      </div>
    </section>
  );
}
