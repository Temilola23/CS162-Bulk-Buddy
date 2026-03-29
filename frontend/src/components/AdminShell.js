import { Link, NavLink } from 'react-router-dom';
import useAdminLogoutAction from '../hooks/useAdminLogoutAction';
import './AdminShell.css';

export default function AdminShell({ title, subtitle, children }) {
  const logout = useAdminLogoutAction();

  return (
    <div className="admin-shell">
      <header className="admin-shell-header">
        <div className="admin-shell-header-inner">
          <Link className="admin-shell-brand" to="/admin-console/driver-applications">
            <img alt="Bulk Buddy logo" src="/images/logo-main1.png" />
            <span>Bulk Buddy Admin</span>
          </Link>

          <nav aria-label="Admin pages" className="admin-shell-nav">
            <NavLink className="admin-shell-nav-link" to="/admin-console/driver-applications">
              Applications
            </NavLink>
          </nav>

          <button className="admin-shell-logout" onClick={logout} type="button">
            Log out
          </button>
        </div>
      </header>

      <main className="admin-shell-main">
        <section className="admin-shell-intro">
          <p className="admin-shell-kicker">Admin Console</p>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </section>

        {children}
      </main>
    </div>
  );
}
