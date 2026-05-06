import { supabase } from './supabase.js';
import { placeholderSVG } from './placeholder.js';

const BUCKET = 'resource-images';

// Liefert die Public-URL für ein hochgeladenes Bild, oder das Placeholder-SVG
// falls kein image_path gesetzt ist. Beide Fälle ergeben einen string, den
// man direkt als <img src> oder background-image: url() verwenden kann.
export function resolveImage(resource, category, w = 480, h = 300) {
  if (resource.image_path) {
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(resource.image_path);
    if (data && data.publicUrl) return data.publicUrl;
  }
  return placeholderSVG(
    resource,
    category ? category.short : '',
    category ? category.color : '#7a7368',
    w,
    h
  );
}

export const RESOURCE_BUCKET = BUCKET;
