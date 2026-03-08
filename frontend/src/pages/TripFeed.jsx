import { useMemo, useState } from "react";
import AppShell from "../components/AppShell";
import SectionTag from "../components/SectionTag";
import StatusPill from "../components/StatusPill";
import TripCard from "../components/TripCard";
import { trips } from "../data/mockData";

export default function TripFeed() {
  const [onlyOpen, setOnlyOpen] = useState(true);

  const visibleTrips = useMemo(() => {
    const filtered = onlyOpen ? trips.filter((trip) => trip.status === "Open") : trips;

    return filtered.slice().sort((left, right) => left.distance - right.distance);
  }, [onlyOpen]);

  return (
    <AppShell persona="shopper">
      <main className="page-stack dashboard-page">
        <section className="section-heading">
          <SectionTag>Trip feed</SectionTag>
          <h1>Showing open trips within 5 miles.</h1>
          <p className="lede">
            Cards are sorted by distance so the nearest viable pickup options surface first for
            shoppers without cars.
          </p>
        </section>

        <section className="toolbar-row">
          <div className="button-row">
            <button className="button button-secondary" type="button">
              Adjust radius: 5 miles
            </button>
            <button className="button button-checkbox" onClick={() => setOnlyOpen((value) => !value)} type="button">
              <span className={`checkbox-mark ${onlyOpen ? "is-checked" : ""}`} />
              Only open trips
            </button>
          </div>
          <div className="toolbar-meta">
            <StatusPill quiet status="Nearest first" />
            <span>{visibleTrips.length} trips found near Mission District</span>
          </div>
        </section>

        <section className="trip-grid">
          {visibleTrips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </section>
      </main>
    </AppShell>
  );
}
