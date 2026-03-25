import useLoginForm from '../hooks/useLoginForm';
import './Login.css';

export default function Login() {
  const { form, errorMessage, isSubmitting, handleFieldChange, handleSubmit } = useLoginForm('/trip-feed');

  return (
    <main className="login-page">
      <a className="login-brand" href="/">
        <img alt="Bulk Buddy logo" className="login-brand-logo" src="/images/logo-main1.png" />
        <span>Bulk Buddy</span>
      </a>

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
          New to Bulk Buddy? <a href="/register">Create an account</a>
        </p>
      </section>
    </main>
  );
}
