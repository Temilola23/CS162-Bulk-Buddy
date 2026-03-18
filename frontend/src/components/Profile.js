import { useState } from 'react';
import ShopperHeader from './ShopperHeader';
import usePageScrollProgress from './usePageScrollProgress';
import { shopperProfile } from '../data/shopperProfile';
import './Profile.css';

function getInitialApplicationForm() {
  return {
    licenseNumber: '',
    expirationDate: '',
  };
}

export default function Profile() {
  const { isScrolled, scrollProgress } = usePageScrollProgress();
  const [applicationForm, setApplicationForm] = useState(getInitialApplicationForm);
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);

  function handleFieldChange(event) {
    const { name, value } = event.target;

    setApplicationForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleApplicationSubmit(event) {
    event.preventDefault();

    // The first view stays editable. Once submitted, the card flips into the
    // pending-review state so Post Trip remains visibly locked.
    setApplicationSubmitted(true);
  }

  return (
    <main className="profile-page">
      <ShopperHeader activePage="" isScrolled={isScrolled} scrollProgress={scrollProgress} />

      <section className="profile-intro">
        <p className="profile-kicker">Profile</p>
        <h1>Role, address, and driver verification</h1>
        <p>
          Keep your shopper details current, apply for driver verification, and track when trip
          posting becomes available.
        </p>
      </section>

      <section className="profile-post-trip-panel" aria-label="Post trip access">
        <div className="profile-post-trip-copy">
          <p className="profile-post-trip-kicker">Post Trip</p>
          <h2>Posting stays locked until driver access is approved.</h2>
          <p>
            {applicationSubmitted
              ? 'Your application is pending review, so trip posting is still unavailable right now.'
              : 'Complete the driver application first. An admin review will unlock trip posting once you are approved.'}
          </p>
        </div>
        <span
          className={`profile-status-badge ${applicationSubmitted ? 'is-pending' : 'is-locked'}`.trim()}
        >
          {applicationSubmitted ? 'Pending' : 'Locked'}
        </span>
      </section>

      <section className="profile-card-grid">
        <article className="profile-card profile-details-card">
          <div className="profile-identity">
            <span aria-hidden="true" className="profile-avatar">
              {shopperProfile.initials}
            </span>

            <div className="profile-identity-copy">
              <h2>{shopperProfile.name}</h2>
              <p>Role: {shopperProfile.role}</p>
            </div>
          </div>

          <dl className="profile-details-list">
            <div>
              <dt>Email</dt>
              <dd>{shopperProfile.email}</dd>
            </div>
            <div>
              <dt>Address</dt>
              <dd>{shopperProfile.address}</dd>
            </div>
            <div>
              <dt>Nearby radius</dt>
              <dd>{shopperProfile.nearbyRadius}</dd>
            </div>
          </dl>

          <div className="profile-details-actions">
            <button className="profile-secondary-action" type="button">
              Update address
            </button>
            <a className="profile-secondary-action is-outline profile-secondary-link" href="/settings">
              Settings
            </a>
          </div>
        </article>

        <article className="profile-card profile-application-card">
          <p className="profile-card-kicker">Driver application</p>

          {applicationSubmitted ? (
            <div className="profile-application-review">
              <h2>Application under review</h2>
              <p>
                An admin will review your license number and expiration date before driver access
                can be approved.
              </p>

              <span className="profile-status-badge is-pending">Pending</span>

              <dl className="profile-application-summary">
                <div>
                  <dt>License number</dt>
                  <dd>{applicationForm.licenseNumber}</dd>
                </div>
                <div>
                  <dt>Expiration date</dt>
                  <dd>{applicationForm.expirationDate}</dd>
                </div>
              </dl>
            </div>
          ) : (
            <form className="profile-driver-form" onSubmit={handleApplicationSubmit}>
              <div className="profile-driver-copy">
                <h2>Apply to drive</h2>
                <p>
                  Submit your license details for review. Once you are approved, the locked Post
                  Trip area above will open up for driver use.
                </p>
              </div>

              <div className="profile-form-grid">
                <label className="profile-field">
                  <span>License number</span>
                  <input
                    name="licenseNumber"
                    onChange={handleFieldChange}
                    placeholder="D1234567"
                    required
                    type="text"
                    value={applicationForm.licenseNumber}
                  />
                </label>

                <label className="profile-field">
                  <span>Expiration date</span>
                  <input
                    name="expirationDate"
                    onChange={handleFieldChange}
                    required
                    type="date"
                    value={applicationForm.expirationDate}
                  />
                </label>
              </div>

              <button className="profile-primary-action" type="submit">
                Submit driver application
              </button>
            </form>
          )}
        </article>
      </section>
    </main>
  );
}
