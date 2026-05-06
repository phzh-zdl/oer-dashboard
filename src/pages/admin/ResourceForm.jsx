import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link, useOutletContext } from 'react-router-dom';
import { supabase } from '../../lib/supabase.js';
import { useCategories } from '../../hooks/useCategories.js';
import { safeHttps } from '../../lib/safeHttps.js';
import { uploadImage, deleteImage, validateImageFile } from '../../lib/storage.js';
import { resolveImage } from '../../lib/image.js';

const empty = {
  title: '',
  description: '',
  category_id: '',
  url: '',
  tags: 'Material',
  featured: false,
  image_path: null,
};

// Mode wird über die Anwesenheit von :id im Route-Param erkannt.
export default function ResourceForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { session } = useOutletContext();
  const { data: categories, loading: catLoading } = useCategories();

  const [form, setForm] = useState(empty);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Im Edit-Modus: Resource laden
  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;
    setLoading(true);
    supabase
      .from('resources')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) { setError(error); setLoading(false); return; }
        setForm({
          title: data.title || '',
          description: data.description || '',
          category_id: data.category_id || '',
          url: data.url || '',
          tags: (data.tags || []).join(', '),
          featured: !!data.featured,
          image_path: data.image_path || null,
        });
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id, isEdit]);

  // Sobald Kategorien geladen und im create-Mode noch nichts gewählt: erste vorbelegen.
  useEffect(() => {
    if (!isEdit && !form.category_id && categories.length > 0) {
      setForm((f) => ({ ...f, category_id: categories[0].id }));
    }
  }, [categories, isEdit, form.category_id]);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) { setImageFile(null); setImagePreview(null); return; }
    const err = validateImageFile(file);
    if (err) { alert(err); e.target.value = ''; return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleRemoveExistingImage() {
    if (!form.image_path) return;
    if (!window.confirm('Bestehendes Bild wirklich aus dem Storage löschen?')) return;
    try {
      await deleteImage(form.image_path);
      // DB-Eintrag wird beim Submit aktualisiert; hier nur Form-State
      set('image_path', null);
    } catch (e) {
      alert(`Löschen fehlgeschlagen: ${e.message}`);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    // URL-Validierung clientseitig (DB hat einen check-Constraint zusätzlich)
    if (!safeHttps(form.url)) {
      setError(new Error('URL muss mit https:// beginnen.'));
      return;
    }
    if (!form.title.trim()) { setError(new Error('Titel ist Pflicht.')); return; }
    if (!form.category_id) { setError(new Error('Kategorie ist Pflicht.')); return; }

    setSaving(true);
    try {
      let nextImagePath = form.image_path;

      // 1. Wenn neue Datei hochgeladen wurde: zuerst in Storage uploaden,
      //    dann (bei edit) das alte Bild löschen.
      if (imageFile) {
        nextImagePath = await uploadImage(imageFile);
        if (isEdit && form.image_path && form.image_path !== nextImagePath) {
          await deleteImage(form.image_path);
        }
      }

      const tagsArr = form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        category_id: form.category_id,
        url: form.url.trim(),
        tags: tagsArr.length ? tagsArr : ['Material'],
        featured: !!form.featured,
        image_path: nextImagePath,
        updated_by: session.user.id,
      };

      if (isEdit) {
        const { error: dbErr } = await supabase.from('resources').update(payload).eq('id', id);
        if (dbErr) {
          // Falls Update scheitert, neu hochgeladenes Bild rückwärts wegräumen
          if (imageFile && nextImagePath !== form.image_path) await deleteImage(nextImagePath);
          throw dbErr;
        }
      } else {
        const { error: dbErr } = await supabase.from('resources').insert({
          ...payload,
          created_by: session.user.id,
        });
        if (dbErr) {
          if (imageFile && nextImagePath) await deleteImage(nextImagePath);
          throw dbErr;
        }
      }

      navigate('/admin/app');
    } catch (e) {
      setError(e);
    } finally {
      setSaving(false);
    }
  }

  if (loading || catLoading) {
    return <div className="loading-state">Lade …</div>;
  }

  const currentImageUrl = imagePreview ||
    (form.image_path
      ? resolveImage({ image_path: form.image_path, id: id || 'new', title: form.title }, categories.find((c) => c.id === form.category_id), 480, 300)
      : null);

  return (
    <>
      <div className="admin-page-head">
        <h1>{isEdit ? 'Ressource bearbeiten' : 'Neue Ressource'}</h1>
        <Link to="/admin/app" className="admin-btn admin-btn-ghost">Abbrechen</Link>
      </div>

      <form onSubmit={handleSubmit} className="admin-form">
        <label>
          <span>Titel *</span>
          <input
            type="text"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            required
            maxLength={300}
          />
        </label>

        <label>
          <span>Beschreibung</span>
          <textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            rows={5}
          />
        </label>

        <label>
          <span>Kategorie *</span>
          <select
            value={form.category_id}
            onChange={(e) => set('category_id', e.target.value)}
            required
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </label>

        <label>
          <span>URL * (https://…)</span>
          <input
            type="url"
            value={form.url}
            onChange={(e) => set('url', e.target.value)}
            placeholder="https://…"
            required
          />
        </label>

        <label>
          <span>Tags (Komma-getrennt)</span>
          <input
            type="text"
            value={form.tags}
            onChange={(e) => set('tags', e.target.value)}
            placeholder="Leitfaden, Material"
          />
          <small>Erster Tag erscheint als primärer Format-Filter; weitere als zusätzliche Chips.</small>
        </label>

        <label className="admin-form-check">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(e) => set('featured', e.target.checked)}
          />
          <span>Im Karussell „Im Fokus" hervorheben</span>
        </label>

        <fieldset className="admin-form-image">
          <legend>Bild</legend>
          {currentImageUrl && (
            <div
              className="admin-image-preview"
              style={{ backgroundImage: `url("${currentImageUrl}")` }}
              role="img"
              aria-label="Bildvorschau"
            />
          )}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
            onChange={handleFile}
          />
          <small>PNG, JPEG, WebP, GIF oder SVG, max. 5 MB. Wird beim Speichern in Supabase Storage hochgeladen.</small>
          {imageFile && <div className="admin-form-hint">Neues Bild wird beim Speichern hochgeladen: {imageFile.name}</div>}
          {form.image_path && !imageFile && (
            <button type="button" onClick={handleRemoveExistingImage} className="admin-btn admin-btn-ghost">
              Bestehendes Bild entfernen
            </button>
          )}
        </fieldset>

        {error && <div className="auth-msg auth-msg-err">Fehler: {error.message}</div>}

        <div className="admin-form-actions">
          <Link to="/admin/app" className="admin-btn admin-btn-ghost">Abbrechen</Link>
          <button type="submit" disabled={saving} className="admin-btn admin-btn-primary">
            {saving ? 'Speichere …' : (isEdit ? 'Änderungen speichern' : 'Ressource anlegen')}
          </button>
        </div>
      </form>
    </>
  );
}
