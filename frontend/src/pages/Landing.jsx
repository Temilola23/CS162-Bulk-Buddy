import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import SectionTag from "../components/SectionTag";
import StatusPill from "../components/StatusPill";
import { publicPreviewTrip } from "../data/mockData";

const steps = [
  {
    title: "Drivers post warehouse trips",
    body: "Verified drivers add store, pickup window, capacity, and a predefined item list.",
  },
  {
    title: "Shoppers claim portions",
    body: "Pick shares from the posted list only, watch remaining availability, and track subtotal live.",
  },
  {
    title: "Meet up and complete handoff",
    body: "Everyone sees pickup time, location, distance, and status progression from the start.",
  },
];

export default function Landing() {
  return (
    <AppShell persona="public" publicMode="landing">
      <main className="page-stack">
        <section className="hero-grid card card-hero">
          <div>
            <SectionTag>For Shoppers Without Cars</SectionTag>
            <h1>Split bulk groceries. Save more together.</h1>
            <p className="lede">
              Connect with drivers already heading to Costco or Sam&apos;s Club, claim only what you
              need, and meet at a nearby pickup point that actually works for your week.
            </p>
            <div className="button-row">
              <Link className="button button-primary" to="/register">
                Get Started
              </Link>
              <a className="button button-subtle" href="#how-it-works">
                How it works
              </a>
            </div>
            <div className="metric-grid">
              <article className="metric-card">
                <strong>5 miles</strong>
                <span>Default nearby-trip radius</span>
              </article>
              <article className="metric-card">
                <strong>4 steps</strong>
                <span>Claim to pickup status path</span>
              </article>
              <article className="metric-card">
                <strong>1 list</strong>
                <span>Only driver-posted items are claimable</span>
              </article>
            </div>
          </div>
          <div className="card preview-panel">
            <div className="preview-head">
              <div>
                <h2>Preview: nearby warehouse trips</h2>
                <p>Marketing and product stay connected through real trip cards.</p>
              </div>
              <StatusPill quiet status="Sorted by distance" />
            </div>
            <article className="preview-trip">
              <div className="trip-card-head">
                <div className="trip-card-badges">
                  <StatusPill quiet status={publicPreviewTrip.distance} />
                  <StatusPill quiet status={publicPreviewTrip.status} />
                </div>
                <div className="trip-capacity">
                  <strong>{publicPreviewTrip.capacityLeft}</strong>
                  <span>Slots left</span>
                </div>
              </div>
              <h3>{publicPreviewTrip.store}</h3>
              <p className="trip-meta">{publicPreviewTrip.time}</p>
              <dl className="info-list">
                <div>
                  <dt>Pickup</dt>
                  <dd>{publicPreviewTrip.pickup}</dd>
                </div>
                <div>
                  <dt>Driver</dt>
                  <dd>{publicPreviewTrip.driver}</dd>
                </div>
                <div>
                  <dt>Items</dt>
                  <dd>{publicPreviewTrip.itemsLabel}</dd>
                </div>
              </dl>
              <Link className="button button-secondary" to="/trips">
                See more nearby trips
              </Link>
            </article>
          </div>
        </section>

        <section className="how-it-works-panel card" id="how-it-works">
          <div className="how-it-works-header">
            <div className="section-heading">
              <SectionTag>How it works</SectionTag>
              <h2>Designed for simple coordination, not endless grocery planning.</h2>
            </div>
            <p className="how-it-works-note">
              Each step stays narrow and readable so the section feels intentional instead of a wall
              of text.
            </p>
          </div>
          <div className="step-grid">
            {steps.map((step, index) => (
              <article className="card step-card" key={step.title}>
                <span className="step-index">{index + 1}</span>
                <div className="step-copy">
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-bottom-grid">
          <article className="card side-note landing-bottom-card">
            <h3>Why address matters</h3>
            <p>
              Bulk Buddy uses your signup address to show open trips within your local radius and
              sort them nearest first. No city dropdowns or manual scavenger hunts.
            </p>
            <div className="info-banner">
              Default role is Shopper. Apply to become a Driver later.
            </div>
          </article>
          <article className="card details-card landing-bottom-card">
            <div className="section-heading compact">
              <h3>What shoppers see before claiming</h3>
              <p>Location certainty comes before quantity selection.</p>
            </div>
            <dl className="info-list">
              <div>
                <dt>Pickup location</dt>
                <dd>Mission District, 16th St BART Plaza</dd>
              </div>
              <div>
                <dt>Distance</dt>
                <dd>0.8 miles away</dd>
              </div>
              <div>
                <dt>Pickup time</dt>
                <dd>Sat, Mar 14, 6:30 PM</dd>
              </div>
              <div>
                <dt>Current trip status</dt>
                <dd>open</dd>
              </div>
              <div>
                <dt>Claim status path</dt>
                <dd>Claimed → Purchased → Ready For Pickup → Completed</dd>
              </div>
            </dl>
          </article>
        </section>

        <footer className="page-footer">
          <span>Built for the Bulk Buddy MVP.</span>
          <div>
            <a href="https://www.figma.com/design/CKu93J7wSWqxtblaCgeo3u/Bulk-Buddy-MVP?node-id=0-1&t=a6sDwt4dVvhW43aI-1">
              Figma V1
            </a>
            <span>Contact</span>
            <span>Privacy</span>
          </div>
        </footer>
      </main>
    </AppShell>
  );
}
