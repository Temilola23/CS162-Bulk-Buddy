import { useMemo, useState } from 'react';
import { useApi } from '../contexts/ApiProvider';
import { useSession } from '../contexts/SessionProvider';

function getInitialApplicationForm() {
  return {
    licenseNumber: '',
    expirationDate: '',
  };
}

function parseLicenseInfo(licenseInfo) {
  const normalizedLicenseInfo = (licenseInfo || '').trim();
  if (!normalizedLicenseInfo) {
    return getInitialApplicationForm();
  }

  // The backend currently stores both form fields in one string, so the
  // frontend reconstructs the separate review values from that persisted data.
  const parsedMatch = normalizedLicenseInfo.match(/^(.*?)\s*\|\s*exp\s+(.+)$/i);
  if (!parsedMatch) {
    return {
      licenseNumber: normalizedLicenseInfo,
      expirationDate: '',
    };
  }

  return {
    licenseNumber: parsedMatch[1].trim(),
    expirationDate: parsedMatch[2].trim(),
  };
}

export default function useDriverApplicationForm() {
  const api = useApi();
  const { driverApplication, refreshSession } = useSession();
  const [applicationForm, setApplicationForm] = useState(getInitialApplicationForm);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const applicationSubmitted = driverApplication?.status === 'pending';
  const submittedApplicationDetails = useMemo(
    () => parseLicenseInfo(driverApplication?.license_info),
    [driverApplication],
  );

  function handleFieldChange(event) {
    const { name, value } = event.target;

    setApplicationForm((current) => ({
      ...current,
      [name]: value,
    }));
    setErrorMessage('');
  }

  async function handleApplicationSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    const response = await api.post('/driver/apply', {
      license_info: `${applicationForm.licenseNumber} | exp ${applicationForm.expirationDate}`,
    });

    setIsSubmitting(false);

    if (!response.ok) {
      setErrorMessage(response.body?.message || 'Unable to submit driver application.');
      return;
    }

    await refreshSession();
  }

  return {
    applicationForm,
    applicationSubmitted,
    submittedApplicationDetails,
    errorMessage,
    isSubmitting,
    handleFieldChange,
    handleApplicationSubmit,
  };
}
