import { Link } from 'react-router-dom';
import ShopperHeader from '../../components/ShopperHeader';
import useCartPageState from '../../hooks/useCartPageState';
import './Cart.css';

export default function Cart() {
  const {
    isScrolled,
    scrollProgress,
    cart,
    cartLineCount,
    cartSubtotal,
    checkoutMessage,
    isCheckingOut,
    removeTripGroup,
    handleCheckout,
  } = useCartPageState();

  return (
    <main className="cart-page">
      <ShopperHeader
        activePage="cart"
        isScrolled={isScrolled}
        scrollProgress={scrollProgress}
      />

      <section className="cart-page-intro">
        <p className="cart-page-kicker">Cart</p>
        <h1>Your grouped cart</h1>
        <p>
          Items stay grouped by driver trip so you can review each pickup handoff before
          placing the order.
        </p>
      </section>

      <section className="cart-page-layout">
        <div className="cart-page-groups">
          {cart.length > 0 ? (
            cart.map((tripGroup) => (
              <article className="cart-page-group-card" key={tripGroup.tripId}>
                <div className="cart-page-group-header">
                  <div className="cart-page-group-heading">
                    <p className="cart-page-group-store">{tripGroup.storeName}</p>
                    <div className="cart-page-driver-row">
                      <img
                        alt={`${tripGroup.driverName} profile`}
                        className="cart-page-driver-avatar"
                        src={tripGroup.driverPhoto}
                      />
                      <div>
                        <h2>{tripGroup.driverName}</h2>
                        <p>{tripGroup.pickupTime}</p>
                      </div>
                    </div>
                  </div>

                  <button
                    className="cart-page-remove-button"
                    onClick={() => removeTripGroup(tripGroup.tripId)}
                    type="button"
                  >
                    Remove
                  </button>
                </div>

                <div className="cart-page-group-meta">
                  <article>
                    <span>Pickup location</span>
                    <strong>{tripGroup.pickupLabel}</strong>
                  </article>
                  <article>
                    <span>Items</span>
                    <strong>{tripGroup.lineCount}</strong>
                  </article>
                  <article>
                    <span>Driver subtotal</span>
                    <strong>${tripGroup.subtotal.toFixed(2)}</strong>
                  </article>
                </div>

                <ul className="cart-page-item-list">
                  {tripGroup.items.map((item) => (
                    <li className="cart-page-item-row" key={item.id}>
                      <div>
                        <strong>{item.name}</strong>
                        <p>
                          {item.quantity} {item.unit}
                        </p>
                      </div>
                      <span>${(item.quantity * item.unitPrice).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))
          ) : (
            <article className="cart-page-empty-state">
              <h2>Your cart is empty</h2>
              <p>Add items from the trip feed, then review them here by driver trip.</p>
              <Link className="cart-page-link-button" to="/trip-feed">
                Browse trips
              </Link>
            </article>
          )}
        </div>

        <aside className="cart-page-summary-card">
          <p className="cart-page-summary-kicker">Summary</p>
          <h2>Your order</h2>

          <div className="cart-page-summary-list">
            <div>
              <span>Driver groups</span>
              <strong>{cart.length}</strong>
            </div>
            <div>
              <span>Total items</span>
              <strong>{cartLineCount}</strong>
            </div>
            <div>
              <span>Subtotal</span>
              <strong>${cartSubtotal.toFixed(2)}</strong>
            </div>
          </div>

          <button
            className="cart-page-checkout-button"
            disabled={cart.length === 0 || isCheckingOut}
            onClick={handleCheckout}
            type="button"
          >
            {isCheckingOut ? 'Placing order...' : 'Checkout'}
          </button>

          <Link className="cart-page-secondary-link" to="/trip-feed">
            Continue shopping
          </Link>

          {checkoutMessage ? <p className="cart-page-message">{checkoutMessage}</p> : null}
        </aside>
      </section>
    </main>
  );
}
