/**
 * Converts degrees into radians for distance math.
 *
 * @param {number} value - Angle in degrees.
 * @returns {number} Angle in radians.
 */
function toRadians(value) {
  return (value * Math.PI) / 180;
}

/**
 * Calculates miles between two latitude/longitude points.
 *
 * @param {{lat: number, lng: number}} start - Starting coordinate.
 * @param {{lat: number, lng: number}} end - Ending coordinate.
 * @returns {number} Distance in miles.
 */
export function getDistanceMiles(start, end) {
  // Use the haversine formula so trip sorting is based on actual map distance,
  // not a naive straight subtraction of latitude/longitude degrees.
  const earthRadiusMiles = 3958.8;
  const latDelta = toRadians(end.lat - start.lat);
  const lngDelta = toRadians(end.lng - start.lng);
  const startLat = toRadians(start.lat);
  const endLat = toRadians(end.lat);

  const a =
    Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
    Math.cos(startLat) * Math.cos(endLat) * Math.sin(lngDelta / 2) * Math.sin(lngDelta / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusMiles * c;
}

/**
 * Resolves the pickup location used for distance and display.
 *
 * @param {Object} trip - UI trip object with pickup or driver location data.
 * @returns {{lat: number, lng: number, label: string}} Pickup location details.
 */
export function getPickupLocation(trip) {
  if (trip.pickupLocation) {
    return trip.pickupLocation;
  }

  // Trips without an explicit pickup point fall back to the driver's location.
  return {
    lat: trip.driverLocation.lat,
    lng: trip.driverLocation.lng,
    label: trip.driver.locationLabel,
  };
}

/**
 * Formats a distance value for shopper-facing copy.
 *
 * @param {number} distanceMiles - Distance in miles.
 * @returns {string} Human-readable distance label.
 */
export function formatDistance(distanceMiles) {
  return `${distanceMiles.toFixed(1)} miles away`;
}

/**
 * Adds distance metadata and sorts trips from nearest to farthest.
 *
 * @param {Object[]} trips - Trip UI objects to sort.
 * @param {{lat: number, lng: number}} shopperLocation - Shopper coordinate.
 * @returns {Object[]} Trips with distance fields sorted by proximity.
 */
export function buildSortedTrips(trips, shopperLocation) {
  return trips
    .map((trip) => {
      const resolvedPickupLocation = getPickupLocation(trip);
      const distanceMiles = getDistanceMiles(shopperLocation, resolvedPickupLocation);

      return {
        ...trip,
        resolvedPickupLocation,
        distanceMiles,
        distanceLabel: formatDistance(distanceMiles),
      };
    })
    // Shoppers should see the closest handoff options first.
    .sort((left, right) => left.distanceMiles - right.distanceMiles);
}

/**
 * Converts selected item quantities into cart-ready line items.
 *
 * @param {Object|null} selectedTrip - Currently selected trip.
 * @param {Object} draftQuantities - Quantity selections keyed by item ID.
 * @returns {Object[]} Items with positive selected quantities.
 */
export function buildChosenItems(selectedTrip, draftQuantities) {
  if (!selectedTrip) {
    return [];
  }

  return selectedTrip.items
    .map((item) => ({
      ...item,
      quantity: draftQuantities[item.id] || 0,
    }))
    .filter((item) => item.quantity > 0);
}

/**
 * Adds selected items into the cart group for their driver trip.
 *
 * @param {Object[]} currentCart - Existing cart groups.
 * @param {Object} selectedTrip - Trip that owns the selected items.
 * @param {Object[]} chosenItems - Selected item lines to merge.
 * @returns {Object[]} Updated cart groups.
 */
export function mergeCartGroups(currentCart, selectedTrip, chosenItems) {
  const nextCart = [...currentCart];
  const tripIndex = nextCart.findIndex((tripGroup) => tripGroup.tripId === selectedTrip.id);
  const existingGroup = tripIndex >= 0 ? nextCart[tripIndex] : null;
  // Merge new quantities into the existing driver group so the cart stays grouped by trip.
  const mergedItems = new Map(
    (existingGroup ? existingGroup.items : []).map((item) => [item.id, { ...item }]),
  );

  chosenItems.forEach((item) => {
    const existingLine = mergedItems.get(item.id);

    if (existingLine) {
      existingLine.quantity = Math.min(existingLine.quantity + item.quantity, item.availableQty);
      return;
    }

    mergedItems.set(item.id, {
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      unit: item.unit,
    });
  });

  const nextGroup = {
    tripId: selectedTrip.id,
    storeName: selectedTrip.storeName,
    driverName: selectedTrip.driver.name,
    driverPhoto: selectedTrip.driver.photo,
    pickupTime: selectedTrip.pickupTime,
    pickupLabel: selectedTrip.resolvedPickupLocation.label,
    items: Array.from(mergedItems.values()),
  };

  if (tripIndex >= 0) {
    nextCart[tripIndex] = nextGroup;
    return nextCart;
  }

  return [...nextCart, nextGroup];
}

/**
 * Clears quantity drafts for items that were just added to cart.
 *
 * @param {Object} currentDrafts - Current draft quantities keyed by item ID.
 * @param {Object[]} chosenItems - Items that were added to cart.
 * @returns {Object} Draft quantity map with added items reset to zero.
 */
export function resetDraftQuantities(currentDrafts, chosenItems) {
  const nextDrafts = { ...currentDrafts };
  chosenItems.forEach((item) => {
    nextDrafts[item.id] = 0;
  });
  return nextDrafts;
}

/**
 * Counts selected quantities for the currently selected trip.
 *
 * @param {Object|null} selectedTrip - Currently selected trip.
 * @param {Object} draftQuantities - Quantity selections keyed by item ID.
 * @returns {number} Total selected quantity.
 */
export function getSelectedQuantityCount(selectedTrip, draftQuantities) {
  if (!selectedTrip) {
    return 0;
  }

  return selectedTrip.items.reduce((sum, item) => sum + (draftQuantities[item.id] || 0), 0);
}

/**
 * Adds subtotal and line-count metadata to cart groups.
 *
 * @param {Object[]} cartGroups - Raw cart groups.
 * @returns {Object[]} Cart groups with subtotal and line count fields.
 */
export function enrichCartGroups(cartGroups) {
  return cartGroups.map((tripGroup) => ({
    ...tripGroup,
    lineCount: tripGroup.items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: tripGroup.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
  }));
}

/**
 * Counts all item quantities across cart groups.
 *
 * @param {Object[]} cartGroups - Enriched cart groups.
 * @returns {number} Total item quantity.
 */
export function getCartLineCount(cartGroups) {
  return cartGroups.reduce((sum, tripGroup) => sum + tripGroup.lineCount, 0);
}

/**
 * Totals all cart group subtotals.
 *
 * @param {Object[]} cartGroups - Enriched cart groups.
 * @returns {number} Total cart subtotal.
 */
export function getCartSubtotal(cartGroups) {
  return cartGroups.reduce((sum, tripGroup) => sum + tripGroup.subtotal, 0);
}
