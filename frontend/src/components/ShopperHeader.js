import HeaderScrollProgress from './HeaderScrollProgress';
import { shopperProfile } from '../data/shopperProfile';
import useShopperHeaderState from '../hooks/useShopperHeaderState';
import './ShopperHeader.css';

export default function ShopperHeader({ activePage, isScrolled, scrollProgress }) {
  const { menuOpen, profileMenuRef, navItems, toggleMenu } = useShopperHeaderState();

  return (
    <header className={`shopper-header ${isScrolled ? 'is-scrolled' : ''}`.trim()}>
      <div className="shopper-header-inner">
        <a className="shopper-brand" href="/">
          <img alt="Bulk Buddy logo" className="shopper-brand-logo" src="/images/logo-main1.png" />
          <span>Bulk Buddy</span>
        </a>

        <nav aria-label="Shopper pages" className="shopper-nav">
          {navItems.map((item) => (
            <a
              className={`shopper-nav-link ${activePage === item.id ? 'is-active' : ''}`.trim()}
              href={item.href}
              key={item.id}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="shopper-profile-shell" ref={profileMenuRef}>
          <button
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            className={`shopper-profile-trigger ${menuOpen ? 'is-open' : ''}`.trim()}
            onClick={toggleMenu}
            type="button"
          >
            <span aria-hidden="true" className="shopper-profile-avatar">
              {shopperProfile.initials}
            </span>
            <span className="shopper-profile-name">{shopperProfile.name}</span>
            <span aria-hidden="true" className="shopper-profile-caret">
              <svg fill="none" viewBox="0 0 12 8" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M1.25 1.5 6 6.25l4.75-4.75"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                />
              </svg>
            </span>
          </button>

          {menuOpen ? (
            <div className="shopper-profile-menu" role="menu">
              <a className="shopper-profile-menu-item is-link" href="/profile" role="menuitem">
                View Profile
              </a>
              <a className="shopper-profile-menu-item is-link" href="/settings" role="menuitem">
                Account Settings
              </a>
              <a className="shopper-profile-menu-item is-link" href="/" role="menuitem">
                Logout
              </a>
            </div>
          ) : null}
        </div>
      </div>
      <HeaderScrollProgress scrollProgress={scrollProgress} />
    </header>
  );
}
