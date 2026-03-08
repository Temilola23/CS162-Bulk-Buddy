import { useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import OrderStatusTrack from "../components/OrderStatusTrack";
import SectionTag from "../components/SectionTag";
import StatusPill from "../components/StatusPill";
import { orderGroups } from "../data/mockData";

export default function MyOrders() {
  const [activeTab, setActiveTab] = useState("upcoming");

  return (
    <AppShell persona="shopper">
      <main className="page-stack dashboard-page">
        <section className="section-heading">
          <SectionTag>Shopper view</SectionTag>
          <h1>My Orders</h1>
          <p className="lede">
            Orders are grouped by trip so pickup details, driver info, and item statuses stay
            connected.
          </p>
        </section>

        <div className="tab-row">
          {["upcoming", "past"].map((tab) => (
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
          {orderGroups[activeTab].map((group) => (
            <article className="card orders-card" key={group.trip}>
              <div className="orders-head">
                <div>
                  <h2>{group.trip}</h2>
                  <p>{group.summary}</p>
                </div>
                <Link className="button button-secondary" to="/trips/costco-mission">
                  View trip details
                </Link>
              </div>

              <div className="order-item-stack">
                {group.items.map((item) => (
                  <article className="order-item-card" key={item.name}>
                    <div className="orders-item-top">
                      <div>
                        <strong>{item.name}</strong>
                        <span>{item.quantity}</span>
                      </div>
                      <StatusPill quiet status={`Current: ${item.current.toUpperCase()}`} />
                    </div>
                    <OrderStatusTrack current={item.current} />
                  </article>
                ))}
              </div>
            </article>
          ))}
        </section>
      </main>
    </AppShell>
  );
}
