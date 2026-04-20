import ShopperHeader from './ShopperHeader';
import useItemFeedPageState from '../hooks/useItemFeedPageState';
import './ItemFeed.css';

function getOrderContextLabel(item) {
  if (item.existingQuantity > 0) {
    return `You already claimed ${item.existingQuantity} ${item.unit}`;
  }

  if (item.existingOrder) {
    return 'You have an order from this trip';
  }

  return 'No order from this trip yet';
}

export default function ItemFeed() {
  const {
    isScrolled,
    scrollProgress,
    items,
    draftQuantities,
    isItemFeedLoading,
    itemFeedError,
    claimMessage,
    submittingItemId,
    setItemQuantity,
    handleAddItem,
  } = useItemFeedPageState();

  return (
    <main className="item-feed-page">
      <ShopperHeader
        activePage="item-feed"
        isScrolled={isScrolled}
        scrollProgress={scrollProgress}
      />

      <section className="item-feed-intro">
        <p className="item-feed-kicker">Item feed</p>
        <h1>Available Items</h1>
        <p>
          Browse claimable items from every open driver trip and add the quantity you need.
        </p>
      </section>

      <section className="item-feed-status-panel" aria-live="polite">
        <div>
          <p className="item-feed-status-kicker">Open inventory</p>
          <h2>
            {isItemFeedLoading
              ? 'Loading items'
              : `${items.length} ${items.length === 1 ? 'item' : 'items'} available`}
          </h2>
        </div>

        {itemFeedError ? <p className="item-feed-message is-error">{itemFeedError}</p> : null}
        {claimMessage ? <p className="item-feed-message">{claimMessage}</p> : null}
      </section>

      <section className="item-feed-grid" aria-label="Available items">
        {isItemFeedLoading ? (
          <article className="item-feed-empty-state">
            <h2>Loading item feed</h2>
            <p>Fetching available inventory from open driver trips.</p>
          </article>
        ) : null}

        {!isItemFeedLoading && !itemFeedError && items.length === 0 ? (
          <article className="item-feed-empty-state">
            <h2>No available items</h2>
            <p>Open trips will appear here as drivers post claimable items.</p>
          </article>
        ) : null}

        {items.map((item) => {
          const selectedQuantity = draftQuantities[item.id] || 0;
          const isSubmitting = submittingItemId === item.id;

          return (
            <article className="item-feed-card" key={item.id}>
              <div className="item-feed-card-header">
                <div>
                  <p className="item-feed-card-kicker">{item.storeName}</p>
                  <h2>{item.name}</h2>
                </div>
                <span className="item-feed-available-pill">
                  {item.availableQuantity} {item.unit} left
                </span>
              </div>

              <dl className="item-feed-meta-grid">
                <div>
                  <dt>Pickup</dt>
                  <dd>{item.pickupTime}</dd>
                </div>
                <div>
                  <dt>Driver</dt>
                  <dd className="item-feed-driver">
                    <img
                      alt={`${item.driver.name} profile`}
                      className="item-feed-driver-avatar"
                      src={item.driver.photo}
                    />
                    <span>{item.driver.name}</span>
                  </dd>
                </div>
                <div>
                  <dt>Pickup location</dt>
                  <dd>{item.pickupLabel}</dd>
                </div>
                <div>
                  <dt>Distance</dt>
                  <dd>{item.distanceLabel}</dd>
                </div>
                <div>
                  <dt>Approx price</dt>
                  <dd>${item.unitPrice.toFixed(2)} each</dd>
                </div>
                <div>
                  <dt>Your order</dt>
                  <dd>{getOrderContextLabel(item)}</dd>
                </div>
              </dl>

              <div className="item-feed-card-footer">
                <div
                  aria-label={`Selected quantity for ${item.name}`}
                  className="item-feed-stepper"
                  role="group"
                >
                  <button
                    aria-label={`Decrease ${item.name} quantity`}
                    disabled={selectedQuantity === 0 || isSubmitting}
                    onClick={() =>
                      setItemQuantity(item.id, selectedQuantity - 1, item.availableQuantity)
                    }
                    type="button"
                  >
                    -
                  </button>
                  <input
                    aria-label={`${item.name} quantity`}
                    disabled={isSubmitting}
                    max={item.availableQuantity}
                    min="0"
                    onChange={(event) =>
                      setItemQuantity(
                        item.id,
                        Number.parseInt(event.target.value, 10) || 0,
                        item.availableQuantity,
                      )
                    }
                    type="number"
                    value={selectedQuantity}
                  />
                  <button
                    aria-label={`Increase ${item.name} quantity`}
                    disabled={selectedQuantity >= item.availableQuantity || isSubmitting}
                    onClick={() =>
                      setItemQuantity(item.id, selectedQuantity + 1, item.availableQuantity)
                    }
                    type="button"
                  >
                    +
                  </button>
                </div>

                <button
                  className="item-feed-claim-button"
                  disabled={selectedQuantity === 0 || isSubmitting}
                  onClick={() => handleAddItem(item)}
                  type="button"
                >
                  {isSubmitting
                    ? 'Updating...'
                    : item.existingOrder
                      ? 'Add to existing order'
                      : 'Create order'}
                </button>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
