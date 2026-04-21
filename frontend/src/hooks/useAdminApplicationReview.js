import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../contexts/ApiProvider';
import { fetchAdminApplications } from '../utils/adminApplicationAdapters';
import { buildAdminAuthRedirectUrl } from './useAdminPostAuthRedirect';

/**
 * Loads one driver application and exposes approve/decline actions.
 */
export default function useAdminApplicationReview() {
  const api = useApi();
  const location = useLocation();
  const navigate = useNavigate();
  const { applicationId } = useParams();
  const [application, setApplication] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function loadApplication() {
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

        setErrorMessage(result.error);
        setIsLoading(false);
        return;
      }

      const matchedApplication = result.applications.find(
        (candidate) => String(candidate.id) === String(applicationId),
      );

      if (!matchedApplication) {
        setErrorMessage('Driver application not found.');
        setIsLoading(false);
        return;
      }

      setApplication(matchedApplication);
      setIsLoading(false);
    }

    loadApplication();
    return () => {
      isActive = false;
    };
  }, [api, applicationId, location.hash, location.pathname, location.search, navigate]);

  async function handleDecision(nextStatus) {
    if (!application) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setActionMessage('');

    const response = await api.put(`/admin/decision/${application.id}`, {
      new_status: nextStatus,
    });

    if (!response.ok) {
      if (response.status === 401) {
        const requestedPath = `${location.pathname}${location.search}${location.hash}`;
        navigate(buildAdminAuthRedirectUrl(requestedPath), { replace: true });
        return;
      }

      if (response.status === 403) {
        navigate('/', { replace: true });
        return;
      }

      setErrorMessage(response.body?.message || 'Unable to update application status.');
      setIsSubmitting(false);
      return;
    }

    setApplication((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        status: nextStatus,
        statusLabel: nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1),
        updatedAtLabel: 'Just now',
      };
    });
    setActionMessage(
      nextStatus === 'approved' ? 'Application approved.' : 'Application declined.',
    );
    setIsSubmitting(false);
  }

  function goBackToQueue() {
    navigate('/admin-console/driver-applications');
  }

  return {
    application,
    isLoading,
    errorMessage,
    actionMessage,
    isSubmitting,
    handleDecision,
    goBackToQueue,
  };
}
