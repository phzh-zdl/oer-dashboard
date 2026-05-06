export function CategoryNav({ categories, active, onSelect, counts }) {
  return (
    <div className="catnav">
      <button
        className={`catpill ${active === 'all' ? 'is-active' : ''}`}
        onClick={() => onSelect('all')}
      >
        <span>Alle Bereiche</span>
        <span className="catpill-n">{counts.all}</span>
      </button>
      {categories.map((c) => (
        <button
          key={c.id}
          className={`catpill ${active === c.id ? 'is-active' : ''}`}
          style={{ '--cat-color': c.color }}
          onClick={() => onSelect(c.id)}
        >
          <span className="cat-swatch" />
          <span>{c.short}</span>
          <span className="catpill-n">{counts[c.id] || 0}</span>
        </button>
      ))}
    </div>
  );
}
