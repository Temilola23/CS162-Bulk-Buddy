import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApi } from '../contexts/ApiProvider';
import { useSession } from '../contexts/SessionProvider';
import { useCartCount } from '../contexts/CartProvider';
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
  const { setItemCount } = useCartCount();
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [draftQuantities, setDraftQuantities] = useState({});
  const [cartGroups, setCartGroups] = useState([]);
  const [checkoutMessage, setCheckoutMessage] = useState('');
  const [checkoutMessageType, setCheckoutMessageType] = useState('');
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

  useEffect(() => {
    const total = cartGroups.reduce((sum, group) =>
      sum + group.items.reduce((s, item) => s + item.quantity, 0), 0
    );
    setItemCount(total);
  }, [cartGroups, setItemCount]);

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

  const removeCartItem = useCallback((groupIndex, itemIndex) => {
    setCartGroups(prev => {
      const next = prev.map((group, gi) => {
        if (gi !== groupIndex) return group;
        const items = group.items.filter((_, ii) => ii !== itemIndex);
        return { ...group, items };
      }).filter(group => group.items.length > 0);
      return next;
    });
  }, []);

  const updateCartItemQty = useCallback((groupIndex, itemIndex, newQty) => {
    if (newQty < 1) return;
    setCartGroups(prev => {
      return prev.map((group, gi) => {
        if (gi !== groupIndex) return group;
        const items = group.items.map((item, ii) => {
          if (ii !== itemIndex) return item;
          return { ...item, quantity: newQty };
        });
        return { ...group, items };
      });
    });
  }, []);

  const clearCart = useCallback(() => {
    setCartGroups([]);
  }, []);

  function handleAddToCart() {
    if (!selectedTrip) {
      return;
    }

    const chosenItems = buildChosenItems(selectedTrip, draftQuantities);

    if (chosenItems.length === 0) {
      setCheckoutMessage('Select at least one quantity before adding to cart.');
      setCheckoutMessageType('error');
      return;
    }

    // Keep cart lines grouped under the driver trip they came from.
    setCartGroups((currentCart) => mergeCartGroups(currentCart, selectedTrip, chosenItems));
    setDraftQuantities((current) => resetDraftQuantities(current, chosenItems));
    setCheckoutMessage(`Items added under ${selectedTrip.driver.name}.`);
    setCheckoutMessageType('success');
  }

  async function handleCheckout() {
    if (cart.length === 0) {
      setCheckoutMessage('Your cart is empty.');
      setCheckoutMessageType('error');
      return;
    }

    const results = await Promise.allSettled(
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
    let firstError = null;

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.ok) {
        successfulIndices.add(index);
      } else if (!firstError) {
        const response = result.status === 'fulfilled' ? result.value : null;
        firstError = response?.body?.message || 'Checkout failed.';
      }
    });

    if (firstError && successfulIndices.size === 0) {
      setCheckoutMessage(firstError);
      setCheckoutMessageType('error');
      return;
    }

    const remainingCart = cart.filter((_, index) => !successfulIndices.has(index));
    const totalItems = results.reduce((sum, result, index) => {
      if (successfulIndices.has(index)) {
        return sum + cart[index].items.reduce((s, item) => s + item.quantity, 0);
      }
      return sum;
    }, 0);
    const successfulGroups = cart.length - remainingCart.length;

    let message = `Checkout complete for ${totalItems} items across ${successfulGroups} driver trips.`;
    if (remainingCart.length > 0) {
      message += ` ${firstError} Please retry for the remaining ${remainingCart.length} driver trips.`;
    }

    setCheckoutMessage(message);
    setCheckoutMessageType(remainingCart.length > 0 ? 'error' : 'success');
    setCartGroups(remainingCart);
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
    checkoutMessageType,
    isTripsLoading,
    tripFeedError,
    setItemQuantity,
    handleAddToCart,
    handleCheckout,
    removeCartItem,
    updateCartItemQty,
    clearCart,
  };
}
