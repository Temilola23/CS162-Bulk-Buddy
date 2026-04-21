/**
 * Builds a route URL containing the linked order selection query params.
 *
 * @param {string} pathname - Route path to link to.
 * @param {{bucket?: string, date?: string, orderId?: string}} selection - Order selection state.
 * @returns {string} Route URL with order selection query params.
 */
export function buildLinkedOrderHref(pathname, selection) {
  if (!selection) {
    return pathname;
  }

  // Mirror the shared bucket/date/order selection into the URL so Trip Detail
  // and My Orders can deep-link to the same order context.
  const searchParams = new URLSearchParams();

  if (selection.bucket) {
    searchParams.set('bucket', selection.bucket);
  }

  if (selection.date) {
    searchParams.set('date', selection.date);
  }

  if (selection.orderId) {
    searchParams.set('order', selection.orderId);
  }

  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}
