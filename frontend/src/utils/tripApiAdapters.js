import { createAvatarImage } from './avatar';
import { buildSortedTrips, formatDistance, getDistanceMiles } from './tripFeed';

const DEFAULT_DRIVER_VEHICLE = 'Verified Bulk Buddy driver';

/**
 * Resolves shopper coordinates, falling back when backend geocoding is absent.
 *
 * @param {Object|null} user - Current user API payload.
 * @param {{label: string, lat: number, lng: number}} fallbackLocation - Default shopper location.
 * @returns {{label: string, lat: number, lng: number}} Resolved shopper location.
 */
export function getShopperLocationFromUser(user, fallbackLocation) {
  // The backend may not have geocoded coordinates for every seeded user yet,
  // so distance-based sorting falls back to the prototype shopper location.
  if (user?.latitude !== null && user?.latitude !== undefined && user?.longitude !== null && user?.longitude !== undefined) {
    return {
      label: user.address_street || fallbackLocation.label,
      lat: user.latitude,
      lng: user.longitude,
    };
  }

  return fallbackLocation;
}

/**
 * Maps one trip API payload into the trip feed/detail UI shape.
 *
 * @param {Object} trip - Trip API payload.
 * @returns {Object} Trip UI model.
 */
export function mapApiTripToUi(trip) {
  const driverName = trip.driver?.full_name || 'Bulk Buddy Driver';

  return {
    id: String(trip.trip_id),
    tripId: trip.trip_id,
    storeName: trip.store_name || 'Warehouse trip',
    driver: {
      name: driverName,
      photo: createAvatarImage(driverName),
      // Vehicle/rating are not modeled by the backend yet, so the frontend
      // keeps a stable placeholder until those fields exist server-side.
      rating: 5,
      vehicle: DEFAULT_DRIVER_VEHICLE,
      locationLabel: trip.pickup_location_text,
    },
    driverLocation: {
      lat: trip.pickup_lat ?? 37.7599,
      lng: trip.pickup_lng ?? -122.4148,
    },
    pickupLocation: {
      label: trip.pickup_location_text,
      lat: trip.pickup_lat ?? 37.7599,
      lng: trip.pickup_lng ?? -122.4148,
    },
    pickupTime: new Date(trip.pickup_time).toLocaleString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).replace(',', ' •'),
    status: trip.status,
    items: (trip.items || []).map((item) => ({
      id: String(item.item_id),
      itemId: item.item_id,
      name: item.name,
      availableQty: item.available_quantity,
      unit: item.unit,
      unitPrice: item.price_per_unit || 0,
    })),
  };
}

/**
 * Maps and sorts trips by distance from the shopper.
 *
 * @param {Object[]} trips - Trip API payloads.
 * @param {{lat: number, lng: number}} shopperLocation - Shopper coordinate.
 * @returns {Object[]} Trip UI models sorted by distance.
 */
export function mapApiTripsToUi(trips, shopperLocation) {
  return buildSortedTrips(trips.map(mapApiTripToUi), shopperLocation);
}

/**
 * Computes the display distance label for a trip.
 *
 * @param {Object} trip - Trip UI model.
 * @param {{lat: number, lng: number}} shopperLocation - Shopper coordinate.
 * @returns {string} Display distance label.
 */
export function getTripDistanceLabel(trip, shopperLocation) {
  const distanceMiles = getDistanceMiles(shopperLocation, trip.pickupLocation || trip.driverLocation);
  return formatDistance(distanceMiles);
}
