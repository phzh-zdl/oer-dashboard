import { supabase } from './supabase.js';
import { RESOURCE_BUCKET } from './image.js';

// Erlaubte Bild-Typen — entspricht dem accept-Attribut im File-Input.
const ALLOWED = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml'];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

function slugify(name) {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function extOf(name) {
  const m = /\.([a-z0-9]{1,8})$/i.exec(name || '');
  return m ? m[1].toLowerCase() : 'bin';
}

export function validateImageFile(file) {
  if (!file) return 'Keine Datei ausgewählt.';
  if (file.size > MAX_BYTES) return `Datei ist zu groß (max. ${MAX_BYTES / 1024 / 1024} MB).`;
  if (!ALLOWED.includes(file.type)) return `Format nicht unterstützt: ${file.type || 'unbekannt'}. Erlaubt: PNG, JPEG, WebP, GIF, SVG.`;
  return null;
}

// Lädt ein Bild in den Storage-Bucket. Liefert den Pfad zum Speichern in
// resources.image_path. Pfad-Schema: <uuid>-<slug>.<ext> — Kollisionen
// praktisch ausgeschlossen, kein Überschreiben (upsert: false).
export async function uploadImage(file) {
  const err = validateImageFile(file);
  if (err) throw new Error(err);
  const base = file.name.replace(/\.[^.]+$/, '');
  const path = `${crypto.randomUUID()}-${slugify(base)}.${extOf(file.name)}`;
  const { error } = await supabase.storage
    .from(RESOURCE_BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: false });
  if (error) throw error;
  return path;
}

// Löscht ein Bild aus dem Bucket. No-op bei leerem Pfad.
export async function deleteImage(path) {
  if (!path) return;
  const { error } = await supabase.storage.from(RESOURCE_BUCKET).remove([path]);
  // Fehler beim Löschen sind nicht fatal — wir loggen sie nur.
  if (error) console.warn('deleteImage failed:', error);
}
