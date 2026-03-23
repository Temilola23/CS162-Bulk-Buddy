import { formatDistance, getDistanceMiles } from './tripFeed';

function formatTripHeading(dateValue) {
  const date = new Date(dateValue);
  return date.toLocaleString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).replace(',', ' •');
}

function getStatusStepIndexFromApiStatus(status) {
  switch (status) {
    case 'purchased':
      return 1;
    case 'ready_for_pickup':
      return 2;
    case 'completed':
      return 3;
    case 'claimed':
    default:
      return 0;
  }
}

function getBucketFromOrder(tripPickupTime, status) {
  if (status === 'completed' || new Date(tripPickupTime).getTime() < Date.now()) {
    return 'past';
  }

  return 'upcoming';
}

export function mapApiOrdersToUi(orders, shopperLocation) {
  return orders.map((order) => {
    const trip = order.trip;
    const statusStep = getStatusStepIndexFromApiStatus(order.status);
    const pickupDate = new Date(trip.pickup_time);
    const pickupLabel = trip.pickup_location_text;
    const driverName = trip.driver?.full_name || 'Bulk Buddy Driver';
    const distanceLabel = formatDistance(
      getDistanceMiles(shopperLocation, {
        lat: trip.pickup_lat ?? 37.7599,
        lng: trip.pickup_lng ?? -122.4148,
      }),
    );
    const claimedByItemId = (order.order_items || []).reduce((accumulator, orderItem) => {
      accumulator[orderItem.item_id] = orderItem.quantity;
      return accumulator;
    }, {});

    return {
      id: String(order.order_id),
      orderId: order.order_id,
      bucket: getBucketFromOrder(trip.pickup_time, order.status),
      date: trip.pickup_time.slice(0, 10),
      heading: formatTripHeading(trip.pickup_time),
      title: `${pickupDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })} • ${pickupLabel.split(',')[0]}`,
      summary: `Driver: ${driverName} • Pickup at ${pickupDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      })} • ${distanceLabel}`,
      switcherLabel: pickupLabel.split(',')[0],
      switcherMeta: pickupDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      }),
      pickupLabel,
      pickupTime: formatTripHeading(trip.pickup_time),
      driver: {
        name: driverName,
        vehicle: 'Verified Bulk Buddy driver',
        distanceLabel,
      },
      capacity: {
        slotsLeft: (trip.items || []).reduce(
          (sum, item) => sum + (item.available_quantity || 0),
          0,
        ),
        status: trip.status ? trip.status[0].toUpperCase() + trip.status.slice(1) : 'Open',
      },
      note: 'Coordinate final pickup timing with your driver before arrival.',
      items: (trip.items || []).map((item) => ({
        id: String(item.item_id),
        name: item.name,
        quantityLabel: `${claimedByItemId[item.item_id] || 0} ${item.unit}`,
        unit: item.unit,
        totalShares: item.total_quantity,
        claimed: item.claimed_quantity,
        pricePerShare: item.price_per_unit || 0,
        defaultQuantity: claimedByItemId[item.item_id] || 0,
        currentStep: statusStep,
      })),
      apiStatus: order.status,
    };
  });
}
