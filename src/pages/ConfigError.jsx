// Wird gerendert, wenn VITE_SUPABASE_URL/ANON_KEY fehlen oder der Client
// nicht initialisiert werden konnte. Verhindert, dass die App komplett
// stumm bleibt (leere Seite), wenn die Env-Konfiguration kaputt ist.
export default function ConfigError({ message }) {
  return (
    <div className="error-state">
      <h1>Konfigurationsproblem</h1>
      <p>Die Seite kann nicht starten, weil die Verbindung zu Supabase noch nicht eingerichtet ist.</p>
      <pre>{message}</pre>
      <p>
        Nach dem Setzen der Env-Vars: lokal Dev-Server neu starten,
        auf Netlify einen <strong>Trigger deploy → Clear cache and deploy site</strong> auslösen,
        damit die neuen Werte in den Build einfliessen.
      </p>
    </div>
  );
}
