import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase.js';

// Ziel des Magic-Links. supabase-js erkennt die Tokens im URL-Hash
// (detectSessionInUrl: true im Client) und etabliert die Session
// automatisch. Wir hören auf onAuthStateChange und schicken danach weiter.

const TIMEOUT_MS = 10000;

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    let done = false;

    function complete(target) {
      if (done) return;
      done = true;
      navigate(target, { replace: true });
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) complete('/admin/app');
    });

    // Falls supabase-js die Session synchron erkennt, ist sie schon da:
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) complete('/admin/app');
    });

    // Fallback: nach 10 s aufgeben und mit Fehlertext zurück zum Login.
    const timer = setTimeout(() => {
      if (!done) {
        setError('Das Etablieren der Session hat zu lange gedauert. Versuch den Login bitte nochmal.');
        complete('/admin?error=callback-timeout');
      }
    }, TIMEOUT_MS);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, [navigate]);

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1 className="auth-title">Anmeldung läuft …</h1>
        <p className="auth-lede">
          {error || 'Bitte einen Moment — wir prüfen deinen Magic Link und richten die Session ein.'}
        </p>
      </div>
    </div>
  );
}
