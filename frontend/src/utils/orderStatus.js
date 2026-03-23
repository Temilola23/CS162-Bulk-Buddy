import { statusSteps } from '../data/shopperOrders';

export function formatStatus(stepIndex) {
  return statusSteps[stepIndex].toUpperCase();
}

export function getStatusProgress(stepIndex) {
  // The fill extends through the current step, not just to its midpoint.
  return `${((stepIndex + 1) / statusSteps.length) * 100}%`;
}

export function getStatusMarkerPosition(stepIndex) {
  // Markers sit on the right edge of each segment so the filled bar reaches them.
  return `${((stepIndex + 1) / statusSteps.length) * 100}%`;
}

export function getOrderStatusStepIndex(order) {
  if (!order || !order.items.length) {
    return 0;
  }

  // An order cannot look further along than its least-advanced item.
  return Math.min(...order.items.map((item) => item.currentStep));
}
