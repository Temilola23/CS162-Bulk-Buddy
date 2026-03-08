import { Link, NavLink } from "react-router-dom";

const shopperLinks = [
  { to: "/trips", label: "Trip Feed" },
  { to: "/my-orders", label: "My Orders" },
  { to: "/post-trip", label: "Post Trip" },
  { to: "/profile", label: "Profile" },
];

const driverLinks = [
  { to: "/trips", label: "Trip Feed" },
  { to: "/my-orders", label: "My Orders" },
  { to: "/post-trip", label: "Post Trip" },
  { to: "/my-trips", label: "My Trips" },
  { to: "/profile", label: "Profile" },
];

const publicModes = {
  landing: {
    roleLabel: "",
    middleLinks: [
      { href: "/", label: "Home" },
      { href: "#how-it-works", label: "How it works" },
    ],
    actions: [
      { to: "/login", label: "Log in", tone: "ghost" },
      { to: "/register", label: "Sign up", tone: "primary" },
    ],
  },
  login: {
    roleLabel: "01 Public",
    actions: [
      { to: "/", label: "Home", tone: "ghost" },
      { to: "/register", label: "Sign up", tone: "primary" },
    ],
  },
  register: {
    roleLabel: "01 Public",
    actions: [
      { to: "/", label: "Home", tone: "ghost" },
      { to: "/login", label: "Log in", tone: "ghost" },
    ],
  },
};

function navLinkClass({ isActive }) {
  return isActive ? "shell-nav-link is-active" : "shell-nav-link";
}

export default function AppShell({ persona = "public", publicMode = "landing", children }) {
  const isPublic = persona === "public";
  const roleLabel = isPublic
    ? publicModes[publicMode].roleLabel
    : persona === "driver"
      ? "03 Driver"
      : "02 Shopper";
  const links = persona === "driver" ? driverLinks : shopperLinks;

  return (
    <div className="app-shell">
      <header className="shell-header">
        <Link className="shell-brand" to="/">
          <span className="shell-brand-mark">B</span>
          <span>
            <strong>Bulk Buddy</strong>
            {roleLabel ? <small>{roleLabel}</small> : null}
          </span>
        </Link>
        {isPublic ? (
          <>
            {publicModes[publicMode].middleLinks ? (
              <nav className="shell-nav shell-nav-public">
                {publicModes[publicMode].middleLinks.map((item) =>
                  item.href.startsWith("#") ? (
                    <a className="shell-nav-link" href={item.href} key={item.label}>
                      {item.label}
                    </a>
                  ) : (
                    <Link className="shell-nav-link" to={item.href} key={item.label}>
                      {item.label}
                    </Link>
                  )
                )}
              </nav>
            ) : null}
            <div className="shell-actions">
              {publicModes[publicMode].actions.map((action) => (
                <Link
                  className={`shell-action shell-action-${action.tone}`}
                  key={action.label}
                  to={action.to}
                >
                  {action.label}
                </Link>
              ))}
            </div>
          </>
        ) : (
          <nav className="shell-nav">
            {links.map((link) => (
              <NavLink className={navLinkClass} key={link.to} to={link.to}>
                {link.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>
      {children}
    </div>
  );
}
