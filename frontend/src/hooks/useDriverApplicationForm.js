import { useState } from 'react';

function getInitialApplicationForm() {
  return {
    licenseNumber: '',
    expirationDate: '',
  };
}

export default function useDriverApplicationForm() {
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
    // The prototype flips straight into the pending-review state after submit.
    setApplicationSubmitted(true);
  }

  return {
    applicationForm,
    applicationSubmitted,
    handleFieldChange,
    handleApplicationSubmit,
  };
}
