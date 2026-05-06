import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Wenn die Env-Vars fehlen, wollen wir NICHT beim Modul-Load werfen —
// sonst rendert React gar nichts und der User sieht eine leere Seite.
// Stattdessen exportieren wir einen Fehler-String, den die UI prüfen kann.
export let configError = null;

let _client = null;
if (!url || !anonKey) {
  configError =
    'VITE_SUPABASE_URL oder VITE_SUPABASE_ANON_KEY sind nicht gesetzt.\n' +
    'Lokal: lege .env.local nach .env.example an und starte `npm run dev` neu.\n' +
    'Auf Netlify: Site settings → Environment variables, dann Deploys → Trigger deploy → Clear cache and deploy site.';
} else {
  try {
    _client = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  } catch (e) {
    configError = `Supabase-Client konnte nicht initialisiert werden: ${e.message}`;
  }
}

export const supabase = _client;
