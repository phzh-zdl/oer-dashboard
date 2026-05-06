import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';

// Lädt alle Kategorien sortiert nach sort_order, dann label.
export function useCategories() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    supabase
      .from('categories')
      .select('id, label, short, color, sort_order')
      .order('sort_order', { ascending: true })
      .order('label', { ascending: true })
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
