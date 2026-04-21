import AdminShell from '../../components/AdminShell';
import useAdminApplicationReview from '../../hooks/useAdminApplicationReview';
import './AdminApplicationReview.css';

/**
 * Renders the admin screen for reviewing one driver application.
 */
export default function AdminApplicationReview() {
  const {
    application,
    isLoading,
    errorMessage,
    actionMessage,
    isSubmitting,
    handleDecision,
    goBackToQueue,
  } = useAdminApplicationReview();

  return (
    <AdminShell
      subtitle="Review the submitted license details and update the application status when you are ready."
      title="Driver application review"
    >
      <section className="admin-review-layout">
        <div className="admin-review-toolbar">
          <button className="admin-review-back" onClick={goBackToQueue} type="button">
            Back to queue
          </button>
        </div>

        {isLoading ? <p className="admin-review-feedback">Loading application...</p> : null}
        {errorMessage ? <p className="admin-review-feedback is-error">{errorMessage}</p> : null}

        {application ? (
          <div className="admin-review-grid">
            <article className="admin-review-card">
              <p className="admin-review-card-kicker">Application</p>
              <h2>#{application.id}</h2>

              <dl className="admin-review-list">
                <div>
                  <dt>Applicant</dt>
                  <dd>User #{application.userId}</dd>
                </div>
                <div>
                  <dt>Submitted</dt>
                  <dd>{application.createdAtLabel}</dd>
                </div>
                <div>
                  <dt>Last updated</dt>
                  <dd>{application.updatedAtLabel}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>
                    <span className={`admin-status-badge is-${application.status}`.trim()}>
                      {application.statusLabel}
                    </span>
                  </dd>
                </div>
              </dl>
            </article>

            <article className="admin-review-card">
              <p className="admin-review-card-kicker">Submitted form</p>
              <h2>License details</h2>

              <dl className="admin-review-list">
                <div>
                  <dt>License number</dt>
                  <dd>{application.licenseNumber}</dd>
                </div>
                <div>
                  <dt>Expiration date</dt>
                  <dd>{application.expirationDate}</dd>
                </div>
              </dl>

              {actionMessage ? <p className="admin-review-feedback is-success">{actionMessage}</p> : null}

              {application.status === 'pending' ? (
                <div className="admin-review-actions">
                  <button
                    className="admin-review-action is-approve"
                    disabled={isSubmitting}
                    onClick={() => handleDecision('approved')}
                    type="button"
                  >
                    {isSubmitting ? 'Saving...' : 'Approve'}
                  </button>
                  <button
                    className="admin-review-action is-reject"
                    disabled={isSubmitting}
                    onClick={() => handleDecision('rejected')}
                    type="button"
                  >
                    {isSubmitting ? 'Saving...' : 'Decline'}
                  </button>
                </div>
              ) : (
                <p className="admin-review-note">
                  This application has already been reviewed. No further action is available here.
                </p>
              )}
            </article>
          </div>
        ) : null}
      </section>
    </AdminShell>
  );
}
