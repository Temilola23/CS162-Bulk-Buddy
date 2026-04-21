import { statusSteps } from '../data/shopperOrders';

/**
 * Converts a status step index into a readable status label.
 *
 * @param {number} stepIndex - Current order status step index.
 * @returns {string} Display status label.
 */
export function formatStatus(stepIndex) {
  return statusSteps[stepIndex].toUpperCase();
}

/**
 * Returns the progress-bar fill percent for a status step.
 *
 * @param {number} stepIndex - Current order status step index.
 * @returns {number} Progress fill percentage.
 */
export function getStatusProgress(stepIndex) {
  // The fill extends through the current step, not just to its midpoint.
  return `${((stepIndex + 1) / statusSteps.length) * 100}%`;
}

/**
 * Returns the marker position percent for a status step.
 *
 * @param {number} stepIndex - Current order status step index.
 * @returns {number} Marker position percentage.
 */
export function getStatusMarkerPosition(stepIndex) {
  // Markers sit on the right edge of each segment so the filled bar reaches them.
  return `${((stepIndex + 1) / statusSteps.length) * 100}%`;
}

/**
 * Returns the least advanced item status for an order.
 *
 * @param {Object|null} order - UI order with item status steps.
 * @returns {number} Least advanced status step index.
 */
export function getOrderStatusStepIndex(order) {
  if (!order || !order.items.length) {
    return 0;
  }

  // An order cannot look further along than its least-advanced item.
  return Math.min(...order.items.map((item) => item.currentStep));
}
