import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';

// Lädt alle Ressourcen aus Supabase. Returns: { data, loading, error, reload }.
// Reload via reload() oder bei mount.
export function useResources() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    supabase
      .from('resources')
      .select('id, title, description, category_id, url, tags, image_path, featured, created_at, updated_at')
      .order('updated_at', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setError(error);
          setData([]);
        } else {
          setError(null);
          setData(data || []);
        }
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [tick]);

  return { data: data || [], loading, error, reload: () => setTick((t) => t + 1) };
}
