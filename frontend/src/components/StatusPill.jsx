function normalize(status) {
  return status.toLowerCase().replace(/\s+/g, "").replace(/[./-]/g, "");
}

export default function StatusPill({ status, quiet = false }) {
  const className = `status-pill status-${normalize(status)}${quiet ? " is-quiet" : ""}`;

  return <span className={className}>{status}</span>;
}
