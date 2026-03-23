import { useState } from 'react';
import { useApi } from '../contexts/ApiProvider';
import { markAuthLoaderRequested } from './useAppLoader';

export default function useLoginForm(redirectPath = '/trip-feed') {
  const api = useApi();
  const [form, setForm] = useState({
    email: '',
    password: '',
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleFieldChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrorMessage('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    const response = await api.post('/login', {
      email: form.email,
      password: form.password,
    });

    setIsSubmitting(false);

    if (!response.ok) {
      setErrorMessage(response.body?.message || 'Unable to log in right now.');
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
