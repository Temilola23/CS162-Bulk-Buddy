import { Link, useNavigate } from 'react-router-dom';
import HeaderScrollProgress from './HeaderScrollProgress';
import { useSession } from '../contexts/SessionProvider';
import { useCartCount } from '../contexts/CartProvider';
import useShopperHeaderState from '../hooks/useShopperHeaderState';
import useLogoutAction from '../hooks/useLogoutAction';
import { getProfileFromUser } from '../utils/profileAdapters';
import './ShopperHeader.css';

export default function ShopperHeader({ activePage, isScrolled, scrollProgress }) {
  const { menuOpen, profileMenuRef, navItems, toggleMenu, unreadCount } = useShopperHeaderState();
  const { currentUser } = useSession();
  const { itemCount } = useCartCount();
  const navigate = useNavigate();
  const logout = useLogoutAction();
  const profile = getProfileFromUser(currentUser) || {
    name: 'Bulk Buddy',
    initials: 'BB',
  };

  return (
    <header className={`shopper-header ${isScrolled ? 'is-scrolled' : ''}`.trim()}>
      <div className="shopper-header-inner">
        <Link className="shopper-brand" to="/trip-feed">
          <img alt="Bulk Buddy logo" className="shopper-brand-logo" src="/images/logo-main1.png" />
          <span>Bulk Buddy</span>
        </Link>

        <nav aria-label="Shopper pages" className="shopper-nav">
          {navItems.map((item) => (
            <Link
              className={`shopper-nav-link ${activePage === item.id ? 'is-active' : ''}`.trim()}
              to={item.to}
              key={item.id}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="shopper-header-actions">
          <button
            className="header-cart"
            onClick={() => navigate('/trip-feed')}
            type="button"
            aria-label="Go to cart"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
          </button>

          <button
            className="header-notifications"
            onClick={() => navigate('/settings')}
            type="button"
            aria-label="Notifications"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
          </button>

          <div className="shopper-profile-shell" ref={profileMenuRef}>
            <button
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              className={`shopper-profile-trigger ${menuOpen ? 'is-open' : ''}`.trim()}
              onClick={toggleMenu}
              type="button"
            >
              <span aria-hidden="true" className="shopper-profile-avatar">
                {profile.initials}
              </span>
              <span className="shopper-profile-name">{profile.name}</span>
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
                <Link className="shopper-profile-menu-item is-link" to="/profile" role="menuitem">
                  View Profile
                </Link>
                <Link className="shopper-profile-menu-item is-link" to="/settings" role="menuitem">
                  Account Settings
                </Link>
                <button className="shopper-profile-menu-item" onClick={logout} role="menuitem" type="button">
                  Logout
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <HeaderScrollProgress scrollProgress={scrollProgress} />
    </header>
  );
}
