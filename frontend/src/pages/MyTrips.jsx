import { useState } from "react";
import AppShell from "../components/AppShell";
import SectionTag from "../components/SectionTag";
import StatusPill from "../components/StatusPill";
import { driverTrips } from "../data/mockData";

const tabs = ["open", "closed", "past"];

export default function MyTrips() {
  const [activeTab, setActiveTab] = useState("open");

  return (
    <AppShell persona="driver">
      <main className="page-stack dashboard-page">
        <section className="section-heading">
          <SectionTag>Driver view</SectionTag>
          <h1>My Trips</h1>
          <p className="lede">
            Operational trip management is slightly denser than shopper pages, with room for claim
            summary and capacity monitoring.
          </p>
        </section>

        <div className="tab-row">
          {tabs.map((tab) => (
            <button
              className={`tab-chip ${activeTab === tab ? "is-active" : ""}`}
              key={tab}
              onClick={() => setActiveTab(tab)}
              type="button"
            >
              {tab[0].toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <section className="trip-stack">
          {driverTrips[activeTab].map((trip) => (
            <article className="card driver-trip-card" key={trip.title}>
              <div className="driver-trip-head">
                <div>
                  <h2>{trip.title}</h2>
                  <p>{trip.subtitle}</p>
                </div>
                <StatusPill quiet status={trip.status} />
              </div>
              <dl className="info-list">
                <div>
                  <dt>Capacity</dt>
                  <dd>{trip.capacityLine}</dd>
                </div>
                {trip.claims.map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
              <div className="progress-rail">
                <span style={{ width: `${trip.fillPercent}%` }} />
              </div>
              <div className="button-row">
                <button className="button button-secondary" type="button">
                  Manage trip
                </button>
                <button className="button button-secondary" type="button">
                  View all claims
                </button>
                <button className="button button-subtle" type="button">
                  Close trip
                </button>
              </div>
            </article>
          ))}
        </section>
      </main>
    </AppShell>
  );
}
