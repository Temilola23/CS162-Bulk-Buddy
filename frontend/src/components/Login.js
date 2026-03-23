import { markAuthLoaderRequested } from '../hooks/useAppLoader';
import './Login.css';

export default function Login() {
  function handleSubmit(event) {
    event.preventDefault();

    markAuthLoaderRequested();
    // Temporary auth flow: any submission routes into the shopper UI.
    window.location.assign('/trip-feed');
  }

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
            <input placeholder="Enter your email" type="text" />
          </label>

          <label>
            <span>Password</span>
            <input placeholder="Enter your password" type="password" />
          </label>

          <button className="login-submit" type="submit">
            Log in
          </button>
        </form>

        <p className="login-switch">
          New to Bulk Buddy? <a href="/register">Create an account</a>
        </p>
      </section>
    </main>
  );
}
