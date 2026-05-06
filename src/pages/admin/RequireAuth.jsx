import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '../../lib/supabase.js';

// Wrapper für geschützte Routen. Wenn keine Session vorhanden ist,
// zurück zu /admin. Re-prüft live via onAuthStateChange, damit ein
// Logout sofort wirkt.
export default function RequireAuth() {
  const [state, setState] = useState({ kind: 'checking' });

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      setState(session ? { kind: 'authed', session } : { kind: 'guest' });
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      setState(session ? { kind: 'authed', session } : { kind: 'guest' });
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  if (state.kind === 'checking') {
    return <div className="loading-state">Session wird geprüft …</div>;
  }
  if (state.kind === 'guest') {
    return <Navigate to="/admin" replace />;
  }
  return <Outlet context={{ session: state.session }} />;
}
