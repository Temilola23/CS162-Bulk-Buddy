import ShopperHeader from '../../components/ShopperHeader';
import ChevronIcon from '../../components/shared/ChevronIcon';
import useTripDetailPageState from '../../hooks/useTripDetailPageState';
import { statusSteps, tripRules } from '../../data/shopperOrders';
import { formatCalendarDate } from '../../utils/dateFormatting';
import {
  formatStatus,
  getStatusMarkerPosition,
  getStatusProgress,
} from '../../utils/orderStatus';
import { currencyFormatter } from '../../utils/currency';
import './TripDetail.css';

/**
 * Formats item share counts with the correct singular/plural label.
 */
function formatShareCount(count) {
  return `${count} ${count === 1 ? 'share' : 'shares'}`;
}

/**
 * Renders a linked order detail page with status and item controls.
 */
export default function TripDetail() {
  const {
    isScrolled,
    scrollProgress,
    selectedDate,
    setSelectedDate,
    activeOrder,
    activeOrderIndex,
    setActiveOrderId,
    setActiveOrderIndex,
    ordersForDate,
    quantitiesByOrder,
    activeClaimState,
    canCompleteActiveOrder,
    claimStateMessage,
    canViewPreviousOrder,
    canViewNextOrder,
    summary,
    orderStatusStepIndex,
    isOrdersLoading,
    ordersError,
    updateQuantity,
    updateClaimState,
  } = useTripDetailPageState();

  return (
    <main className="trip-detail-page">
      <ShopperHeader
        activePage="trip-detail"
        isScrolled={isScrolled}
        scrollProgress={scrollProgress}
      />

      <section className="trip-detail-intro">
        <p className="trip-detail-kicker">Trip Detail</p>
        <h1>{activeOrder ? activeOrder.heading : formatCalendarDate(selectedDate)}</h1>
        <p>
          Pick a date to review the orders you placed, then move left and right through every order
          saved on that day.
        </p>
      </section>

      {isOrdersLoading ? (
        <section className="trip-detail-empty-state">
          <h2>Loading orders</h2>
          <p>Fetching your trip details.</p>
        </section>
      ) : null}

      {ordersError ? (
        <section className="trip-detail-empty-state">
          <h2>Unable to load trip detail</h2>
          <p>{ordersError}</p>
        </section>
      ) : null}

      {!isOrdersLoading && !ordersError && activeOrder ? (
        <section className="trip-detail-status-overview" aria-label="Order status">
          <div className="trip-detail-status-overview-head">
            <p className="trip-detail-status-kicker">Order status</p>
            <span className="trip-detail-status-pill">
              Current: {formatStatus(orderStatusStepIndex)}
            </span>
          </div>

          <div className="trip-detail-status-track" role="list">
            {statusSteps.map((step, index) => (
              <span
                className={`trip-detail-status-step ${
                  index <= orderStatusStepIndex ? 'is-reached' : ''
                } ${index === orderStatusStepIndex ? 'is-current' : ''}`.trim()}
                key={step}
                role="listitem"
              >
                {step}
              </span>
            ))}
          </div>

          <div aria-hidden="true" className="trip-detail-status-line">
            <span
              className="trip-detail-status-line-fill"
              style={{ width: getStatusProgress(orderStatusStepIndex) }}
            />
            {statusSteps.map((step, index) => (
              <span
                className={`trip-detail-status-line-marker ${
                  index <= orderStatusStepIndex ? 'is-reached' : ''
                } ${index === orderStatusStepIndex ? 'is-current' : ''}`.trim()}
                key={step}
                style={{ left: getStatusMarkerPosition(index) }}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="trip-detail-calendar-panel" aria-label="Order calendar">
        <div className="trip-detail-calendar-copy">
          <p className="trip-detail-calendar-kicker">Order calendar</p>
          <h2>{formatCalendarDate(selectedDate)}</h2>
          <p>
            {ordersForDate.length > 0
              ? `${ordersForDate.length} ${ordersForDate.length === 1 ? 'order' : 'orders'} found for this day.`
              : 'No orders found for this day yet. Try another date.'}
          </p>
        </div>

        <label className="trip-detail-date-field">
          <span>Choose a date</span>
          <input
            onChange={(event) => setSelectedDate(event.target.value)}
            type="date"
            value={selectedDate}
          />
        </label>
      </section>

      <section className="trip-detail-order-switcher" aria-label="Orders for selected date">
        <button
          aria-label="Show previous order"
          className="trip-detail-order-arrow"
          disabled={!canViewPreviousOrder}
          onClick={() => setActiveOrderIndex(activeOrderIndex - 1)}
          type="button"
        >
          <span aria-hidden="true" className="trip-detail-order-arrow-icon is-left">
            <ChevronIcon />
          </span>
        </button>

        <div className="trip-detail-order-tabs" role="tablist">
          {ordersForDate.map((order) => (
            <button
              aria-selected={activeOrder?.id === order.id}
              className={`trip-detail-order-tab ${activeOrder?.id === order.id ? 'is-active' : ''}`.trim()}
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
          className="trip-detail-order-arrow"
          disabled={!canViewNextOrder}
          onClick={() => setActiveOrderIndex(activeOrderIndex + 1)}
          type="button"
        >
          <span aria-hidden="true" className="trip-detail-order-arrow-icon is-right">
            <ChevronIcon />
          </span>
        </button>
      </section>

      {!isOrdersLoading && !ordersError && activeOrder ? (
        <>
          <section className="trip-detail-meta-grid" aria-label="Trip overview">
            <article className="trip-detail-meta-card">
              <p className="trip-detail-meta-label">Pickup</p>
              <h2>{activeOrder.pickupLabel}</h2>
              <p>{activeOrder.pickupTime}</p>
            </article>

            <article className="trip-detail-meta-card">
              <p className="trip-detail-meta-label">Driver</p>
              <h2>{activeOrder.driver.name}</h2>
              <p>
                {activeOrder.driver.vehicle} • {activeOrder.driver.distanceLabel}
              </p>
            </article>

            <article className="trip-detail-meta-card">
              <p className="trip-detail-meta-label">Capacity</p>
              <h2>{activeOrder.capacity.slotsLeft} slots left</h2>
              <p>Status: {activeOrder.capacity.status}</p>
            </article>
          </section>

          <section className="trip-detail-note" aria-label="Trip note">
            <strong>Trip note:</strong> {activeOrder.note}
          </section>

          <section className="trip-detail-content">
            <div className="trip-detail-item-stack">
              <div className="trip-detail-item-list">
                {activeOrder.items.map((item) => {
                  const available = item.totalShares - item.claimed;
                  const selectedQuantity = quantitiesByOrder[activeOrder.id]?.[item.id] || 0;

                  return (
                    <article className="trip-detail-item-card" key={item.id}>
                      <div className="trip-detail-item-header">
                        <h2>{item.name}</h2>
                      </div>

                      <dl className="trip-detail-item-stats">
                        <div>
                          <dt>Unit</dt>
                          <dd>{item.unit}</dd>
                        </div>
                        <div>
                          <dt>Total shares</dt>
                          <dd>{item.totalShares}</dd>
                        </div>
                        <div>
                          <dt>Claimed</dt>
                          <dd>{item.claimed}</dd>
                        </div>
                        <div>
                          <dt>Available</dt>
                          <dd>{available}</dd>
                        </div>
                        <div>
                          <dt>Approx price per share</dt>
                          <dd>{currencyFormatter.format(item.pricePerShare)}</dd>
                        </div>
                      </dl>

                      <div className="trip-detail-item-footer">
                        <div
                          aria-label={`Selected quantity for ${item.name}`}
                          className="trip-detail-stepper"
                          role="group"
                        >
                          <button
                            aria-label={`Decrease quantity for ${item.name}`}
                            className="trip-detail-stepper-button"
                            disabled={selectedQuantity === 0}
                            onClick={() => updateQuantity(item.id, selectedQuantity - 1, available)}
                            type="button"
                          >
                            -
                          </button>
                          <span className="trip-detail-stepper-value">{selectedQuantity}</span>
                          <button
                            aria-label={`Increase quantity for ${item.name}`}
                            className="trip-detail-stepper-button"
                            disabled={selectedQuantity >= available}
                            onClick={() => updateQuantity(item.id, selectedQuantity + 1, available)}
                            type="button"
                          >
                            +
                          </button>
                        </div>

                        <span className="trip-detail-item-limit">Max {available} available</span>
                      </div>
                    </article>
                  );
                })}
              </div>

              <article className="trip-detail-rules-card">
                <h2>Claiming rules</h2>
                <dl className="trip-detail-rules-list">
                  {tripRules.map((rule) => (
                    <div className="trip-detail-rule-row" key={rule.label}>
                      <dt>{rule.label}</dt>
                      <dd>{rule.value}</dd>
                    </div>
                  ))}
                </dl>
              </article>
            </div>

            <aside className="trip-detail-summary-card">
              <p className="trip-detail-summary-kicker">Summary</p>
              <h2>Your claim</h2>

              <div className="trip-detail-summary-list">
                <div className="trip-detail-summary-row">
                  <span>Total quantity</span>
                  <strong>{formatShareCount(summary.totalQuantity)}</strong>
                </div>
                <div className="trip-detail-summary-row">
                  <span>Subtotal</span>
                  <strong>{currencyFormatter.format(summary.subtotal)}</strong>
                </div>
              </div>

              <div className="trip-detail-slider-block">
                <div
                  className={`trip-detail-status-slider ${
                    activeClaimState === 'completed' ? 'is-completed' : 'is-picked-up'
                  }`.trim()}
                  role="group"
                  aria-label="Order state"
                >
                  <button
                    aria-pressed={activeClaimState === 'picked-up'}
                    className={`trip-detail-status-option ${
                      activeClaimState === 'picked-up' ? 'is-active' : ''
                    }`.trim()}
                    onClick={() => updateClaimState('picked-up')}
                    type="button"
                  >
                    Picked up
                  </button>
                  <button
                    aria-pressed={activeClaimState === 'completed'}
                    className={`trip-detail-status-option ${
                      activeClaimState === 'completed' ? 'is-active' : ''
                    }`.trim()}
                    disabled={!canCompleteActiveOrder}
                    onClick={() => updateClaimState('completed')}
                    type="button"
                  >
                    Completed
                  </button>
                </div>
                {claimStateMessage ? (
                  <p className="trip-detail-slider-message">{claimStateMessage}</p>
                ) : null}
              </div>
            </aside>
          </section>
        </>
      ) : !isOrdersLoading && !ordersError ? (
        <section className="trip-detail-empty-state">
          <h2>No orders on this date</h2>
          <p>Choose another day from the calendar to load the order tabs and trip details.</p>
        </section>
      ) : null}
    </main>
  );
}
