import { Link } from 'react-router-dom';
import useAdminLoginForm from '../../hooks/useAdminLoginForm';
import './AdminLogin.css';

export default function AdminLogin() {
  const {
    form,
    errorMessage,
    isSubmitting,
    authQueryString,
    handleFieldChange,
    handleSubmit,
  } = useAdminLoginForm();

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <Link className="admin-login-brand" to="/">
          <img alt="Bulk Buddy logo" src="/images/logo-main1.png" />
          <span>Bulk Buddy Admin</span>
        </Link>

        <div className="admin-login-copy">
          <p className="admin-login-kicker">Restricted Access</p>
          <h1>Admin sign in</h1>
          <p>Review submitted driver applications and decide who can post trips.</p>
        </div>

        <form className="admin-login-form" onSubmit={handleSubmit}>
          <label className="admin-login-field">
            <span>Email</span>
            <input
              name="email"
              onChange={handleFieldChange}
              placeholder="admin@example.com"
              type="email"
              value={form.email}
            />
          </label>

          <label className="admin-login-field">
            <span>Password</span>
            <input
              name="password"
              onChange={handleFieldChange}
              placeholder="Enter your password"
              type="password"
              value={form.password}
            />
          </label>

          {errorMessage ? <p className="admin-login-error">{errorMessage}</p> : null}

          <button className="admin-login-submit" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Signing in...' : 'Admin sign in'}
          </button>
        </form>

        <p className="admin-login-switch">
          Need an admin account first?{' '}
          <Link to={`/admin-console/register${authQueryString}`}>Register as admin</Link>
        </p>

        <p className="admin-login-switch">
          Need the shopper app instead?{' '}
          <Link to={`/login${authQueryString}`}>Use shopper login</Link>
        </p>
      </section>
    </main>
  );
}
