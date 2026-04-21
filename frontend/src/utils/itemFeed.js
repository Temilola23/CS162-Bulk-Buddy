import { createAvatarImage } from './avatar';
import { formatDistance, getDistanceMiles } from './tripFeed';

/**
 * Formats pickup timestamps for item feed cards.
 *
 * @param {string} dateValue - Pickup timestamp.
 * @returns {string} Display pickup time.
 */
function formatPickupTime(dateValue) {
  return new Date(dateValue).toLocaleString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).replace(',', ' •');
}

/**
 * Maps one inventory API item into the item feed card shape.
 *
 * @param {Object} item - Inventory API item with nested trip.
 * @param {{lat: number, lng: number}} shopperLocation - Shopper coordinate.
 * @returns {Object} Item feed card model.
 */
export function mapApiInventoryItemToUi(item, shopperLocation) {
  const trip = item.trip || {};
  const driverName = trip.driver?.full_name || 'Bulk Buddy Driver';
  const pickupLocation = {
    label: trip.pickup_location_text || 'Pickup location TBD',
    lat: trip.pickup_lat ?? 37.7599,
    lng: trip.pickup_lng ?? -122.4148,
  };

  return {
    id: String(item.item_id),
    itemId: item.item_id,
    tripId: trip.trip_id,
    name: item.name,
    unit: item.unit,
    totalQuantity: item.total_quantity,
    claimedQuantity: item.claimed_quantity,
    availableQuantity: item.available_quantity,
    unitPrice: item.price_per_unit || 0,
    storeName: trip.store_name || 'Warehouse trip',
    pickupTime: trip.pickup_time ? formatPickupTime(trip.pickup_time) : 'Pickup time TBD',
    pickupTimestamp: trip.pickup_time || null,
    pickupLabel: pickupLocation.label,
    distanceLabel: formatDistance(getDistanceMiles(shopperLocation, pickupLocation)),
    driver: {
      name: driverName,
      photo: createAvatarImage(driverName),
    },
  };
}

/**
 * Maps and sorts inventory items alphabetically, then by pickup time.
 *
 * @param {Object[]} items - Inventory API items.
 * @param {{lat: number, lng: number}} shopperLocation - Shopper coordinate.
 * @returns {Object[]} Sorted item feed card models.
 */
export function mapApiInventoryToUi(items, shopperLocation) {
  return items
    .map((item) => mapApiInventoryItemToUi(item, shopperLocation))
    .sort((left, right) => {
      const nameComparison = left.name.localeCompare(right.name, undefined, {
        sensitivity: 'base',
      });

      if (nameComparison !== 0) {
        return nameComparison;
      }

      if (left.pickupTimestamp && right.pickupTimestamp) {
        const pickupComparison = new Date(left.pickupTimestamp) - new Date(right.pickupTimestamp);
        if (pickupComparison !== 0) {
          return pickupComparison;
        }
      }

      return left.storeName.localeCompare(right.storeName, undefined, {
        sensitivity: 'base',
      });
    });
}

/**
 * Finds the shopper active order for a specific trip.
 *
 * @param {Object[]} orders - Shopper order API payloads.
 * @param {number|string} tripId - Trip ID to match.
 * @returns {Object|null} Matching active order, if present.
 */
export function getActiveOrderForTrip(orders, tripId) {
  return (
    orders.find(
      (order) => String(order.trip_id) === String(tripId) && order.status !== 'cancelled',
    ) || null
  );
}

/**
 * Returns the quantity already claimed for an item in an order.
 *
 * @param {Object|null} order - Shopper order API payload.
 * @param {number|string} itemId - Item ID to match.
 * @returns {number} Claimed quantity for the item.
 */
export function getOrderItemQuantity(order, itemId) {
  const orderItem = (order?.order_items || []).find(
    (item) => String(item.item_id) === String(itemId),
  );

  return orderItem?.quantity || 0;
}
