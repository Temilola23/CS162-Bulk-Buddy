import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import SectionTag from "../components/SectionTag";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "tara@example.edu", password: "password123" });

  function handleSubmit(event) {
    event.preventDefault();
    navigate("/trips");
  }

  return (
    <AppShell persona="public" publicMode="login">
      <main className="auth-shell">
        <section className="card auth-card auth-card-wide">
          <SectionTag>Welcome back</SectionTag>
          <h1>Log in to see nearby warehouse trips.</h1>
          <p className="lede">
            Use your account address and saved role settings to jump back into active trips.
          </p>
          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              <span>Email</span>
              <input
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                type="email"
                value={form.email}
              />
            </label>
            <label>
              <span>Password</span>
              <input
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                type="password"
                value={form.password}
              />
            </label>
            <button className="button button-primary button-block" type="submit">
              Log in
            </button>
          </form>
          <p className="auth-switch">
            New to Bulk Buddy? <Link to="/register">Create an account</Link>
          </p>
        </section>
      </main>
    </AppShell>
  );
}
