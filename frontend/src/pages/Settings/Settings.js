import ShopperHeader from '../../components/ShopperHeader';
import useSettingsPageState from '../../hooks/useSettingsPageState';
import './Settings.css';

/**
 * Renders editable profile settings and notification preferences.
 */
export default function Settings() {
  const { isScrolled, scrollProgress, settings, saveMessage, saveError, isSaving, handleInputChange, handleSave } =
    useSettingsPageState();

  return (
    <main className="settings-page">
      <ShopperHeader activePage="" isScrolled={isScrolled} scrollProgress={scrollProgress} />

      <section className="settings-intro">
        <p className="settings-kicker">Settings</p>
        <h1>Account settings</h1>
        <p>
          Control the defaults Bulk Buddy uses for your shopper experience, including contact
          details, nearby search radius, and notifications.
        </p>
      </section>

      <form className="settings-form" onSubmit={handleSave}>
        <section className="settings-grid">
          <article className="settings-card">
            <div className="settings-card-copy">
              <p className="settings-card-kicker">Account</p>
              <h2>Profile defaults</h2>
              <p>Update the shopper information and location preferences used across the app.</p>
            </div>

            <div className="settings-field-grid">
              <label className="settings-field">
                <span>Display name</span>
                <input
                  name="displayName"
                  onChange={handleInputChange}
                  type="text"
                  value={settings.displayName}
                />
              </label>

              <label className="settings-field">
                <span>Email</span>
                <input
                  name="email"
                  onChange={handleInputChange}
                  type="email"
                  value={settings.email}
                />
              </label>

              <label className="settings-field">
                <span>Nearby radius</span>
                <select
                  name="nearbyRadius"
                  onChange={handleInputChange}
                  value={settings.nearbyRadius}
                >
                  <option>3 miles</option>
                  <option>5 miles</option>
                  <option>8 miles</option>
                </select>
              </label>

              <label className="settings-field settings-field--full">
                <span>Address</span>
                <input
                  name="address"
                  onChange={handleInputChange}
                  type="text"
                  value={settings.address}
                />
              </label>
            </div>
          </article>

          <article className="settings-card">
            <div className="settings-card-copy">
              <p className="settings-card-kicker">Notifications</p>
              <h2>What you want to hear about</h2>
              <p>Choose which updates Bulk Buddy should keep sending while your orders move.</p>
            </div>

            <div className="settings-toggle-list">
              {/* Each row pairs a short explanation with a custom-styled checkbox
                  so the controls read like settings instead of plain form inputs. */}
              <label className="settings-toggle-row">
                <div>
                  <strong>Order updates</strong>
                  <p>Status changes for claimed, purchased, and completed items.</p>
                </div>
                <span className="settings-toggle">
                  <input
                    checked={settings.orderUpdates}
                    name="orderUpdates"
                    onChange={handleInputChange}
                    type="checkbox"
                  />
                  <span className="settings-toggle-slider" />
                </span>
              </label>

              <label className="settings-toggle-row">
                <div>
                  <strong>Pickup reminders</strong>
                  <p>Reminders before your chosen pickup window starts.</p>
                </div>
                <span className="settings-toggle">
                  <input
                    checked={settings.pickupReminders}
                    name="pickupReminders"
                    onChange={handleInputChange}
                    type="checkbox"
                  />
                  <span className="settings-toggle-slider" />
                </span>
              </label>

              <label className="settings-toggle-row">
                <div>
                  <strong>Driver messages</strong>
                  <p>Alerts when a driver leaves new notes or handoff instructions.</p>
                </div>
                <span className="settings-toggle">
                  <input
                    checked={settings.driverMessages}
                    name="driverMessages"
                    onChange={handleInputChange}
                    type="checkbox"
                  />
                  <span className="settings-toggle-slider" />
                </span>
              </label>

              <label className="settings-toggle-row">
                <div>
                  <strong>New trips nearby</strong>
                  <p>Heads-up when new driver trips appear within your selected radius.</p>
                </div>
                <span className="settings-toggle">
                  <input
                    checked={settings.newTripsNearby}
                    name="newTripsNearby"
                    onChange={handleInputChange}
                    type="checkbox"
                  />
                  <span className="settings-toggle-slider" />
                </span>
              </label>
            </div>
          </article>
        </section>

        <section className="settings-save-bar">
          <p>{saveError || saveMessage || 'Make changes here, then save when you are ready.'}</p>
          <button className="settings-primary-action" disabled={isSaving} type="submit">
            {isSaving ? 'Saving...' : 'Save settings'}
          </button>
        </section>
      </form>
    </main>
  );
}
