import { claimStatuses } from "../data/mockData";

export default function OrderStatusTrack({ current }) {
  const currentIndex = claimStatuses.indexOf(current);

  return (
    <div className="status-track">
      {claimStatuses.map((status, index) => {
        const stateClass = index <= currentIndex ? "is-complete" : "";
        return (
          <div className={`status-track-step ${stateClass}`.trim()} key={status}>
            {status}
          </div>
        );
      })}
    </div>
  );
}
