import { Link } from 'react-router-dom';
import AdminShell from '../../components/AdminShell';
import useAdminApplications from '../../hooks/useAdminApplications';
import './AdminApplications.css';

/**
 * Renders the admin driver application queue with status tabs.
 */
export default function AdminApplications() {
  const {
    tabs,
    statusFilter,
    setStatusFilter,
    applications,
    counts,
    isLoading,
    errorMessage,
  } = useAdminApplications();

  return (
    <AdminShell
      subtitle="Monitor driver verification requests and open individual submissions for a decision."
      title="Driver application queue"
    >
      <section className="admin-applications-panel">
        <div className="admin-applications-toolbar">
          <div className="admin-applications-tabs" role="tablist" aria-label="Application statuses">
            {tabs.map((tab) => (
              <button
                aria-selected={statusFilter === tab.id}
                className={`admin-applications-tab ${statusFilter === tab.id ? 'is-active' : ''}`.trim()}
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                role="tab"
                type="button"
              >
                {tab.label}
                <span>{counts[tab.id] || 0}</span>
              </button>
            ))}
          </div>
        </div>

        {isLoading ? <p className="admin-applications-feedback">Loading applications...</p> : null}
        {errorMessage ? <p className="admin-applications-feedback is-error">{errorMessage}</p> : null}

        {!isLoading && !errorMessage ? (
          applications.length ? (
            <div className="admin-applications-table-wrap">
              <table className="admin-applications-table">
                <thead>
                  <tr>
                    <th>Application</th>
                    <th>Applicant</th>
                    <th>Submitted</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {applications.map((application) => (
                    <tr key={application.id}>
                      <td>#{application.id}</td>
                      <td>User #{application.userId}</td>
                      <td>{application.createdAtLabel}</td>
                      <td>
                        <span className={`admin-status-badge is-${application.status}`.trim()}>
                          {application.statusLabel}
                        </span>
                      </td>
                      <td>
                        <Link
                          className="admin-applications-link"
                          to={`/admin-console/driver-applications/${application.id}`}
                        >
                          View application
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="admin-applications-feedback">No {statusFilter} applications right now.</p>
          )
        ) : null}
      </section>
    </AdminShell>
  );
}
