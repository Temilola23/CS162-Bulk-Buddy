import { Link } from 'react-router-dom';
import ShopperHeader from './ShopperHeader';
import ChevronIcon from './shared/ChevronIcon';
import { buildLinkedOrderHref } from '../utils/linkedOrderHref';
import { statusSteps } from '../data/shopperOrders';
import useMyOrdersPageState from '../hooks/useMyOrdersPageState';
import { formatCalendarDate } from '../utils/dateFormatting';
import { formatStatus, getStatusMarkerPosition, getStatusProgress } from '../utils/orderStatus';
import './MyOrders.css';

export default function MyOrders() {
  const {
    isScrolled,
    scrollProgress,
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
    canViewPreviousOrder,
    canViewNextOrder,
    orderStatusStepIndex,
    isOrdersLoading,
    ordersError,
  } = useMyOrdersPageState();

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
        {isOrdersLoading ? (
          <article className="my-orders-empty-state">
            <h2>Loading orders</h2>
            <p>Fetching your latest order history.</p>
          </article>
        ) : null}

        {!isOrdersLoading && ordersError ? (
          <article className="my-orders-empty-state">
            <h2>Unable to load orders</h2>
            <p>{ordersError}</p>
          </article>
        ) : null}

        {!isOrdersLoading && !ordersError && activeOrder ? (
          <article className={`order-group-card ${activeOrder?.apiStatus === 'completed' ? 'is-completed' : ''}`} key={activeOrder.id}>
            <div className="order-group-header">
              <div>
                <h2>{activeOrder.title}</h2>
                <p>{activeOrder.summary}</p>
              </div>
              <Link
                className="order-group-link"
                to={buildLinkedOrderHref('/trip-detail', selection)}
              >
                View trip detail
              </Link>
            </div>

            <div className="order-group-status">
              <span className="order-item-status-pill">
                Current: {formatStatus(orderStatusStepIndex)}
              </span>

              <div className="order-status-track" role="list">
                {statusSteps.map((step, index) => (
                  <span
                    className={`order-status-step ${
                      index <= orderStatusStepIndex ? 'is-reached' : ''
                    } ${index === orderStatusStepIndex ? 'is-current' : ''}`.trim()}
                    key={step}
                    role="listitem"
                  >
                    {step}
                  </span>
                ))}
              </div>

              <div aria-hidden="true" className="order-status-line">
                <span
                  className="order-status-line-fill"
                  style={{ width: getStatusProgress(orderStatusStepIndex) }}
                />
                {statusSteps.map((step, index) => (
                  <span
                    className={`order-status-line-marker ${
                      index <= orderStatusStepIndex ? 'is-reached' : ''
                    } ${index === orderStatusStepIndex ? 'is-current' : ''}`.trim()}
                    key={step}
                    style={{ left: getStatusMarkerPosition(index) }}
                  />
                ))}
              </div>
            </div>

            <div className="order-item-list">
              {activeOrder.items.map((item) => (
                <article className="order-item-card" key={item.id}>
                  <div className="order-item-head">
                    <div>
                      <h3>{item.name}</h3>
                      <p>{item.quantityLabel}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </article>
        ) : !isOrdersLoading && !ordersError ? (
          <article className="my-orders-empty-state">
            <h2>No orders on this date</h2>
            <p>Choose another day to review your orders and their item statuses.</p>
          </article>
        ) : null}
      </section>
    </main>
  );
}
