import { Link } from 'react-router-dom';
import ShopperHeader from './ShopperHeader';
import { useSession } from '../contexts/SessionProvider';
import useProfilePageState from '../hooks/useProfilePageState';
import { getProfileFromUser } from '../utils/profileAdapters';
import './Profile.css';

export default function Profile() {
  const { currentUser } = useSession();
  const {
    isScrolled,
    scrollProgress,
    applicationForm,
    applicationApproved,
    applicationRejected,
    applicationSubmitted,
    submittedApplicationDetails,
    errorMessage,
    isSubmitting,
    handleFieldChange,
    handleApplicationSubmit,
  } = useProfilePageState();
  const profile = getProfileFromUser(currentUser);

  if (!profile) {
    // App-level auth gating should stop this path before render, but returning
    // nothing here prevents any fallback identity from appearing if session
    // state drops out during logout or refresh.
    return null;
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
          <h2>
            {applicationApproved
              ? 'Driver access is active. You can post trips now.'
              : 'Posting stays locked until driver access is approved.'}
          </h2>
          <p>
            {applicationApproved
              ? 'Your driver verification has been approved. Open the trip posting page to publish your next warehouse run.'
              : applicationSubmitted
              ? 'Your application is pending review, so trip posting is still unavailable right now.'
              : applicationRejected
              ? 'Your last application was rejected. Review the details below and submit a new application when you are ready.'
              : 'Complete the driver application first. An admin review will unlock trip posting once you are approved.'}
          </p>
        </div>
        {applicationApproved ? (
          <Link className="profile-primary-link" to="/post-trip">
            Open Post Trip
          </Link>
        ) : (
          <span
            className={`profile-status-badge ${applicationSubmitted ? 'is-pending' : 'is-locked'}`.trim()}
          >
            {applicationSubmitted ? 'Pending' : 'Locked'}
          </span>
        )}
      </section>

      <section className="profile-card-grid">
        <article className="profile-card profile-details-card">
          <div className="profile-identity">
            <span aria-hidden="true" className="profile-avatar">
              {profile.initials}
            </span>

            <div className="profile-identity-copy">
              <h2>{profile.name}</h2>
              <p>
                Role: <span className="profile-role-value">{profile.role}</span>
              </p>
            </div>
          </div>

          <dl className="profile-details-list">
            <div>
              <dt>Email</dt>
              <dd>{profile.email}</dd>
            </div>
            <div>
              <dt>Address</dt>
              <dd>{profile.address}</dd>
            </div>
            <div>
              <dt>Nearby radius</dt>
              <dd>{profile.nearbyRadius}</dd>
            </div>
          </dl>

          <div className="profile-details-actions">
            <button className="profile-secondary-action" type="button">
              Update address
            </button>
            <Link className="profile-secondary-action is-outline profile-secondary-link" to="/settings">
              Settings
            </Link>
          </div>
        </article>

        <article className="profile-card profile-application-card">
          <p className="profile-card-kicker">Driver application</p>

          {applicationApproved ? (
            <div className="profile-application-review">
              <h2>Driver access approved</h2>
              <p>
                Your license details were approved and your account now has driver permissions.
              </p>

              <span className="profile-status-badge is-approved">Approved</span>

              <dl className="profile-application-summary">
                <div>
                  <dt>License number</dt>
                  <dd>{submittedApplicationDetails.licenseNumber || 'Not available'}</dd>
                </div>
                <div>
                  <dt>Expiration date</dt>
                  <dd>{submittedApplicationDetails.expirationDate || 'Not available'}</dd>
                </div>
              </dl>

              <Link className="profile-primary-link" to="/post-trip">
                Go to Post Trip
              </Link>
            </div>
          ) : applicationSubmitted ? (
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
                  <dd>{submittedApplicationDetails.licenseNumber || 'Not available'}</dd>
                </div>
                <div>
                  <dt>Expiration date</dt>
                  <dd>{submittedApplicationDetails.expirationDate || 'Not available'}</dd>
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

              {errorMessage ? <p className="register-error-message">{errorMessage}</p> : null}

              <button className="profile-primary-action" disabled={isSubmitting} type="submit">
                {isSubmitting ? 'Submitting...' : 'Submit driver application'}
              </button>
            </form>
          )}
        </article>
      </section>
    </main>
  );
}
