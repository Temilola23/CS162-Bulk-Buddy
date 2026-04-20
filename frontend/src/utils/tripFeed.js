function toRadians(value) {
  return (value * Math.PI) / 180;
}

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

export function formatDistance(distanceMiles) {
  return `${distanceMiles.toFixed(1)} miles away`;
}

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

export function resetDraftQuantities(currentDrafts, chosenItems) {
  const nextDrafts = { ...currentDrafts };
  chosenItems.forEach((item) => {
    nextDrafts[item.id] = 0;
  });
  return nextDrafts;
}

export function getSelectedQuantityCount(selectedTrip, draftQuantities) {
  if (!selectedTrip) {
    return 0;
  }

  return selectedTrip.items.reduce((sum, item) => sum + (draftQuantities[item.id] || 0), 0);
}

export function enrichCartGroups(cartGroups) {
  return cartGroups.map((tripGroup) => ({
    ...tripGroup,
    lineCount: tripGroup.items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: tripGroup.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
  }));
}

export function getCartLineCount(cartGroups) {
  return cartGroups.reduce((sum, tripGroup) => sum + tripGroup.lineCount, 0);
}

export function getCartSubtotal(cartGroups) {
  return cartGroups.reduce((sum, tripGroup) => sum + tripGroup.subtotal, 0);
}
