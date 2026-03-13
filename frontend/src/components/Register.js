import './Register.css';

export default function Register() {
  function handleSubmit(event) {
    event.preventDefault();
    window.location.assign('/trip-feed');
  }

  return (
    <main className="register-page">
      <a className="register-brand" href="/">
        <img alt="Bulk Buddy logo" className="register-brand-logo" src="/images/logo-main1.png" />
        <span>Bulk Buddy</span>
      </a>

      <section className="register-card">
        <p className="register-kicker">Create account</p>
        <h1>Join Bulk Buddy as a Shopper.</h1>
        <p className="register-lede">
          Register to see nearby trips and start shopping.
        </p>

        <form className="register-form" onSubmit={handleSubmit}>
          <label>
            <span>
              Email <span aria-hidden="true" className="required-asterisk">*</span>
            </span>
            <input placeholder="Enter your email" type="text" />
          </label>

          <label>
            <span>
              Password <span aria-hidden="true" className="required-asterisk">*</span>
            </span>
            <input placeholder="Create a password" type="password" />
          </label>

          <label>
            <span>
              Confirm password <span aria-hidden="true" className="required-asterisk">*</span>
            </span>
            <input placeholder="Re-enter your password" type="password" />
          </label>

          <label>
            <span>
              Street address <span aria-hidden="true" className="required-asterisk">*</span>
            </span>
            <input placeholder="Enter your street address" />
          </label>

          <div className="register-grid">
            <label>
              <span>
                City <span aria-hidden="true" className="required-asterisk">*</span>
              </span>
              <input placeholder="City" />
            </label>

            <label>
              <span>
                State <span aria-hidden="true" className="required-asterisk">*</span>
              </span>
              <input placeholder="State" />
            </label>
          </div>

          <label>
            <span>
              ZIP code <span aria-hidden="true" className="required-asterisk">*</span>
            </span>
            <input placeholder="ZIP code" />
          </label>

          <p className="register-helper">
            Your address helps us show trips near you. Apply to become a Driver later in Profile &
            Settings.
          </p>

          <button className="register-submit" type="submit">
            Sign up
          </button>
        </form>

        <p className="register-switch">
          Already have an account? <a href="/login">Log in</a>
        </p>
      </section>
    </main>
  );
}
