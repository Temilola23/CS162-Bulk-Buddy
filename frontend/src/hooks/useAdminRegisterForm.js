import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../contexts/ApiProvider';
import { useSession } from '../contexts/SessionProvider';
import { markAuthLoaderRequested } from './useAppLoader';
import useAdminPostAuthRedirect from './useAdminPostAuthRedirect';

/**
 * Returns the empty admin registration form shape.
 *
 * @returns {Object} Default admin registration form values.
 */
function getInitialForm() {
  return {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    addressStreet: '',
    addressCity: '',
    addressState: '',
    addressZip: '',
    adminToken: '',
  };
}

/**
 * Manages admin registration, token submission, auto-login, and redirect.
 *
 * @returns {Object} Admin registration form values, status flags, and handlers.
 */
export default function useAdminRegisterForm() {
  const api = useApi();
  const navigate = useNavigate();
  const { currentUser, isSessionLoading, refreshSession } = useSession();
  const { redirectPath, authQueryString } = useAdminPostAuthRedirect();
  const [form, setForm] = useState(getInitialForm);
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

  function handleFieldChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrorMessage('');
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (form.password !== form.confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    const registerResponse = await api.post('/admin/register', {
      first_name: form.firstName,
      last_name: form.lastName,
      email: form.email,
      password: form.password,
      address_street: form.addressStreet,
      address_city: form.addressCity,
      address_state: form.addressState,
      address_zip: form.addressZip,
      admin_token: form.adminToken,
    });

    if (!registerResponse.ok) {
      setIsSubmitting(false);
      setErrorMessage(registerResponse.body?.message || 'Unable to create admin account.');
      return;
    }

    const loginResponse = await api.post('/admin/login', {
      email: form.email,
      password: form.password,
    });

    if (!loginResponse.ok) {
      setIsSubmitting(false);
      setErrorMessage(loginResponse.body?.message || 'Admin account created, but sign-in failed.');
      return;
    }

    const refreshedUser = await refreshSession();
    setIsSubmitting(false);

    if (refreshedUser?.role !== 'admin') {
      setErrorMessage('Admin account created, but the session is not authorized as admin.');
      return;
    }

    markAuthLoaderRequested();
    window.location.assign(redirectPath);
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
