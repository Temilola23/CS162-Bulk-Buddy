import { Link } from 'react-router-dom';
import useRegisterForm from '../../hooks/useRegisterForm';
import usePostAuthRedirect from '../../hooks/usePostAuthRedirect';
import './Register.css';

/**
 * Renders the shopper registration page.
 */
export default function Register() {
  // Preserve any pending protected-route destination if the shopper switches
  // from login to register before authenticating.
  const { redirectPath, authQueryString } = usePostAuthRedirect('/trip-feed');
  const { form, errorMessage, isSubmitting, handleFieldChange, handleSubmit } = useRegisterForm(
    redirectPath,
  );

  return (
    <main className="register-page">
      <Link className="register-brand" to="/">
        <img alt="Bulk Buddy logo" className="register-brand-logo" src="/images/logo-main1.png" />
        <span>Bulk Buddy</span>
      </Link>

      <section className="register-card">
        <p className="register-kicker">Create account</p>
        <h1>Join Bulk Buddy as a Shopper.</h1>
        <p className="register-lede">
          Register to see nearby trips and start shopping.
        </p>

        <form className="register-form" onSubmit={handleSubmit}>
          <div className="register-grid">
            <label>
              <span>
                First name <span aria-hidden="true" className="required-asterisk">*</span>
              </span>
              <input name="firstName" onChange={handleFieldChange} placeholder="First name" value={form.firstName} />
            </label>

            <label>
              <span>
                Last name <span aria-hidden="true" className="required-asterisk">*</span>
              </span>
              <input name="lastName" onChange={handleFieldChange} placeholder="Last name" value={form.lastName} />
            </label>
          </div>

          <label>
            <span>
              Email <span aria-hidden="true" className="required-asterisk">*</span>
            </span>
            <input name="email" onChange={handleFieldChange} placeholder="Enter your email" type="email" value={form.email} />
          </label>

          <label>
            <span>
              Password <span aria-hidden="true" className="required-asterisk">*</span>
            </span>
            <input name="password" onChange={handleFieldChange} placeholder="Create a password" type="password" value={form.password} />
          </label>

          <label>
            <span>
              Confirm password <span aria-hidden="true" className="required-asterisk">*</span>
            </span>
            <input
              name="confirmPassword"
              onChange={handleFieldChange}
              placeholder="Re-enter your password"
              type="password"
              value={form.confirmPassword}
            />
          </label>

          <label>
            <span>
              Street address <span aria-hidden="true" className="required-asterisk">*</span>
            </span>
            <input name="addressStreet" onChange={handleFieldChange} placeholder="Enter your street address" value={form.addressStreet} />
          </label>

          <div className="register-grid">
            <label>
              <span>
                City <span aria-hidden="true" className="required-asterisk">*</span>
              </span>
              <input name="addressCity" onChange={handleFieldChange} placeholder="City" value={form.addressCity} />
            </label>

            <label>
              <span>
                State <span aria-hidden="true" className="required-asterisk">*</span>
              </span>
              <input name="addressState" onChange={handleFieldChange} placeholder="State" value={form.addressState} />
            </label>
          </div>

          <label>
            <span>
              ZIP code <span aria-hidden="true" className="required-asterisk">*</span>
            </span>
            <input name="addressZip" onChange={handleFieldChange} placeholder="ZIP code" value={form.addressZip} />
          </label>

          <p className="register-helper">
            Your address helps us show trips near you. Apply to become a Driver later in Profile &
            Settings.
          </p>

          {errorMessage ? <p className="register-error-message">{errorMessage}</p> : null}

          <button className="register-submit" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Signing up...' : 'Sign up'}
          </button>
        </form>

        <p className="register-switch">
          Already have an account? <Link to={`/login${authQueryString}`}>Log in</Link>
        </p>
      </section>
    </main>
  );
}
