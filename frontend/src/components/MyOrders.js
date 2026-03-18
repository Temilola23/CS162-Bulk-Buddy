import ShopperHeader from './ShopperHeader';
import useLinkedOrderSelection, { buildLinkedOrderHref } from './useLinkedOrderSelection';
import usePageScrollProgress from './usePageScrollProgress';
import { shopperOrders, statusSteps } from '../data/shopperOrders';
import './MyOrders.css';

const calendarDateFormatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
});

function formatStatus(stepIndex) {
  return statusSteps[stepIndex].toUpperCase();
}

function formatCalendarDate(dateValue) {
  if (!dateValue) {
    return 'Choose a date';
  }

  return calendarDateFormatter.format(new Date(`${dateValue}T12:00:00`));
}

function getStatusProgress(stepIndex) {
  return `${((stepIndex + 1) / statusSteps.length) * 100}%`;
}

function getStatusMarkerPosition(stepIndex) {
  return `${((stepIndex + 1) / statusSteps.length) * 100}%`;
}

function ChevronIcon() {
  return (
    <svg fill="none" viewBox="0 0 12 8" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M1.25 1.5 6 6.25l4.75-4.75"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export default function MyOrders() {
  const { isScrolled, scrollProgress } = usePageScrollProgress();
  const {
    selection,
    activeBucket,
    setActiveBucket,
    selectedDate,
    setSelectedDate,
    activeOrder,
    activeOrderIndex,
    setActiveOrderId,
    setActiveOrderIndex,
    ordersForDate,
  } = useLinkedOrderSelection(shopperOrders, 'upcoming');
  // The day switcher behaves like a small carousel over the orders on the chosen date.
  const canViewPreviousOrder = activeOrderIndex > 0;
  const canViewNextOrder = activeOrderIndex < ordersForDate.length - 1;

  return (
    <main className="my-orders-page">
      <ShopperHeader
        activePage="my-orders"
        isScrolled={isScrolled}
        scrollProgress={scrollProgress}
      />

      <section className="my-orders-intro">
        <p className="my-orders-kicker">Shopper view</p>
        <h1>My Orders</h1>
        <p>
          Pick a date to review every order you made that day, then move left and right through
          each trip without losing the item status history.
        </p>
      </section>

      <div className="my-orders-tabs" role="tablist">
        <button
          aria-selected={activeBucket === 'upcoming'}
          className={`my-orders-tab ${activeBucket === 'upcoming' ? 'is-active' : ''}`.trim()}
          onClick={() => setActiveBucket('upcoming')}
          role="tab"
          type="button"
        >
          Upcoming
        </button>
        <button
          aria-selected={activeBucket === 'past'}
          className={`my-orders-tab ${activeBucket === 'past' ? 'is-active' : ''}`.trim()}
          onClick={() => setActiveBucket('past')}
          role="tab"
          type="button"
        >
          Past
        </button>
      </div>

      <section className="my-orders-calendar-panel" aria-label="Order calendar">
        <div className="my-orders-calendar-copy">
          <p className="my-orders-calendar-kicker">Order calendar</p>
          <h2>{formatCalendarDate(selectedDate)}</h2>
          <p>
            {ordersForDate.length > 0
              ? `${ordersForDate.length} ${ordersForDate.length === 1 ? 'order' : 'orders'} in ${activeBucket}.`
              : `No ${activeBucket} orders found for this day.`}
          </p>
        </div>

        <label className="my-orders-date-field">
          <span>Choose a date</span>
          <input
            onChange={(event) => setSelectedDate(event.target.value)}
            type="date"
            value={selectedDate}
          />
        </label>
      </section>

      <section className="my-orders-order-switcher" aria-label="Orders for selected date">
        <button
          aria-label="Show previous order"
          className="my-orders-order-arrow"
          disabled={!canViewPreviousOrder}
          onClick={() => setActiveOrderIndex(activeOrderIndex - 1)}
          type="button"
        >
          <span aria-hidden="true" className="my-orders-order-arrow-icon is-left">
            <ChevronIcon />
          </span>
        </button>

        <div className="my-orders-order-tabs" role="tablist">
          {ordersForDate.map((order) => (
            <button
              aria-selected={activeOrder?.id === order.id}
              className={`my-orders-order-tab ${activeOrder?.id === order.id ? 'is-active' : ''}`.trim()}
              key={order.id}
              onClick={() => setActiveOrderId(order.id)}
              role="tab"
              type="button"
            >
              <strong>{order.switcherLabel}</strong>
              <span>{order.switcherMeta}</span>
            </button>
          ))}
        </div>

        <button
          aria-label="Show next order"
          className="my-orders-order-arrow"
          disabled={!canViewNextOrder}
          onClick={() => setActiveOrderIndex(activeOrderIndex + 1)}
          type="button"
        >
          <span aria-hidden="true" className="my-orders-order-arrow-icon is-right">
            <ChevronIcon />
          </span>
        </button>
      </section>

      <section className="my-orders-group-list">
        {activeOrder ? (
          <article className="order-group-card" key={activeOrder.id}>
            <div className="order-group-header">
              <div>
                <h2>{activeOrder.title}</h2>
                <p>{activeOrder.summary}</p>
              </div>
              <a
                className="order-group-link"
                href={buildLinkedOrderHref('/trip-detail', selection)}
              >
                View trip detail
              </a>
            </div>

            <div className="order-item-list">
              {activeOrder.items.map((item) => (
                <article className="order-item-card" key={item.id}>
                  <div className="order-item-head">
                    <div>
                      <h3>{item.name}</h3>
                      <p>{item.quantityLabel}</p>
                    </div>
                    <span className="order-item-status-pill">
                      Current: {formatStatus(item.currentStep)}
                    </span>
                  </div>

                  <div className="order-status-track" role="list">
                    {statusSteps.map((step, index) => (
                      <span
                        className={`order-status-step ${
                          index <= item.currentStep ? 'is-reached' : ''
                        } ${index === item.currentStep ? 'is-current' : ''}`.trim()}
                        key={step}
                        role="listitem"
                      >
                        {step}
                      </span>
                    ))}
                  </div>

                  <div aria-hidden="true" className="order-status-line">
                    {/* The progress line mirrors the status pills with a continuous fill. */}
                    <span
                      className="order-status-line-fill"
                      style={{ width: getStatusProgress(item.currentStep) }}
                    />
                    {statusSteps.map((step, index) => (
                      <span
                        className={`order-status-line-marker ${
                          index <= item.currentStep ? 'is-reached' : ''
                        } ${index === item.currentStep ? 'is-current' : ''}`.trim()}
                        key={step}
                        style={{ left: getStatusMarkerPosition(index) }}
                      />
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </article>
        ) : (
          <article className="my-orders-empty-state">
            <h2>No orders on this date</h2>
            <p>Choose another day to review your orders and their item statuses.</p>
          </article>
        )}
      </section>
    </main>
  );
}
