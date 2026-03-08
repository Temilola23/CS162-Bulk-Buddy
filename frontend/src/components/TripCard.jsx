import { Link } from "react-router-dom";
import StatusPill from "./StatusPill";

export default function TripCard({ trip }) {
  return (
    <article className="trip-card">
      <div className="trip-card-head">
        <div className="trip-card-badges">
          <StatusPill quiet status={trip.distanceLabel} />
          <StatusPill quiet status={trip.status} />
        </div>
        <div className="trip-capacity">
          <strong>{trip.capacityLeft}</strong>
          <span>Capacity left</span>
        </div>
      </div>
      <h3>{trip.store}</h3>
      <p className="trip-meta">{trip.time}</p>
      <dl className="info-list">
        <div>
          <dt>Pickup</dt>
          <dd>{trip.pickup}</dd>
        </div>
        <div>
          <dt>Driver</dt>
          <dd>{trip.driver}</dd>
        </div>
        <div>
          <dt>Items</dt>
          <dd>{trip.itemsLabel}</dd>
        </div>
      </dl>
      <Link className="button button-secondary button-block" to={`/trips/${trip.id}`}>
        View details
      </Link>
    </article>
  );
}
