import { useState } from 'react';
import { shopperProfile } from '../data/shopperProfile';

function getInitialSettings() {
  return {
    displayName: shopperProfile.name,
    email: shopperProfile.email,
    nearbyRadius: shopperProfile.nearbyRadius,
    address: shopperProfile.address,
    orderUpdates: true,
    pickupReminders: true,
    driverMessages: true,
    newTripsNearby: false,
  };
}

export default function useSettingsForm() {
  const [settings, setSettings] = useState(getInitialSettings);
  const [saveMessage, setSaveMessage] = useState('');

  function handleInputChange(event) {
    const { name, value, type, checked } = event.target;

    // One handler covers both text/select fields and toggle-style checkboxes.
    setSettings((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setSaveMessage('');
  }

  function handleSave(event) {
    event.preventDefault();
    setSaveMessage('Changes saved locally.');
  }

  return {
    settings,
    saveMessage,
    handleInputChange,
    handleSave,
  };
}
