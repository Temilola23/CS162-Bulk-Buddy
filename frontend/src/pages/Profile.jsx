import AppShell from "../components/AppShell";
import SectionTag from "../components/SectionTag";
import StatusPill from "../components/StatusPill";
import { driverApplication, driverApplicationStates, profileUser } from "../data/mockData";

export default function Profile() {
  const stateCard = driverApplicationStates[driverApplication.status] || driverApplicationStates.Pending;
  const stateCards = Object.values(driverApplicationStates);

  return (
    <AppShell persona="driver">
      <main className="page-stack dashboard-page">
        <section className="section-heading">
          <SectionTag>Profile & settings</SectionTag>
          <h1>Role, address, and driver verification live together.</h1>
          <p className="lede">
            The page should make permissions obvious: shoppers can apply, approved drivers can post
            trips, and admin review determines the status.
          </p>
        </section>

        <section className="profile-grid">
          <article className="card profile-card">
            <div className="profile-head">
              <span className="profile-initials">{profileUser.initials}</span>
              <div>
                <h2>{profileUser.name}</h2>
                <p>Role: {profileUser.role}</p>
              </div>
            </div>
            <dl className="info-list">
              <div>
                <dt>Email</dt>
                <dd>{profileUser.email}</dd>
              </div>
              <div>
                <dt>Address</dt>
                <dd>{profileUser.address}</dd>
              </div>
              <div>
                <dt>Nearby radius</dt>
                <dd>{profileUser.radius}</dd>
              </div>
            </dl>
            <button className="button button-secondary" type="button">
              Update address
            </button>
          </article>

          <article className="card application-card">
            <SectionTag>Driver application</SectionTag>
            <h2>{driverApplication.headline}</h2>
            <p>{driverApplication.body}</p>
            <div className="status-row">
              <StatusPill status={driverApplication.status} />
            </div>
            <div className="info-banner">{driverApplication.banner}</div>
            <div className="form-grid">
              {driverApplication.fields.map(([label, value]) => (
                <label key={label}>
                  <span>{label}</span>
                  <input readOnly value={value} />
                </label>
              ))}
            </div>
            <p className="field-helper">Required by FR-3 for driver verification.</p>
          </article>
        </section>

        <section className="card state-render-card">
          <div className="section-heading compact">
            <SectionTag>State rendering</SectionTag>
            <h2>System-rendered application state</h2>
            <p>
              This area should render one state only based on the current application decision
              returned by the backend, but the four state variants are shown here for design review.
            </p>
          </div>

          <div className="status-gallery">
            {stateCards.map((card) => (
              <article
                className={`status-gallery-card ${card.status === stateCard.status ? "is-current-state" : ""}`}
                key={card.status}
              >
                <StatusPill status={card.status} />
                <h3>{card.title}</h3>
                <p>{card.body}</p>
                {card.banner ? <div className="info-banner">{card.banner}</div> : null}
                <div className="button-row">
                  {card.primaryAction ? (
                    <button
                      className={`button ${card.actionTone === "teal" ? "button-teal" : "button-primary"}`}
                      type="button"
                    >
                      {card.primaryAction}
                    </button>
                  ) : null}
                  {card.secondaryAction ? (
                    <button className="button button-subtle" type="button">
                      {card.secondaryAction}
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </AppShell>
  );
}
