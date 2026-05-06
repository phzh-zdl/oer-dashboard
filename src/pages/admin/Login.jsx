import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase.js';

// Magic-Link-Login.
//
// Flow:
//   1. User trägt seine zugelassene Admin-E-Mail ein.
//   2. Wir rufen signInWithOtp() — Supabase schickt eine E-Mail mit Link.
//   3. Klick auf den Link → /admin/callback → Session etabliert →
//      automatischer Redirect nach /admin/app.
//
// Voraussetzung im Supabase-Dashboard:
//   - Authentication → Providers → Email: aktiv, signups aus.
//   - Authentication → URL Configuration → Redirect URLs:
//        http://localhost:5173/admin/callback
//        https://<deine-site>.netlify.app/admin/callback
//   - Authentication → Users → Invite user: jede E-Mail manuell anlegen,
//     bevor sie sich anmelden kann.

export default function Login() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ kind: 'idle' });
  const navigate = useNavigate();
  const [params] = useSearchParams();

  // Falls bereits eingeloggt, direkt durchschicken.
  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!cancelled && session) navigate('/admin/app', { replace: true });
    });
    return () => { cancelled = true; };
  }, [navigate]);

  async function onSubmit(e) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    setStatus({ kind: 'sending' });
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: {
        emailRedirectTo: `${window.location.origin}/admin/callback`,
        shouldCreateUser: false, // Admins müssen vorab im Dashboard angelegt werden
      },
    });
    if (error) {
      setStatus({ kind: 'error', msg: error.message });
    } else {
      setStatus({ kind: 'sent' });
    }
  }

  const errorFromUrl = params.get('error') || params.get('error_description');

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <Link to="/" className="auth-back">← Zum Katalog</Link>
        <h1 className="auth-title">Admin-Login</h1>
        <p className="auth-lede">
          Trag deine zugelassene E-Mail ein. Du erhältst einen Link, der dich einloggt — kein Passwort nötig.
        </p>

        {errorFromUrl && (
          <div className="auth-msg auth-msg-err">
            Login fehlgeschlagen: {decodeURIComponent(errorFromUrl)}
          </div>
        )}

        <form onSubmit={onSubmit} className="auth-form">
          <label htmlFor="login-email">E-Mail-Adresse</label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            required
            placeholder="vorname.nachname@phzh.ch"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status.kind === 'sending' || status.kind === 'sent'}
          />
          <button type="submit" disabled={status.kind === 'sending' || status.kind === 'sent' || !email.trim()}>
            {status.kind === 'sending' ? 'Sende …' : status.kind === 'sent' ? 'Gesendet' : 'Magic Link senden'}
          </button>
        </form>

        {status.kind === 'sent' && (
          <div className="auth-msg auth-msg-ok">
            Check deinen Posteingang — der Link ist 60 Minuten gültig.
            <br />
            <small>Falls nichts ankommt: Spam-Ordner prüfen, oder schau in Supabase → Authentication → Users, ob die E-Mail dort als zugelassene:r User existiert.</small>
          </div>
        )}

        {status.kind === 'error' && (
          <div className="auth-msg auth-msg-err">
            Fehler: {status.msg}
          </div>
        )}
      </div>
    </div>
  );
}
