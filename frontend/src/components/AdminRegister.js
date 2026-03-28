import { Link } from 'react-router-dom';
import useAdminRegisterForm from '../hooks/useAdminRegisterForm';
import './AdminRegister.css';

export default function AdminRegister() {
  const {
    form,
    errorMessage,
    isSubmitting,
    authQueryString,
    handleFieldChange,
    handleSubmit,
  } = useAdminRegisterForm();

  return (
    <main className="admin-register-page">
      <section className="admin-register-card">
        <Link className="admin-register-brand" to="/">
          <img alt="Bulk Buddy logo" src="/images/logo-main1.png" />
          <span>Bulk Buddy Admin</span>
        </Link>

        <p className="admin-register-kicker">Restricted Access</p>
        <h1>Create an admin account.</h1>
        <p className="admin-register-lede">
          Enter the admin token and complete the account details required by the backend.
        </p>

        <form className="admin-register-form" onSubmit={handleSubmit}>
          <div className="admin-register-grid">
            <label>
              <span>First name</span>
              <input
                name="firstName"
                onChange={handleFieldChange}
                placeholder="First name"
                value={form.firstName}
              />
            </label>

            <label>
              <span>Last name</span>
              <input
                name="lastName"
                onChange={handleFieldChange}
                placeholder="Last name"
                value={form.lastName}
              />
            </label>
          </div>

          <label>
            <span>Email</span>
            <input
              name="email"
              onChange={handleFieldChange}
              placeholder="admin@example.com"
              type="email"
              value={form.email}
            />
          </label>

          <label>
            <span>Password</span>
            <input
              name="password"
              onChange={handleFieldChange}
              placeholder="Create a password"
              type="password"
              value={form.password}
            />
          </label>

          <label>
            <span>Confirm password</span>
            <input
              name="confirmPassword"
              onChange={handleFieldChange}
              placeholder="Re-enter your password"
              type="password"
              value={form.confirmPassword}
            />
          </label>

          <label>
            <span>Street address</span>
            <input
              name="addressStreet"
              onChange={handleFieldChange}
              placeholder="Street address"
              value={form.addressStreet}
            />
          </label>

          <div className="admin-register-grid">
            <label>
              <span>City</span>
              <input
                name="addressCity"
                onChange={handleFieldChange}
                placeholder="City"
                value={form.addressCity}
              />
            </label>

            <label>
              <span>State</span>
              <input
                name="addressState"
                onChange={handleFieldChange}
                placeholder="State"
                value={form.addressState}
              />
            </label>
          </div>

          <label>
            <span>ZIP code</span>
            <input
              name="addressZip"
              onChange={handleFieldChange}
              placeholder="ZIP code"
              value={form.addressZip}
            />
          </label>

          <label>
            <span>Admin token</span>
            <input
              name="adminToken"
              onChange={handleFieldChange}
              placeholder="Enter admin token"
              type="password"
              value={form.adminToken}
            />
          </label>

          {errorMessage ? <p className="admin-register-error-message">{errorMessage}</p> : null}

          <button className="admin-register-submit" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Creating account...' : 'Create admin account'}
          </button>
        </form>

        <p className="admin-register-switch">
          Already have an admin account?{' '}
          <Link to={`/admin-console/login${authQueryString}`}>Admin sign in</Link>
        </p>
      </section>
    </main>
  );
}
