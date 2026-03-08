import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import SectionTag from "../components/SectionTag";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "tara@example.edu",
    password: "password123",
    confirmPassword: "password123",
    street: "145 Valencia St",
    city: "San Francisco",
    state: "CA",
    zip: "94103",
  });

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    navigate("/trips");
  }

  return (
    <AppShell persona="public" publicMode="register">
      <main className="auth-shell">
        <section className="card auth-card">
          <SectionTag>Create account</SectionTag>
          <h1>Join Bulk Buddy as a Shopper.</h1>
          <p className="lede">
            Your address is required so we can geocode your location and show nearby trips
            automatically.
          </p>
          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              <span>Email</span>
              <input onChange={(e) => updateField("email", e.target.value)} type="email" value={form.email} />
            </label>
            <label>
              <span>Password</span>
              <input
                onChange={(e) => updateField("password", e.target.value)}
                type="password"
                value={form.password}
              />
            </label>
            <label>
              <span>Confirm password</span>
              <input
                onChange={(e) => updateField("confirmPassword", e.target.value)}
                type="password"
                value={form.confirmPassword}
              />
            </label>
            <div className="info-banner">
              Address is required for nearby-trip ranking. Default role: Shopper.
            </div>
            <label>
              <span>Street address</span>
              <input onChange={(e) => updateField("street", e.target.value)} value={form.street} />
            </label>
            <div className="auth-inline-grid">
              <label>
                <span>City</span>
                <input onChange={(e) => updateField("city", e.target.value)} value={form.city} />
              </label>
              <label>
                <span>State</span>
                <input onChange={(e) => updateField("state", e.target.value)} value={form.state} />
              </label>
            </div>
            <label>
              <span>ZIP code</span>
              <input onChange={(e) => updateField("zip", e.target.value)} value={form.zip} />
            </label>
            <p className="field-helper">
              Your address helps us show trips near you. Apply to become a Driver later in Profile
              &amp; Settings.
            </p>
            <button className="button button-primary button-block" type="submit">
              Sign up
            </button>
          </form>
          <p className="auth-switch auth-switch-divider">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </section>
      </main>
    </AppShell>
  );
}
