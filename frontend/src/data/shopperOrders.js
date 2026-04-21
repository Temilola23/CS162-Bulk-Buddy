// Shared order-status labels used by both the orders history and trip-detail
// views so they stay visually consistent.
export const statusSteps = [
  'Claimed',
  'Purchased',
  'Ready for Pickup',
  'Completed',
];

// Static copy for the trip-detail rules card. This is product guidance, not
// live order data, so it still belongs in a small data module.
export const tripRules = [
  {
    label: 'Claim scope',
    value: "Choose only from the driver's posted items.",
  },
  {
    label: 'Pickup confirmation',
    value: 'Use the slider to mark the order completed once pickup is ready.',
  },
  {
    label: 'Oversell prevention',
    value: 'Quantity is capped at the still-available share count.',
  },
];
