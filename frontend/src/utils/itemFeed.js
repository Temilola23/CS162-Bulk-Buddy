import { createAvatarImage } from './avatar';
import { formatDistance, getDistanceMiles } from './tripFeed';

function formatPickupTime(dateValue) {
  return new Date(dateValue).toLocaleString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).replace(',', ' •');
}

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

export function getActiveOrderForTrip(orders, tripId) {
  return (
    orders.find(
      (order) => String(order.trip_id) === String(tripId) && order.status !== 'cancelled',
    ) || null
  );
}

export function getOrderItemQuantity(order, itemId) {
  const orderItem = (order?.order_items || []).find(
    (item) => String(item.item_id) === String(itemId),
  );

  return orderItem?.quantity || 0;
}
