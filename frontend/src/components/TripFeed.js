import { useEffect, useMemo, useState } from 'react';
import ShopperHeader from './ShopperHeader';
import usePageScrollProgress from './usePageScrollProgress';
import './TripFeed.css';

/**
 * Builds a lightweight avatar image from initials so the mock feed can render
 * profile photos without depending on uploaded assets.
 */
function createAvatarImage(name, backgroundColor) {
  const initials = name
    .split(' ')
    .map((segment) => segment[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
      <rect width="96" height="96" fill="${backgroundColor}" rx="48" />
      <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" fill="#ffffff" font-size="35" font-family="Geologica, sans-serif" font-weight="700">
        ${initials}
      </text>
    </svg>
  `;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const shopperLocation = {
  label: 'Mission District, San Francisco',
  lat: 37.7599,
  lng: -122.4148,
};

const tripSeed = [
  {
    id: 'costco-mission',
    driver: {
      name: 'James Olaitan',
      photo: createAvatarImage('James Olaitan', '#4d216a'),
      rating: 4.9,
      vehicle: 'Gray Honda CR-V',
      locationLabel: 'Mission District, Valencia St',
    },
    driverLocation: { lat: 37.7598, lng: -122.421 },
    pickupLocation: null,
    pickupTime: 'Saturday, March 14 • 5:30 PM',
    items: [
      { id: 'rice', name: 'Kirkland Rice 25lb', availableQty: 3, unit: 'shares', unitPrice: 6.25 },
      { id: 'chicken', name: 'Chicken Breasts', availableQty: 2, unit: 'shares', unitPrice: 8.5 },
      { id: 'eggs', name: 'Organic Eggs 24-pack', availableQty: 4, unit: 'shares', unitPrice: 3.75 },
    ],
  },
  {
    id: 'sams-soma',
    driver: {
      name: 'Chikamso Adireje',
      photo: createAvatarImage('Chikamso Adireje', '#2f6f73'),
      rating: 4.8,
      vehicle: 'White Toyota Corolla',
      locationLabel: 'SoMa, 4th & King',
    },
    driverLocation: { lat: 37.7767, lng: -122.3948 },
    pickupLocation: { label: 'Yerba Buena Gardens pickup point', lat: 37.784, lng: -122.4024 },
    pickupTime: 'Sunday, March 15 • 11:00 AM',
    items: [
      { id: 'yogurt', name: 'Greek Yogurt Variety Pack', availableQty: 5, unit: 'cups', unitPrice: 1.8 },
      { id: 'avocados', name: 'Avocado Bag', availableQty: 3, unit: 'shares', unitPrice: 4.4 },
      { id: 'spinach', name: 'Baby Spinach Clamshell', availableQty: 4, unit: 'shares', unitPrice: 2.1 },
    ],
  },
  {
    id: 'costco-sunset',
    driver: {
      name: 'Johnbosco Ochije',
      photo: createAvatarImage('Johnbosco Ochije', '#6f3b8f'),
      rating: 4.7,
      vehicle: 'Blue Subaru Outback',
      locationLabel: 'Inner Sunset, 9th Ave',
    },
    driverLocation: { lat: 37.7641, lng: -122.4661 },
    pickupLocation: null,
    pickupTime: 'Monday, March 16 • 6:15 PM',
    items: [
      { id: 'salmon', name: 'Atlantic Salmon Fillets', availableQty: 2, unit: 'shares', unitPrice: 12.75 },
      { id: 'broccoli', name: 'Broccoli Florets', availableQty: 6, unit: 'bags', unitPrice: 2.65 },
      { id: 'bananas', name: 'Organic Bananas', availableQty: 8, unit: 'bundles', unitPrice: 1.4 },
    ],
  },
];

function toRadians(value) {
  return (value * Math.PI) / 180;
}

/**
 * Uses the Haversine formula to estimate shopper-to-pickup distance in miles.
 */
function getDistanceMiles(start, end) {
  const earthRadiusMiles = 3958.8;
  const latDelta = toRadians(end.lat - start.lat);
  const lngDelta = toRadians(end.lng - start.lng);
  const startLat = toRadians(start.lat);
  const endLat = toRadians(end.lat);

  const a =
    Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
    Math.cos(startLat) * Math.cos(endLat) * Math.sin(lngDelta / 2) * Math.sin(lngDelta / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusMiles * c;
}

/**
 * Trips can omit a dedicated pickup point, so the driver's area becomes the
 * fallback location for sorting and display.
 */
function getPickupLocation(trip) {
  if (trip.pickupLocation) {
    return trip.pickupLocation;
  }

  return {
    lat: trip.driverLocation.lat,
    lng: trip.driverLocation.lng,
    label: trip.driver.locationLabel,
  };
}

function formatDistance(distanceMiles) {
  return `${distanceMiles.toFixed(1)} miles away`;
}

export default function TripFeed() {
  // The feed keeps a temporary draft quantity per item before anything is added to cart.
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [draftQuantities, setDraftQuantities] = useState({});
  const [cart, setCart] = useState(null);
  const [checkoutMessage, setCheckoutMessage] = useState('');
  const { isScrolled, scrollProgress } = usePageScrollProgress();

  const trips = useMemo(() => {
    // Precompute the display location and distance once so the UI can stay focused on rendering.
    return tripSeed
      .map((trip) => {
        const resolvedPickupLocation = getPickupLocation(trip);
        const distanceMiles = getDistanceMiles(shopperLocation, resolvedPickupLocation);

        return {
          ...trip,
          resolvedPickupLocation,
          distanceMiles,
        };
      })
      .sort((left, right) => left.distanceMiles - right.distanceMiles);
  }, []);

  const selectedTrip = trips.find((trip) => trip.id === selectedTripId) || trips[0] || null;

  useEffect(() => {
    if (!selectedTripId && trips[0]) {
      setSelectedTripId(trips[0].id);
    }
  }, [selectedTripId, trips]);

  useEffect(() => {
    if (!selectedTrip) {
      return;
    }

    // Reset the quantity inputs whenever the shopper switches to a different driver's trip.
    setDraftQuantities((current) => {
      const next = {};
      selectedTrip.items.forEach((item) => {
        next[item.id] = current[item.id] ?? 0;
      });
      return next;
    });
  }, [selectedTrip]);

  const selectedQuantityCount = selectedTrip
    ? selectedTrip.items.reduce((sum, item) => sum + (draftQuantities[item.id] || 0), 0)
    : 0;

  const cartLineCount = cart ? cart.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
  const cartSubtotal = cart
    ? cart.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
    : 0;

  function setItemQuantity(itemId, nextValue, maxValue) {
    // Clamp quantities so the UI never drifts outside the current available stock.
    const clampedValue = Math.max(0, Math.min(maxValue, nextValue));
    setDraftQuantities((current) => ({ ...current, [itemId]: clampedValue }));
  }

  function handleAddToCart() {
    if (!selectedTrip) {
      return;
    }

    const chosenItems = selectedTrip.items
      .map((item) => ({
        ...item,
        quantity: draftQuantities[item.id] || 0,
      }))
      .filter((item) => item.quantity > 0);

    if (chosenItems.length === 0) {
      setCheckoutMessage('Select at least one quantity before adding to cart.');
      return;
    }

    // Keep the cart scoped to a single trip so checkout always refers to one pickup plan.
    const replaceExistingTrip = cart && cart.tripId !== selectedTrip.id && cart.items.length > 0;

    setCart((currentCart) => {
      const isSameTrip = currentCart && currentCart.tripId === selectedTrip.id;
      const mergedItems = new Map(
        (isSameTrip ? currentCart.items : []).map((item) => [item.id, { ...item }]),
      );

      chosenItems.forEach((item) => {
        const existingLine = mergedItems.get(item.id);

        if (existingLine) {
          existingLine.quantity = Math.min(existingLine.quantity + item.quantity, item.availableQty);
          return;
        }

        mergedItems.set(item.id, {
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          unit: item.unit,
        });
      });

      return {
        tripId: selectedTrip.id,
        driverName: selectedTrip.driver.name,
        driverPhoto: selectedTrip.driver.photo,
        pickupTime: selectedTrip.pickupTime,
        pickupLabel: selectedTrip.resolvedPickupLocation.label,
        items: Array.from(mergedItems.values()),
      };
    });

    setDraftQuantities((current) => {
      const next = { ...current };
      chosenItems.forEach((item) => {
        next[item.id] = 0;
      });
      return next;
    });

    if (replaceExistingTrip) {
      setCheckoutMessage('Cart moved to this driver trip so checkout stays on one pickup plan.');
      return;
    }

    setCheckoutMessage('Items added to cart.');
  }

  function handleCheckout() {
    if (!cart || cart.items.length === 0) {
      setCheckoutMessage('Your cart is empty.');
      return;
    }

    setCheckoutMessage(`Checkout complete for ${cartLineCount} items. Pickup details saved.`);
    setCart(null);
  }

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
                  <span>{formatDistance(trip.distanceMiles)}</span>
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
                <p>{formatDistance(selectedTrip.distanceMiles)}</p>
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
          {cart && cart.items.length > 0 ? (
            <>
              <div className="cart-driver-row">
                <img alt={`${cart.driverName} profile`} className="driver-avatar driver-avatar-small" src={cart.driverPhoto} />
                <p className="cart-trip-meta">Driver {cart.driverName}</p>
              </div>
              <p className="cart-trip-meta">
                {cart.pickupTime} • {cart.pickupLabel}
              </p>
              <ul className="cart-list">
                {cart.items.map((item) => (
                  <li key={item.id}>
                    <span>
                      {item.name} x {item.quantity}
                    </span>
                    <strong>${(item.quantity * item.unitPrice).toFixed(2)}</strong>
                  </li>
                ))}
              </ul>
              <div className="cart-total-row">
                <span>Total ({cartLineCount} items)</span>
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
