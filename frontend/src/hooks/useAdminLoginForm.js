import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../contexts/ApiProvider';
import { useSession } from '../contexts/SessionProvider';
import useAdminPostAuthRedirect from './useAdminPostAuthRedirect';

const INITIAL_FORM = {
  email: '',
  password: '',
};

/**
 * Manages admin login form state and redirects admins after authentication.
 */
export default function useAdminLoginForm() {
  const api = useApi();
  const navigate = useNavigate();
  const { currentUser, isSessionLoading, refreshSession, clearSession } = useSession();
  const { redirectPath, authQueryString } = useAdminPostAuthRedirect();
  const [form, setForm] = useState(INITIAL_FORM);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isSessionLoading) {
      return;
    }

    if (currentUser?.role === 'admin') {
      navigate(redirectPath, { replace: true });
    }
  }, [currentUser, isSessionLoading, navigate, redirectPath]);

  const handleFieldChange = useMemo(
    () => (event) => {
      const { name, value } = event.target;
      setForm((current) => ({ ...current, [name]: value }));
      setErrorMessage('');
    },
    [],
  );

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    const response = await api.post('/admin/login', form);
    if (!response.ok) {
      setErrorMessage(response.body?.message || 'Unable to sign in as admin.');
      setIsSubmitting(false);
      return;
    }

    // Admin login uses its own backend route, but /api/me remains the shared
    // source of truth for the authenticated browser session afterward.
    const refreshedUser = await refreshSession();
    if (refreshedUser?.role !== 'admin') {
      clearSession();
      setErrorMessage('Admin access required.');
      setIsSubmitting(false);
      return;
    }

    navigate(redirectPath, { replace: true });
  }

  return {
    form,
    errorMessage,
    isSubmitting,
    authQueryString,
    handleFieldChange,
    handleSubmit,
  };
}
