/**
 * Shared US currency formatter for prices and subtotals.
 */
export const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});
