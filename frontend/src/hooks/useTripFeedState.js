import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApi } from '../contexts/ApiProvider';
import { useSession } from '../contexts/SessionProvider';
import { shopperLocation } from '../data/tripFeedData';
import { buildAuthRedirectUrl } from './usePostAuthRedirect';
import { getShopperLocationFromUser, mapApiTripsToUi } from '../utils/tripApiAdapters';
import {
  buildChosenItems,
  enrichCartGroups,
  getCartLineCount,
  getCartSubtotal,
  getSelectedQuantityCount,
  mergeCartGroups,
  resetDraftQuantities,
} from '../utils/tripFeed';

export default function useTripFeedState() {
  const api = useApi();
  const { currentUser, isSessionLoading } = useSession();
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [draftQuantities, setDraftQuantities] = useState({});
  const [cartGroups, setCartGroups] = useState([]);
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

      const nextTrips = mapApiTripsToUi(response.body?.trips || [], shopperLocationForTrips);
      setTrips(nextTrips);
      setTripFeedError('');
      setIsTripsLoading(false);
    }

    fetchTrips();
  }, [api, currentUser, isSessionLoading, location.hash, location.pathname, location.search, navigate, shopperLocationForTrips]);

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
  const cart = useMemo(() => enrichCartGroups(cartGroups), [cartGroups]);
  const cartLineCount = useMemo(() => getCartLineCount(cart), [cart]);
  const cartSubtotal = useMemo(() => getCartSubtotal(cart), [cart]);

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
    setCartGroups((currentCart) => mergeCartGroups(currentCart, selectedTrip, chosenItems));
    setDraftQuantities((current) => resetDraftQuantities(current, chosenItems));
    setCheckoutMessage(`Items added under ${selectedTrip.driver.name}.`);
  }

  async function handleCheckout() {
    if (cart.length === 0) {
      setCheckoutMessage('Your cart is empty.');
      return;
    }

    const responses = await Promise.allSettled(
      cart.map((tripGroup) =>
        api.post('/me/orders', {
          trip_id: Number(tripGroup.tripId),
          items: tripGroup.items.map((item) => ({
            item_id: Number(item.id),
            quantity: item.quantity,
          })),
        }),
      ),
    );

    const successfulIndices = new Set();
    let errorMessage = '';
    let successCount = 0;
    let totalItemCount = 0;

    responses.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.ok) {
        successfulIndices.add(index);
        successCount += 1;
        totalItemCount += cart[index].items.reduce((sum, item) => sum + item.quantity, 0);
      } else {
        const failureMsg = result.status === 'rejected'
          ? 'Request failed'
          : result.value.body?.message || 'Checkout failed for one or more items.';
        if (!errorMessage) {
          errorMessage = failureMsg;
        }
      }
    });

    if (successfulIndices.size === 0) {
      setCheckoutMessage(errorMessage);
      return;
    }

    const remainingCart = cart.filter((_, index) => !successfulIndices.has(index));
    setCartGroups(remainingCart.map((group) => ({ tripId: group.tripId, items: group.items })));

    let message = `Checkout complete for ${totalItemCount} items across ${successCount} driver trip${successCount !== 1 ? 's' : ''}.`;
    if (remainingCart.length > 0) {
      message += ` ${errorMessage || 'Some items could not be checked out and remain in your cart.'}`;
    }
    setCheckoutMessage(message);
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
    handleCheckout,
  };
}
