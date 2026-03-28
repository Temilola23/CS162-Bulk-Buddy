import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApi } from '../contexts/ApiProvider';
import { buildAuthRedirectUrl } from './usePostAuthRedirect';

function getInitialItem() {
  return {
    name: '',
    unit: '',
    totalQuantity: '',
    pricePerUnit: '',
  };
}

function getInitialForm() {
  return {
    storeName: '',
    pickupLocationText: '',
    pickupTime: '',
    items: [getInitialItem()],
  };
}

function formatTripStatus(status) {
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

function mapDriverTrip(apiTrip) {
  return {
    id: apiTrip.trip_id,
    storeName: apiTrip.store_name,
    pickupLocationText: apiTrip.pickup_location_text,
    pickupTimeLabel: new Date(apiTrip.pickup_time).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }),
    status: apiTrip.status,
    statusLabel: formatTripStatus(apiTrip.status),
    // The current /api/me/trips list endpoint returns scalar trip fields only,
    // so item counts are only available immediately after a create response.
    itemCount: apiTrip.items?.length || null,
  };
}

export default function useDriverTripsState() {
  const api = useApi();
  const location = useLocation();
  const navigate = useNavigate();
  const [tripForm, setTripForm] = useState(getInitialForm);
  const [driverTrips, setDriverTrips] = useState([]);
  const [isTripsLoading, setIsTripsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [submitMessage, setSubmitMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function loadDriverTrips() {
      setIsTripsLoading(true);

      const response = await api.get('/me/trips');
      if (!isActive) {
        return;
      }

      if (!response.ok) {
        if (response.status === 401) {
          const requestedPath = `${location.pathname}${location.search}${location.hash}`;
          navigate(buildAuthRedirectUrl(requestedPath), { replace: true });
          return;
        }

        if (response.status === 403) {
          navigate('/profile', { replace: true });
          return;
        }

        setDriverTrips([]);
        setErrorMessage(response.body?.message || 'Unable to load your driver trips.');
        setIsTripsLoading(false);
        return;
      }

      setDriverTrips((response.body?.trips || []).map(mapDriverTrip));
      setIsTripsLoading(false);
    }

    loadDriverTrips();

    return () => {
      isActive = false;
    };
  }, [api, location.hash, location.pathname, location.search, navigate]);

  function handleTripFieldChange(event) {
    const { name, value } = event.target;
    setTripForm((current) => ({ ...current, [name]: value }));
    setErrorMessage('');
    setSubmitMessage('');
  }

  function handleItemFieldChange(index, fieldName, value) {
    setTripForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [fieldName]: value } : item,
      ),
    }));
    setErrorMessage('');
    setSubmitMessage('');
  }

  function addItemRow() {
    setTripForm((current) => ({
      ...current,
      items: [...current.items, getInitialItem()],
    }));
  }

  function removeItemRow(index) {
    setTripForm((current) => ({
      ...current,
      items:
        current.items.length === 1
          ? current.items
          : current.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  const sanitizedItems = useMemo(
    () =>
      tripForm.items.filter(
        (item) => item.name || item.unit || item.totalQuantity || item.pricePerUnit,
      ),
    [tripForm.items],
  );

  async function handleCreateTrip(event) {
    event.preventDefault();
    setErrorMessage('');
    setSubmitMessage('');

    if (!tripForm.storeName || !tripForm.pickupLocationText || !tripForm.pickupTime) {
      setErrorMessage('Store name, pickup location, and pickup time are required.');
      return;
    }

    if (!sanitizedItems.length) {
      setErrorMessage('Add at least one item to the trip.');
      return;
    }

    const invalidItem = sanitizedItems.find(
      (item) => !item.name || !item.unit || !item.totalQuantity,
    );
    if (invalidItem) {
      setErrorMessage('Each trip item needs a name, unit, and total quantity.');
      return;
    }

    setIsSubmitting(true);

    const response = await api.post('/me/trips', {
      store_name: tripForm.storeName,
      pickup_location_text: tripForm.pickupLocationText,
      pickup_time: tripForm.pickupTime,
      items: sanitizedItems.map((item) => ({
        name: item.name,
        unit: item.unit,
        total_quantity: Number(item.totalQuantity),
        ...(item.pricePerUnit ? { price_per_unit: Number(item.pricePerUnit) } : {}),
      })),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      if (response.status === 401) {
        const requestedPath = `${location.pathname}${location.search}${location.hash}`;
        navigate(buildAuthRedirectUrl(requestedPath), { replace: true });
        return;
      }

      if (response.status === 403) {
        navigate('/profile', { replace: true });
        return;
      }

      setErrorMessage(response.body?.message || 'Unable to create trip.');
      return;
    }

    const createdTrip = response.body?.trip ? mapDriverTrip(response.body.trip) : null;
    if (createdTrip) {
      setDriverTrips((current) => [createdTrip, ...current]);
    }

    setTripForm(getInitialForm());
    setSubmitMessage(response.body?.message || 'Trip created successfully.');
  }

  return {
    tripForm,
    driverTrips,
    isTripsLoading,
    errorMessage,
    submitMessage,
    isSubmitting,
    handleTripFieldChange,
    handleItemFieldChange,
    addItemRow,
    removeItemRow,
    handleCreateTrip,
  };
}
