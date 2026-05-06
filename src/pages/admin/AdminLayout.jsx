import { Link, NavLink, Outlet, useNavigate, useOutletContext } from 'react-router-dom';
import { supabase } from '../../lib/supabase.js';

// Gemeinsamer Rahmen für alle eingeloggten Admin-Seiten:
// Topbar (zurück zum Katalog, Tab-Nav, User + Logout) + Outlet für die
// jeweilige Seite. Die `session` aus RequireAuth wird durchgereicht.
export default function AdminLayout() {
  const ctx = useOutletContext();
  const navigate = useNavigate();

  async function logout() {
    await supabase.auth.signOut();
    navigate('/admin', { replace: true });
  }

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <Link to="/" className="admin-back">← Katalog</Link>
        <nav className="admin-nav">
          <NavLink to="/admin/app" end className={({ isActive }) => isActive ? 'is-active' : ''}>
            Ressourcen
          </NavLink>
          <NavLink to="/admin/app/categories" className={({ isActive }) => isActive ? 'is-active' : ''}>
            Kategorien
          </NavLink>
        </nav>
        <div className="admin-user">
          <span>{ctx.session.user.email}</span>
          <button onClick={logout} className="admin-logout">Logout</button>
        </div>
      </header>
      <main className="admin-main">
        <Outlet context={ctx} />
      </main>
    </div>
  );
}
