import { Link } from 'react-router-dom';
import HeaderScrollProgress from './HeaderScrollProgress';
import { useCart } from '../contexts/CartProvider';
import { useSession } from '../contexts/SessionProvider';
import useShopperHeaderState from '../hooks/useShopperHeaderState';
import useLogoutAction from '../hooks/useLogoutAction';
import { getProfileFromUser } from '../utils/profileAdapters';
import './ShopperHeader.css';

export default function ShopperHeader({ activePage, isScrolled, scrollProgress }) {
  const { menuOpen, profileMenuRef, navItems, toggleMenu } = useShopperHeaderState();
  const { currentUser } = useSession();
  const { cart } = useCart();
  const logout = useLogoutAction();
  const profile = getProfileFromUser(currentUser) || {
    name: 'Bulk Buddy',
    initials: 'BB',
  };
  const cartGroupCount = cart.length;
  const cartLabel =
    cartGroupCount > 0
      ? `Cart with ${cartGroupCount} ${cartGroupCount === 1 ? 'driver group' : 'driver groups'}`
      : 'Cart';

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

        <Link
          aria-label={cartLabel}
          className={`shopper-cart-link shopper-header-cart ${
            activePage === 'cart' ? 'is-active' : ''
          }`.trim()}
          to="/cart"
        >
          <i aria-hidden="true" className="fa-solid fa-cart-shopping" />
          {cartGroupCount > 0 ? <span className="shopper-cart-badge">{cartGroupCount}</span> : null}
        </Link>

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
      <HeaderScrollProgress scrollProgress={scrollProgress} />
    </header>
  );
}
