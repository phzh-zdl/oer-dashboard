import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase.js';

// Ziel des Magic-Links. Drei Pfade:
//   1. PKCE (Supabase-Default seit 2024): URL hat ?code=... → wir tauschen
//      den Code gegen eine Session via exchangeCodeForSession().
//   2. Implicit (falls flowType: 'implicit'): URL hat #access_token=...
//      → supabase-js mit detectSessionInUrl:true erkennt das automatisch.
//   3. Bereits eingeloggt: getSession() liefert direkt Session zurück.
//
// Häufigster Fehlerfall: PKCE braucht den Code-Verifier im localStorage,
// der bei signInWithOtp() angelegt wurde. Klick im anderen Browser/Profil
// → Verifier fehlt → exchange schlägt fehl. Wir geben in dem Fall einen
// sprechenden Fehler aus statt eines stillen Timeouts.

const TIMEOUT_MS = 12000;

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Anmeldung läuft …');

  useEffect(() => {
    let done = false;
    let timer = null;

    function fail(message) {
      if (done) return;
      done = true;
      if (timer) clearTimeout(timer);
      navigate(`/admin?error=${encodeURIComponent(message)}`, { replace: true });
    }

    function succeed() {
      if (done) return;
      done = true;
      if (timer) clearTimeout(timer);
      navigate('/admin/app', { replace: true });
    }

    // Auth-State subscription — zieht falls supabase-js die Session
    // zwischenzeitlich selbst etabliert hat.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) succeed();
    });

    async function run() {
      // 1. Prüfen, ob bereits eine Session da ist.
      const { data: existing } = await supabase.auth.getSession();
      if (existing.session) { succeed(); return; }

      // 2. PKCE: ?code=... in der URL
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');
      const errorParam = url.searchParams.get('error_description') || url.searchParams.get('error');

      if (errorParam) {
        fail(`Login-Provider hat abgelehnt: ${decodeURIComponent(errorParam)}`);
        return;
      }

      if (code) {
        setStatus('Tausche Code gegen Session …');
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          // Typische Meldung wenn der Verifier im localStorage fehlt:
          // "code verifier" nicht gefunden, "invalid grant" o. ä.
          const hint = /verifier|invalid grant|code/i.test(error.message)
            ? 'Vermutlich öffnest du den Link in einem anderen Browser/Profil als angefordert. Magic Link nochmal von genau diesem Browser-Tab aus anfordern.'
            : 'Schau in der Browser-Console (F12) nach Details.';
          fail(`Code-Tausch fehlgeschlagen: ${error.message}. ${hint}`);
          return;
        }
        if (data.session) succeed();
        return;
      }

      // 3. Implicit-Flow: #access_token=... im Hash. supabase-js mit
      //    detectSessionInUrl:true sollte das beim Mount erkannt haben;
      //    falls nicht, ist die Session gleich nach onAuthStateChange da.
      if (window.location.hash.includes('access_token')) {
        setStatus('Verarbeite Login-Token …');
        // Auf onAuthStateChange warten — Timeout fängt den Hänger ab.
        return;
      }

      // 4. Weder Session, noch Code, noch Hash — User hat /admin/callback
      //    direkt aufgerufen ohne über einen Magic Link zu kommen.
      fail('Kein Login-Token in der URL. /admin/callback nicht direkt aufrufen — über den Magic Link aus der Mail kommen.');
    }

    run();

    timer = setTimeout(() => {
      fail('Timeout beim Login. Magic Link evtl. abgelaufen oder Browser-Wechsel — neuen anfordern.');
    }, TIMEOUT_MS);

    return () => {
      subscription.unsubscribe();
      if (timer) clearTimeout(timer);
    };
  }, [navigate]);

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1 className="auth-title">Anmeldung läuft …</h1>
        <p className="auth-lede">{status}</p>
      </div>
    </div>
  );
}
