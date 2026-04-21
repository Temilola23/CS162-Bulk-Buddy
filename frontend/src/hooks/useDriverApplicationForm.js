import { useMemo, useState } from 'react';
import { useApi } from '../contexts/ApiProvider';
import { useSession } from '../contexts/SessionProvider';

/**
 * Returns the empty driver application form shape.
 */
function getInitialApplicationForm() {
  return {
    licenseNumber: '',
    expirationDate: '',
  };
}

/**
 * Splits persisted license metadata back into separate display fields.
 */
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

/**
 * Manages driver application form state, submission, and approval status.
 */
export default function useDriverApplicationForm() {
  const api = useApi();
  const { currentUser, driverApplication, refreshSession } = useSession();
  const [applicationForm, setApplicationForm] = useState(getInitialApplicationForm);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const applicationStatus = driverApplication?.status || null;
  const applicationSubmitted = applicationStatus === 'pending';
  const applicationApproved =
    currentUser?.role === 'driver' || applicationStatus === 'approved';
  const applicationRejected = applicationStatus === 'rejected';
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
    applicationStatus,
    applicationSubmitted,
    applicationApproved,
    applicationRejected,
    submittedApplicationDetails,
    errorMessage,
    isSubmitting,
    handleFieldChange,
    handleApplicationSubmit,
  };
}
