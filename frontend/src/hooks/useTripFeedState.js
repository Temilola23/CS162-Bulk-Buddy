import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApi } from '../contexts/ApiProvider';
import { useCart } from '../contexts/CartProvider';
import { useSession } from '../contexts/SessionProvider';
import { shopperLocation } from '../data/tripFeedData';
import { buildAuthRedirectUrl } from './usePostAuthRedirect';
import { getShopperLocationFromUser, mapApiTripsToUi } from '../utils/tripApiAdapters';
import {
  buildChosenItems,
  getSelectedQuantityCount,
  resetDraftQuantities,
} from '../utils/tripFeed';

/**
 * Loads trips, tracks item quantities, and adds selected items to the cart.
 */
export default function useTripFeedState() {
  const api = useApi();
  const { currentUser, isSessionLoading } = useSession();
  const { addTripItems, cart, cartLineCount, cartSubtotal } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [draftQuantities, setDraftQuantities] = useState({});
  const [checkoutMessage, setCheckoutMessage] = useState('');
  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [isTripsLoading, setIsTripsLoading] = useState(true);
  const [tripFeedError, setTripFeedError] = useState('');

  const shopperLocationForTrips = useMemo(
    () => getShopperLocationFromUser(currentUser, shopperLocation),
    [currentUser],
  );

  useEffect(() => {
    async function fetchTrips() {
      if (isSessionLoading) {
        return;
      }

      if (!currentUser) {
        setTrips([]);
        setSelectedTrip(null);
        setIsTripsLoading(false);
        return;
      }

      setIsTripsLoading(true);
      const response = await api.get('/trips');

      if (!response.ok) {
        if (response.status === 401) {
          const requestedPath = `${location.pathname}${location.search}${location.hash}`;
          navigate(buildAuthRedirectUrl(requestedPath), { replace: true });
          return;
        }

        setTrips([]);
        setSelectedTrip(null);
        setTripFeedError(response.body?.message || 'Unable to load nearby trips.');
        setIsTripsLoading(false);
        return;
      }

      const nextTrips = mapApiTripsToUi(
        response.body?.trips || [],
        shopperLocationForTrips,
      );
      setTrips(nextTrips);
      setTripFeedError('');
      setIsTripsLoading(false);
    }

    fetchTrips();
  }, [
    api,
    currentUser,
    isSessionLoading,
    location.hash,
    location.pathname,
    location.search,
    navigate,
    shopperLocationForTrips,
  ]);

  useEffect(() => {
    // Initialize the page with the closest trip selected by default.
    if (!selectedTripId && trips[0]) {
      setSelectedTripId(trips[0].id);
    }
  }, [selectedTripId, trips]);

  useEffect(() => {
    async function fetchSelectedTrip() {
      if (!selectedTripId) {
        setSelectedTrip(null);
        return;
      }

      const response = await api.get(`/trips/${selectedTripId}`);

      if (!response.ok) {
        setSelectedTrip(null);
        setTripFeedError(response.body?.message || 'Unable to load trip details.');
        return;
      }

      setSelectedTrip(
        mapApiTripsToUi([response.body?.trip], shopperLocationForTrips)[0] || null,
      );
    }

    fetchSelectedTrip();
  }, [api, selectedTripId, shopperLocationForTrips]);

  useEffect(() => {
    if (!selectedTrip) {
      return;
    }

    setDraftQuantities((current) => {
      const nextDrafts = {};
      // Rebuild the draft map around the selected trip so the UI only tracks
      // quantities for items currently visible on screen.
      selectedTrip.items.forEach((item) => {
        nextDrafts[item.id] = current[item.id] ?? 0;
      });
      return nextDrafts;
    });
  }, [selectedTrip]);

  const selectedQuantityCount = useMemo(
    () => getSelectedQuantityCount(selectedTrip, draftQuantities),
    [selectedTrip, draftQuantities],
  );

  function setItemQuantity(itemId, nextValue, maxValue) {
    const clampedValue = Math.max(0, Math.min(maxValue, nextValue));
    setDraftQuantities((current) => ({ ...current, [itemId]: clampedValue }));
  }

  function handleAddToCart() {
    if (!selectedTrip) {
      return;
    }

    const chosenItems = buildChosenItems(selectedTrip, draftQuantities);

    if (chosenItems.length === 0) {
      setCheckoutMessage('Select at least one quantity before adding to cart.');
      return;
    }

    // Keep cart lines grouped under the driver trip they came from.
    addTripItems(selectedTrip, chosenItems);
    setDraftQuantities((current) => resetDraftQuantities(current, chosenItems));
    setCheckoutMessage(`Items added under ${selectedTrip.driver.name}.`);
  }

  return {
    trips,
    selectedTrip,
    selectedTripId,
    setSelectedTripId,
    draftQuantities,
    selectedQuantityCount,
    cart,
    cartLineCount,
    cartSubtotal,
    checkoutMessage,
    isTripsLoading,
    tripFeedError,
    setItemQuantity,
    handleAddToCart,
  };
}
