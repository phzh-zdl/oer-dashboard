import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase.js';

const empty = {
  id: '',
  label: '',
  short: '',
  color: '#4a4528',
  sort_order: 100,
};

const ID_REGEX = /^[a-z0-9_-]{1,32}$/;
const HEX_REGEX = /^#[0-9a-fA-F]{6}$/;

export default function CategoryForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;
    setLoading(true);
    supabase.from('categories').select('*').eq('id', id).single().then(({ data, error }) => {
      if (cancelled) return;
      if (error) { setError(error); setLoading(false); return; }
      setForm({
        id: data.id,
        label: data.label || '',
        short: data.short || '',
        color: data.color || '#4a4528',
        sort_order: data.sort_order ?? 100,
      });
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [id, isEdit]);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!isEdit && !ID_REGEX.test(form.id)) {
      setError(new Error('ID muss aus 1–32 Zeichen Kleinbuchstaben, Ziffern, "-" oder "_" bestehen.'));
      return;
    }
    if (!form.label.trim()) { setError(new Error('Label ist Pflicht.')); return; }
    if (!form.short.trim()) { setError(new Error('Kurzform ist Pflicht.')); return; }
    if (!HEX_REGEX.test(form.color)) {
      setError(new Error('Farbe muss im Format #RRGGBB sein.'));
      return;
    }

    setSaving(true);
    try {
      const payload = {
        label: form.label.trim(),
        short: form.short.trim(),
        color: form.color,
        sort_order: Number(form.sort_order) || 0,
      };
      if (isEdit) {
        const { error: dbErr } = await supabase.from('categories').update(payload).eq('id', id);
        if (dbErr) throw dbErr;
      } else {
        const { error: dbErr } = await supabase.from('categories').insert({ ...payload, id: form.id });
        if (dbErr) throw dbErr;
      }
      navigate('/admin/app/categories');
    } catch (e) {
      setError(e);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="loading-state">Lade …</div>;

  return (
    <>
      <div className="admin-page-head">
        <h1>{isEdit ? 'Kategorie bearbeiten' : 'Neue Kategorie'}</h1>
        <Link to="/admin/app/categories" className="admin-btn admin-btn-ghost">Abbrechen</Link>
      </div>

      <form onSubmit={handleSubmit} className="admin-form">
        <label>
          <span>ID *</span>
          <input
            type="text"
            value={form.id}
            onChange={(e) => set('id', e.target.value.toLowerCase())}
            disabled={isEdit}
            required
            maxLength={32}
            placeholder="z. B. bpa, mi, uek"
          />
          <small>
            {isEdit
              ? 'Die ID lässt sich nach dem Anlegen nicht mehr ändern, weil sie als Schlüssel an Ressourcen hängt.'
              : 'Kleinbuchstaben, Ziffern, "-" oder "_". Wird als interner Schlüssel verwendet.'}
          </small>
        </label>

        <label>
          <span>Label (Langform) *</span>
          <input
            type="text"
            value={form.label}
            onChange={(e) => set('label', e.target.value)}
            required
            placeholder="z. B. Berufspraktische Ausbildung"
          />
        </label>

        <label>
          <span>Kurzform *</span>
          <input
            type="text"
            value={form.short}
            onChange={(e) => set('short', e.target.value)}
            required
            placeholder="z. B. Berufspraxis"
          />
          <small>Erscheint in den Pillen oben im Katalog.</small>
        </label>

        <label>
          <span>Farbe (Hex) *</span>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <input
              type="color"
              value={form.color}
              onChange={(e) => set('color', e.target.value)}
              style={{ width: 60, height: 36, padding: 2, cursor: 'pointer' }}
            />
            <input
              type="text"
              value={form.color}
              onChange={(e) => set('color', e.target.value)}
              required
              maxLength={7}
              pattern="^#[0-9a-fA-F]{6}$"
              style={{ width: 120 }}
            />
          </div>
          <small>Wird als Akzentfarbe in Karten und Pillen genutzt.</small>
        </label>

        <label>
          <span>Reihenfolge</span>
          <input
            type="number"
            value={form.sort_order}
            onChange={(e) => set('sort_order', e.target.value)}
            min={0}
            max={9999}
          />
          <small>Niedrigere Werte erscheinen zuerst. Tipp: in 10er-Schritten (10, 20, 30 …) für leichteres Umsortieren.</small>
        </label>

        {error && <div className="auth-msg auth-msg-err">Fehler: {error.message}</div>}

        <div className="admin-form-actions">
          <Link to="/admin/app/categories" className="admin-btn admin-btn-ghost">Abbrechen</Link>
          <button type="submit" disabled={saving} className="admin-btn admin-btn-primary">
            {saving ? 'Speichere …' : (isEdit ? 'Änderungen speichern' : 'Kategorie anlegen')}
          </button>
        </div>
      </form>
    </>
  );
}
