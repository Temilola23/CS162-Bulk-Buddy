import { useEffect, useState } from 'react';
import { useApi } from '../contexts/ApiProvider';
import { useSession } from '../contexts/SessionProvider';
import { getProfileFromUser } from '../utils/profileAdapters';

/**
 * Returns the default settings form shape.
 */
function getInitialSettings() {
  return {
    displayName: '',
    email: '',
    nearbyRadius: '5 miles',
    address: '',
    orderUpdates: true,
    pickupReminders: true,
    driverMessages: true,
    newTripsNearby: false,
  };
}

/**
 * Manages profile/settings form state and saves editable user fields.
 */
export default function useSettingsForm() {
  const api = useApi();
  const { currentUser, refreshSession } = useSession();
  const [settings, setSettings] = useState(getInitialSettings);
  const [saveMessage, setSaveMessage] = useState('');
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const profile = getProfileFromUser(currentUser);
    if (!profile) {
      setSettings((current) => ({
        ...current,
        displayName: '',
        email: '',
        nearbyRadius: '5 miles',
        address: '',
      }));
      return;
    }

    setSettings((current) => ({
      ...current,
      displayName: profile.name,
      email: profile.email,
      nearbyRadius: current.nearbyRadius || profile.nearbyRadius || '5 miles',
      address: profile.address,
    }));
  }, [currentUser]);

  function handleInputChange(event) {
    const { name, value, type, checked } = event.target;

    // One handler covers both text/select fields and toggle-style checkboxes.
    setSettings((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setSaveMessage('');
    setSaveError('');
  }

  async function handleSave(event) {
    event.preventDefault();
    setIsSaving(true);
    setSaveMessage('');
    setSaveError('');

    const [addressStreet = '', addressCity = '', addressState = '', addressZip = ''] =
      settings.address.split(',').map((segment) => segment.trim());

    const response = await api.put('/me', {
      display_name: settings.displayName,
      email: settings.email,
      address_street: addressStreet,
      address_city: addressCity,
      address_state: addressState,
      address_zip: addressZip,
    });

    setIsSaving(false);

    if (!response.ok) {
      setSaveError(response.body?.message || 'Unable to save settings.');
      return;
    }

    await refreshSession();
    setSaveMessage('Changes saved.');
  }

  return {
    settings,
    saveMessage,
    saveError,
    isSaving,
    handleInputChange,
    handleSave,
  };
}
