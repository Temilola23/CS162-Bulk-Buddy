import { Link } from 'react-router-dom';
import useLoginForm from '../../hooks/useLoginForm';
import usePostAuthRedirect from '../../hooks/usePostAuthRedirect';
import './Login.css';

export default function Login() {
  // Use any ?next= target already present in the auth URL so successful login
  // can return the shopper to the protected page they originally requested.
  const { redirectPath, authQueryString } = usePostAuthRedirect('/trip-feed');
  const { form, errorMessage, isSubmitting, handleFieldChange, handleSubmit } = useLoginForm(
    redirectPath,
  );

  return (
    <main className="login-page">
      <Link className="login-brand" to="/">
        <img alt="Bulk Buddy logo" className="login-brand-logo" src="/images/logo-main1.png" />
        <span>Bulk Buddy</span>
      </Link>

      <section className="login-card">
        <p className="login-kicker">Welcome back</p>
        <h1>Log in to see nearby warehouse trips.</h1>
        <p className="login-lede">
          Use your account address and saved role settings to jump back into active trips.
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            <span>Email</span>
            <input
              name="email"
              onChange={handleFieldChange}
              placeholder="Enter your email"
              type="email"
              value={form.email}
            />
          </label>

          <label>
            <span>Password</span>
            <input
              name="password"
              onChange={handleFieldChange}
              placeholder="Enter your password"
              type="password"
              value={form.password}
            />
          </label>

          {errorMessage ? <p className="login-error-message">{errorMessage}</p> : null}

          <button className="login-submit" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <p className="login-switch">
          New to Bulk Buddy? <Link to={`/register${authQueryString}`}>Create an account</Link>
        </p>
      </section>
    </main>
  );
}
