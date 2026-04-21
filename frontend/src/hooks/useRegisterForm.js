import { useState } from 'react';
import { useApi } from '../contexts/ApiProvider';
import { markAuthLoaderRequested } from './useAppLoader';

/**
 * Returns the empty shopper registration form shape.
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
  };
}

/**
 * Manages shopper registration, auto-login, and redirect behavior.
 */
export default function useRegisterForm(redirectPath = '/trip-feed') {
  const api = useApi();
  const [form, setForm] = useState(getInitialForm);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    const signupResponse = await api.post('/signup', {
      first_name: form.firstName,
      last_name: form.lastName,
      email: form.email,
      password: form.password,
      address_street: form.addressStreet,
      address_city: form.addressCity,
      address_state: form.addressState,
      address_zip: form.addressZip,
    });

    if (!signupResponse.ok) {
      setIsSubmitting(false);
      setErrorMessage(signupResponse.body?.message || 'Unable to create account right now.');
      return;
    }

    const loginResponse = await api.post('/login', {
      email: form.email,
      password: form.password,
    });

    setIsSubmitting(false);

    if (!loginResponse.ok) {
      setErrorMessage(loginResponse.body?.message || 'Account created, but auto-login failed.');
      return;
    }

    markAuthLoaderRequested();
    window.location.assign(redirectPath);
  }

  return {
    form,
    errorMessage,
    isSubmitting,
    handleFieldChange,
    handleSubmit,
  };
}
