import { useState } from "react";
import AppShell from "../components/AppShell";
import SectionTag from "../components/SectionTag";
import StatusPill from "../components/StatusPill";

const initialItems = [
  { name: "Kirkland Rice 25lb", unit: "bag", totalShare: "4", notes: "Optional" },
  { name: "Chicken Breasts", unit: "lb", totalShare: "5", notes: "Boneless skinless" },
];

export default function PostTrip() {
  const [items, setItems] = useState(initialItems);

  function updateItem(index, field, value) {
    setItems((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item))
    );
  }

  function addItem() {
    setItems((current) => [...current, { name: "", unit: "", totalShare: "", notes: "" }]);
  }

  return (
    <AppShell persona="driver">
      <main className="page-stack dashboard-page">
        <section className="section-heading">
          <SectionTag>Driver form</SectionTag>
          <h1>Post a new warehouse trip.</h1>
          <p className="lede">
            Only approved drivers can create trips. The form is a single page so trip details and
            item setup remain visible together.
          </p>
        </section>

        <section className="detail-grid">
          <aside className="card publishing-rules-card">
            <StatusPill quiet status="Approved Driver" />
            <h2>Publishing rules</h2>
            <dl className="info-list">
              <div>
                <dt>Trip status after publish</dt>
                <dd>open</dd>
              </div>
              <div>
                <dt>Visibility</dt>
                <dd>Appears in nearby trip feed</dd>
              </div>
              <div>
                <dt>Required fields</dt>
                <dd>Store, time, pickup, capacity</dd>
              </div>
            </dl>
          </aside>

          <section className="card driver-form-card">
            <div className="form-grid">
              <label>
                <span>Store</span>
                <input defaultValue="Costco" />
              </label>
              <label>
                <span>Date</span>
                <input defaultValue="2026-03-14" />
              </label>
              <label>
                <span>Start pick up time</span>
                <input defaultValue="15:00" />
              </label>
              <label>
                <span>End pick up time</span>
                <input defaultValue="17:00" />
              </label>
              <label className="field-span-full">
                <span>Pickup location (text/landmark)</span>
                <input defaultValue="Mission District, 16th St BART Plaza" />
              </label>
              <label>
                <span>Capacity total</span>
                <input defaultValue="4" />
              </label>
              <label>
                <span>Notes to shoppers</span>
                <input defaultValue="Bring your own bags." />
              </label>
            </div>

            <div className="summary-divider" />

            <div className="section-heading compact section-heading-row driver-items-toolbar">
              <div>
                <h2>Items you plan to buy</h2>
                <p>Shoppers can claim from this list only in V1.</p>
              </div>
              <button className="button button-secondary" onClick={addItem} type="button">
                + Add another item
              </button>
            </div>

            <div className="driver-item-stack">
              {items.map((item, index) => (
                <article className="driver-item-card" key={`${item.name}-${index}`}>
                  <div className="driver-item-card-head">
                    <strong>Item {index + 1}</strong>
                    <span>Visible to shoppers exactly as listed here.</span>
                  </div>
                  <div className="form-grid driver-item-fields">
                    <label>
                      <span>Item name</span>
                      <input
                        onChange={(event) => updateItem(index, "name", event.target.value)}
                        value={item.name}
                      />
                    </label>
                    <label>
                      <span>Unit</span>
                      <input
                        onChange={(event) => updateItem(index, "unit", event.target.value)}
                        value={item.unit}
                      />
                    </label>
                    <label>
                      <span>Total share</span>
                      <input
                        onChange={(event) => updateItem(index, "totalShare", event.target.value)}
                        value={item.totalShare}
                      />
                    </label>
                    <label>
                      <span>Notes</span>
                      <input
                        onChange={(event) => updateItem(index, "notes", event.target.value)}
                        value={item.notes}
                      />
                    </label>
                  </div>
                </article>
              ))}
            </div>

            <button className="button button-teal button-block" type="button">
              Publish trip
            </button>
          </section>
        </section>
      </main>
    </AppShell>
  );
}
