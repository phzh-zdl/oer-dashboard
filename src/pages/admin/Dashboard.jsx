import { Link, useOutletContext, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase.js';

// Stub für Task #5. Volle Ressourcen-Liste kommt mit Task #6 (CRUD-Form).
// Hier zeigen wir nur, dass der Login funktioniert hat, plus Logout.
export default function Dashboard() {
  const { session } = useOutletContext();
  const navigate = useNavigate();

  async function logout() {
    await supabase.auth.signOut();
    navigate('/admin', { replace: true });
  }

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <Link to="/" className="admin-back">← Katalog</Link>
        <div className="admin-user">
          <span>{session.user.email}</span>
          <button onClick={logout} className="admin-logout">Logout</button>
        </div>
      </header>

      <main className="admin-main">
        <h1>Admin-Panel</h1>
        <p>Login funktioniert. Ressourcen-Verwaltung folgt im nächsten Schritt.</p>
        <ul className="admin-nav-list">
          <li><Link to="/admin/app">Ressourcen (in Arbeit)</Link></li>
          <li><Link to="/admin/app/categories">Kategorien (in Arbeit)</Link></li>
        </ul>
      </main>
    </div>
  );
}
