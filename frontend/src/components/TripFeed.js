import ShopperHeader from './ShopperHeader';
import usePageScrollProgress from './usePageScrollProgress';
import useTripFeedState from '../hooks/useTripFeedState';
import './TripFeed.css';

export default function TripFeed() {
  const { isScrolled, scrollProgress } = usePageScrollProgress();
  const {
    trips,
    selectedTrip,
    setSelectedTripId,
    draftQuantities,
    selectedQuantityCount,
    cart,
    cartLineCount,
    cartSubtotal,
    checkoutMessage,
    setItemQuantity,
    handleAddToCart,
    handleCheckout,
  } = useTripFeedState();

  return (
    <main className="trip-feed-page">
      <ShopperHeader
        activePage="trip-feed"
        isScrolled={isScrolled}
        scrollProgress={scrollProgress}
      />

      <section className="trip-feed-intro">
        <p className="trip-feed-kicker">Trip feed</p>
        <h1>Nearby Driver Trips</h1>
        <p>
          Distances are calculated from the pickup point. If a trip has no explicit pickup point,
          the driver location is used by default.
        </p>
      </section>

      <section className="trip-feed-layout">
        <aside className="trip-list-panel">
          <div className="trip-panel-title">
            <img alt="" aria-hidden="true" className="trip-panel-title-icon" src="/images/available-trips.png" />
            <h2>Available trips</h2>
          </div>
          <div className="trip-list">
            {trips.map((trip) => (
              <button
                className={`trip-list-item ${selectedTrip?.id === trip.id ? 'is-active' : ''}`}
                key={trip.id}
                onClick={() => setSelectedTripId(trip.id)}
                type="button"
              >
                <div className="trip-list-row">
                  <div className="trip-list-driver">
                    <img alt={`${trip.driver.name} profile`} className="driver-avatar driver-avatar-small" src={trip.driver.photo} />
                    <strong>{trip.driver.name}</strong>
                  </div>
                  <span>{trip.distanceLabel}</span>
                </div>
                <p>{trip.pickupTime}</p>
                <p>Pickup: {trip.resolvedPickupLocation.label}</p>
              </button>
            ))}
          </div>
        </aside>

        <section className="trip-detail-panel">
          {selectedTrip ? (
            <>
              {/* Feed detail stays inline for now so shoppers can compare trips quickly. */}
              <header className="trip-detail-header">
                <div className="trip-detail-driver">
                  <img
                    alt={`${selectedTrip.driver.name} profile`}
                    className="driver-avatar"
                    src={selectedTrip.driver.photo}
                  />
                  <h2>{selectedTrip.driver.name}</h2>
                </div>
                <p>{selectedTrip.distanceLabel}</p>
              </header>

              <div className="trip-detail-meta-grid">
                <article>
                  <h3>Driver info</h3>
                  <div className="trip-driver-identity">
                    <img
                      alt={`${selectedTrip.driver.name} profile`}
                      className="driver-avatar driver-avatar-small"
                      src={selectedTrip.driver.photo}
                    />
                    <p>{selectedTrip.driver.name}</p>
                  </div>
                  <p>Rating: {selectedTrip.driver.rating.toFixed(1)} / 5</p>
                  <p>Vehicle: {selectedTrip.driver.vehicle}</p>
                </article>
                <article>
                  <h3>Pickup</h3>
                  <p>{selectedTrip.pickupTime}</p>
                  <p>{selectedTrip.resolvedPickupLocation.label}</p>
                </article>
              </div>

              <div className="trip-items-grid">
                {selectedTrip.items.map((item) => (
                  <article className="trip-item-card" key={item.id}>
                    <h3>{item.name}</h3>
                    <p>Available: {item.availableQty} {item.unit}</p>
                    <p>Approx ${item.unitPrice.toFixed(2)} each</p>

                    <div className="quantity-stepper">
                      <button
                        aria-label={`Decrease ${item.name} quantity`}
                        onClick={() =>
                          setItemQuantity(
                            item.id,
                            (draftQuantities[item.id] || 0) - 1,
                            item.availableQty,
                          )
                        }
                        type="button"
                      >
                        −
                      </button>
                      <input
                        aria-label={`${item.name} quantity`}
                        max={item.availableQty}
                        min="0"
                        onChange={(event) =>
                          setItemQuantity(
                            item.id,
                            Number.parseInt(event.target.value, 10) || 0,
                            item.availableQty,
                          )
                        }
                        type="number"
                        value={draftQuantities[item.id] || 0}
                      />
                      <button
                        aria-label={`Increase ${item.name} quantity`}
                        onClick={() =>
                          setItemQuantity(
                            item.id,
                            (draftQuantities[item.id] || 0) + 1,
                            item.availableQty,
                          )
                        }
                        type="button"
                      >
                        +
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              <button className="trip-add-button" onClick={handleAddToCart} type="button">
                Add selected items ({selectedQuantityCount}) to cart
              </button>
            </>
          ) : (
            <p>No trips available right now.</p>
          )}
        </section>

        <aside className="trip-cart-panel">
          <h2>Cart</h2>
          {cart.length > 0 ? (
            <>
              <div className="cart-group-list">
                {cart.map((tripGroup) => {
                  const tripSubtotal = tripGroup.items.reduce(
                    (sum, item) => sum + item.quantity * item.unitPrice,
                    0,
                  );

                  return (
                    <section className="cart-group" key={tripGroup.tripId}>
                      <div className="cart-driver-row">
                        <img
                          alt={`${tripGroup.driverName} profile`}
                          className="driver-avatar driver-avatar-small"
                          src={tripGroup.driverPhoto}
                        />
                        <p className="cart-trip-meta">Driver {tripGroup.driverName}</p>
                      </div>
                      <p className="cart-trip-meta">
                        {tripGroup.pickupTime} • {tripGroup.pickupLabel}
                      </p>
                      <ul className="cart-list">
                        {tripGroup.items.map((item) => (
                          <li key={item.id}>
                            <span>
                              {item.name} x {item.quantity}
                            </span>
                            <strong>${(item.quantity * item.unitPrice).toFixed(2)}</strong>
                          </li>
                        ))}
                      </ul>
                      <div className="cart-group-total">
                        <span>Driver subtotal</span>
                        <strong>${tripSubtotal.toFixed(2)}</strong>
                      </div>
                    </section>
                  );
                })}
              </div>
              <div className="cart-total-row">
                <span>
                  Total ({cartLineCount} items across {cart.length}{' '}
                  {cart.length === 1 ? 'driver' : 'drivers'})
                </span>
                <strong>${cartSubtotal.toFixed(2)}</strong>
              </div>
            </>
          ) : (
            <p className="cart-empty">Add items from a trip card to start checkout.</p>
          )}

          <button className="trip-checkout-button" onClick={handleCheckout} type="button">
            Checkout
          </button>

          {checkoutMessage ? <p className="checkout-message">{checkoutMessage}</p> : null}
        </aside>
      </section>
    </main>
  );
}
