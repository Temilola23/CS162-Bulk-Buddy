import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApi } from '../contexts/ApiProvider';
import { buildAdminAuthRedirectUrl } from './useAdminPostAuthRedirect';
import { ADMIN_STATUS_TABS, fetchAdminApplications } from '../utils/adminApplicationAdapters';

export default function useAdminApplications() {
  const api = useApi();
  const location = useLocation();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('pending');
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isActive = true;

    async function loadApplications() {
      setIsLoading(true);
      setErrorMessage('');

      const result = await fetchAdminApplications(api);
      if (!isActive) {
        return;
      }

      if (result.error) {
        if (result.status === 401) {
          const requestedPath = `${location.pathname}${location.search}${location.hash}`;
          navigate(buildAdminAuthRedirectUrl(requestedPath), { replace: true });
          return;
        }

        if (result.status === 403) {
          navigate('/', { replace: true });
          return;
        }

        setApplications([]);
        setErrorMessage(result.error);
        setIsLoading(false);
        return;
      }

      setApplications(result.applications);
      setIsLoading(false);
    }

    loadApplications();
    return () => {
      isActive = false;
    };
  }, [api, location.hash, location.pathname, location.search, navigate]);

  const filteredApplications = useMemo(
    () => applications.filter((application) => application.status === statusFilter),
    [applications, statusFilter],
  );

  const counts = useMemo(
    // The backend exposes one endpoint per status bucket, so the frontend
    // recombines those collections and derives tab counts locally.
    () =>
      ADMIN_STATUS_TABS.reduce((accumulator, tab) => {
        accumulator[tab.id] = applications.filter((application) => application.status === tab.id).length;
        return accumulator;
      }, {}),
    [applications],
  );

  return {
    tabs: ADMIN_STATUS_TABS,
    statusFilter,
    setStatusFilter,
    applications: filteredApplications,
    counts,
    isLoading,
    errorMessage,
  };
}
