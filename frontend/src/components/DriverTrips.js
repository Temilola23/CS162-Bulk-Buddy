import ShopperHeader from './ShopperHeader';
import useDriverTripsPageState from '../hooks/useDriverTripsPageState';
import './DriverTrips.css';

export default function DriverTrips() {
  const {
    isScrolled,
    scrollProgress,
    tripForm,
    driverTrips,
    isTripsLoading,
    errorMessage,
    submitMessage,
    isSubmitting,
    handleTripFieldChange,
    handleItemFieldChange,
    addItemRow,
    removeItemRow,
    handleCreateTrip,
  } = useDriverTripsPageState();

  return (
    <main className="driver-trips-page">
      <ShopperHeader
        activePage="post-trip"
        isScrolled={isScrolled}
        scrollProgress={scrollProgress}
      />

      <section className="driver-trips-intro">
        <p className="driver-trips-kicker">Driver View</p>
        <h1>Post a new trip</h1>
        <p>
          Create an upcoming warehouse run, list the items you can carry, and manage the trips
          you have already posted.
        </p>
      </section>

      <section className="driver-trips-layout">
        <article className="driver-trips-card">
          <div className="driver-trips-card-header">
            <p className="driver-trips-card-kicker">Create trip</p>
            <h2>Trip details</h2>
          </div>

          <form className="driver-trip-form" onSubmit={handleCreateTrip}>
            <label className="driver-trip-field">
              <span>Warehouse or store name</span>
              <input
                name="storeName"
                onChange={handleTripFieldChange}
                placeholder="Costco"
                value={tripForm.storeName}
              />
            </label>

            <label className="driver-trip-field">
              <span>Pickup location</span>
              <input
                name="pickupLocationText"
                onChange={handleTripFieldChange}
                placeholder="Mission District, Valencia St"
                value={tripForm.pickupLocationText}
              />
            </label>

            <label className="driver-trip-field">
              <span>Pickup time</span>
              <input
                name="pickupTime"
                onChange={handleTripFieldChange}
                type="datetime-local"
                value={tripForm.pickupTime}
              />
            </label>

            <div className="driver-trip-items-block">
              <div className="driver-trip-items-header">
                <div>
                  <h3>What can shoppers claim?</h3>
                </div>
                <button className="driver-trip-add-item" onClick={addItemRow} type="button">
                  + Add item
                </button>
              </div>

              <div className="driver-trip-items-list">
                {tripForm.items.map((item, index) => (
                  <div className="driver-trip-item-row" key={`trip-item-${index}`}>
                    <label className="driver-trip-field">
                      <span>Item name</span>
                      <input
                        onChange={(event) =>
                          handleItemFieldChange(index, 'name', event.target.value)
                        }
                        placeholder="Kirkland Rice 25lb"
                        value={item.name}
                      />
                    </label>

                    <label className="driver-trip-field">
                      <span>Unit</span>
                      <input
                        onChange={(event) =>
                          handleItemFieldChange(index, 'unit', event.target.value)
                        }
                        placeholder="bag"
                        value={item.unit}
                      />
                    </label>

                    <label className="driver-trip-field">
                      <span>Total quantity</span>
                      <input
                        min="1"
                        onChange={(event) =>
                          handleItemFieldChange(index, 'totalQuantity', event.target.value)
                        }
                        placeholder="4"
                        type="number"
                        value={item.totalQuantity}
                      />
                    </label>

                    <label className="driver-trip-field">
                      <span>Approx unit price</span>
                      <input
                        min="0"
                        onChange={(event) =>
                          handleItemFieldChange(index, 'pricePerUnit', event.target.value)
                        }
                        placeholder="6.00"
                        step="0.01"
                        type="number"
                        value={item.pricePerUnit}
                      />
                    </label>

                    <button
                      className="driver-trip-remove-item"
                      onClick={() => removeItemRow(index)}
                      type="button"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {errorMessage ? <p className="driver-trip-feedback is-error">{errorMessage}</p> : null}
            {submitMessage ? <p className="driver-trip-feedback is-success">{submitMessage}</p> : null}

            <button className="driver-trip-submit" disabled={isSubmitting} type="submit">
              {isSubmitting ? 'Posting trip...' : 'Post trip'}
            </button>
          </form>
        </article>

        <article className="driver-trips-card">
          <div className="driver-trips-card-header">
            <p className="driver-trips-card-kicker">My trips</p>
            <h2>Posted trips</h2>
          </div>

          <div className="driver-trip-list">
            {isTripsLoading ? <p className="driver-trip-feedback">Loading your trips...</p> : null}

            {!isTripsLoading && driverTrips.length === 0 ? (
              <p className="driver-trip-feedback">No trips posted yet.</p>
            ) : null}

            {driverTrips.map((trip) => (
              <article className="driver-trip-summary" key={trip.id}>
                <div className="driver-trip-summary-row">
                  <div>
                    <h3>{trip.storeName}</h3>
                    <p>{trip.pickupLocationText}</p>
                  </div>
                  <span className={`driver-trip-status is-${trip.status}`.trim()}>
                    {trip.statusLabel}
                  </span>
                </div>
                <p>{trip.pickupTimeLabel}</p>
                {trip.itemCount !== null ? <p>{trip.itemCount} items in this trip</p> : null}
              </article>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
