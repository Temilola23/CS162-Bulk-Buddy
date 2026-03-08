import { useState } from "react";
import { useParams } from "react-router-dom";
import AppShell from "../components/AppShell";
import QuantityStepper from "../components/QuantityStepper";
import SectionTag from "../components/SectionTag";
import StatusPill from "../components/StatusPill";
import { claimStatuses, tripDetails } from "../data/mockData";

export default function TripDetail() {
  const { tripId } = useParams();
  const detail = tripDetails[tripId] || tripDetails["costco-mission"];
  const [quantities, setQuantities] = useState(
    Object.fromEntries(detail.items.map((item) => [item.id, item.quantity]))
  );

  const lineItems = detail.items.map((item) => ({
    ...item,
    quantity: quantities[item.id] ?? 0,
  }));

  const totalQuantity = lineItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.approxPrice, 0);

  function updateQuantity(itemId, value) {
    setQuantities((current) => ({ ...current, [itemId]: value }));
  }

  return (
    <AppShell persona="shopper">
      <main className="page-stack dashboard-page">
        <section className="section-heading">
          <SectionTag>Trip detail</SectionTag>
          <h1>
            {detail.store} • {detail.titleDate}
          </h1>
          <p className="lede">
            Pickup clarity and item availability sit above the fold so shoppers can decide before
            touching quantity controls.
          </p>
        </section>

        <section className="card trip-detail-top">
          <div className="trip-detail-summary-grid">
            <article className="mini-card">
              <h3>{detail.pickupTitle}</h3>
              <p>{detail.pickupSubtitle}</p>
            </article>
            <article className="mini-card">
              <h3>{detail.driver}</h3>
              <p>
                Driver • {detail.distanceLabel}
              </p>
            </article>
            <article className="mini-card">
              <h3>{detail.capacityLeft} slots</h3>
              <p>Capacity left • status: {detail.status.toLowerCase()}</p>
            </article>
          </div>
          <div className="info-banner">{`Trip notes: "${detail.note}"`}</div>
        </section>

        <section className="detail-grid">
          <div className="detail-items">
            {lineItems.map((item) => (
              <article className="card claim-item-card" key={item.id}>
                <h3>{item.name}</h3>
                <dl className="info-list">
                  <div>
                    <dt>Unit</dt>
                    <dd>{item.unit}</dd>
                  </div>
                  <div>
                    <dt>Total shares</dt>
                    <dd>{item.totalShares}</dd>
                  </div>
                  <div>
                    <dt>Claimed</dt>
                    <dd>{item.claimedShares}</dd>
                  </div>
                  <div>
                    <dt>Available</dt>
                    <dd>{item.availableShares}</dd>
                  </div>
                  <div>
                    <dt>Approx price per share</dt>
                    <dd>${item.approxPrice.toFixed(2)}</dd>
                  </div>
                </dl>
                <QuantityStepper
                  max={item.availableShares}
                  onChange={(value) => updateQuantity(item.id, value)}
                  value={item.quantity}
                />
                <p className="field-helper">Max {item.availableShares} available</p>
              </article>
            ))}

            <article className="card claim-rules-card">
              <h3>Claiming rules in V1</h3>
              <dl className="info-list">
                {detail.rules.map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </article>
          </div>

          <aside className="card summary-card">
            <SectionTag>Summary</SectionTag>
            <h2>Your claim</h2>
            <dl className="info-list">
              <div>
                <dt>Total quantity</dt>
                <dd>{totalQuantity} shares</dd>
              </div>
              <div>
                <dt>Subtotal</dt>
                <dd>${subtotal.toFixed(2)}</dd>
              </div>
              <div>
                <dt>Status after submit</dt>
                <dd>Claimed</dd>
              </div>
            </dl>
            <div className="summary-divider" />
            <h3>Claim status path</h3>
            <div className="summary-status-row">
              {claimStatuses.map((status) => (
                <StatusPill key={status} quiet status={status} />
              ))}
            </div>
            <button className="button button-primary button-block" type="button">
              Submit claim
            </button>
            <p className="field-helper">Service or rounding notes can appear here when needed.</p>
          </aside>
        </section>
      </main>
    </AppShell>
  );
}
