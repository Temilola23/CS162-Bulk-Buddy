import { useEffect, useMemo, useState } from 'react';
import { shopperLocation, tripSeed } from '../data/tripFeedData';
import {
  buildChosenItems,
  buildSortedTrips,
  enrichCartGroups,
  getCartLineCount,
  getCartSubtotal,
  getSelectedQuantityCount,
  mergeCartGroups,
  resetDraftQuantities,
} from '../utils/tripFeed';

export default function useTripFeedState() {
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [draftQuantities, setDraftQuantities] = useState({});
  const [cartGroups, setCartGroups] = useState([]);
  const [checkoutMessage, setCheckoutMessage] = useState('');

  // Sort once from the mock seed so the nearest trips stay stable during the session.
  const trips = useMemo(() => buildSortedTrips(tripSeed, shopperLocation), []);
  const selectedTrip = trips.find((trip) => trip.id === selectedTripId) || trips[0] || null;

  useEffect(() => {
    // Initialize the page with the closest trip selected by default.
    if (!selectedTripId && trips[0]) {
      setSelectedTripId(trips[0].id);
    }
  }, [selectedTripId, trips]);

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

  function handleCheckout() {
    if (cart.length === 0) {
      setCheckoutMessage('Your cart is empty.');
      return;
    }

    setCheckoutMessage(
      `Checkout complete for ${cartLineCount} items across ${cart.length} driver trips. Pickup details saved.`,
    );
    setCartGroups([]);
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
    setItemQuantity,
    handleAddToCart,
    handleCheckout,
  };
}
