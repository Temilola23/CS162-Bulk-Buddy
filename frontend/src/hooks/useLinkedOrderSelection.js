import { useEffect, useMemo, useState } from 'react';
import { buildLinkedOrderHref } from '../utils/linkedOrderHref';

const ORDER_SELECTION_STORAGE_KEY = 'bulk-buddy-linked-order-selection';
const defaultOptions = {
  fallbackBucket: '',
  scope: 'bucketed',
};

/**
 * Converts simple or object options into one consistent selection config.
 *
 * @param {string|Object} optionsOrFallbackBucket - Fallback bucket or options object.
 * @returns {Object} Normalized linked-order options.
 */
function normalizeOptions(optionsOrFallbackBucket) {
  if (typeof optionsOrFallbackBucket === 'string') {
    return {
      ...defaultOptions,
      fallbackBucket: optionsOrFallbackBucket,
    };
  }

  return {
    ...defaultOptions,
    ...(optionsOrFallbackBucket || {}),
  };
}

/**
 * Reads linked order selection from URL params and local storage.
 *
 * @returns {{bucket: string, date: string, orderId: string}|Object} Stored selection.
 */
function getBrowserSelection() {
  if (typeof window === 'undefined') {
    return {};
  }

  const searchParams = new URLSearchParams(window.location.search);
  const selectionFromUrl = {
    bucket: searchParams.get('bucket') || '',
    date: searchParams.get('date') || '',
    orderId: searchParams.get('order') || '',
  };

  let selectionFromStorage = {};

  try {
    const storedValue = window.localStorage.getItem(ORDER_SELECTION_STORAGE_KEY);
    selectionFromStorage = storedValue ? JSON.parse(storedValue) : {};
  } catch {
    selectionFromStorage = {};
  }

  return {
    ...selectionFromStorage,
    ...Object.fromEntries(
      Object.entries(selectionFromUrl).filter(([, value]) => Boolean(value)),
    ),
  };
}

/**
 * Returns the available order buckets from a list of orders.
 *
 * @param {Object[]} orders - UI order models.
 * @returns {string[]} Unique order buckets.
 */
function getUniqueBuckets(orders) {
  return Array.from(new Set(orders.map((order) => order.bucket)));
}

/**
 * Returns sorted unique pickup dates for order navigation.
 *
 * @param {Object[]} orders - UI order models.
 * @returns {string[]} Sorted unique pickup dates.
 */
function getUniqueDates(orders) {
  return Array.from(new Set(orders.map((order) => order.date))).sort();
}

/**
 * Normalizes a partial bucket/date/order selection to an existing order.
 *
 * @param {Object[]} orders - UI order models.
 * @param {Object} candidateSelection - Partial selection from state, URL, or storage.
 * @param {string|Object} fallbackBucket - Bucket fallback or normalized options.
 * @returns {{bucket: string, date: string, orderId: string}} Valid selection.
 */
export function resolveLinkedOrderSelection(orders, candidateSelection = {}, fallbackBucket = '') {
  const options = normalizeOptions(fallbackBucket);

  if (!orders.length) {
    return { bucket: '', date: '', orderId: '' };
  }

  const orderFromId = candidateSelection.orderId
    ? orders.find((order) => order.id === candidateSelection.orderId)
    : null;
  const buckets = getUniqueBuckets(orders);
  const nextBucket =
    (candidateSelection.bucket && buckets.includes(candidateSelection.bucket)
      ? candidateSelection.bucket
      : '') ||
    orderFromId?.bucket ||
    (options.fallbackBucket && buckets.includes(options.fallbackBucket)
      ? options.fallbackBucket
      : '') ||
    buckets[0];
  const scopedOrders =
    options.scope === 'all'
      ? orders
      : orders.filter((order) => order.bucket === nextBucket);
  const nextDate =
    candidateSelection.date ||
    orderFromId?.date ||
    getUniqueDates(scopedOrders)[0] ||
    '';
  const dateOrders = scopedOrders.filter((order) => order.date === nextDate);
  const nextOrder =
    (orderFromId && dateOrders.some((order) => order.id === orderFromId.id) ? orderFromId : null) ||
    dateOrders.find((order) => order.id === candidateSelection.orderId) ||
    dateOrders[0] ||
    null;

  return {
    bucket: nextOrder?.bucket || nextBucket,
    date: nextDate,
    orderId: nextOrder?.id || '',
  };
}

/**
 * Builds a URL to another page while preserving the active order context.
 *
 * @param {string} pathname - Target route path.
 * @param {Object[]} orders - UI order models.
 * @param {string} fallbackBucket - Preferred fallback bucket.
 * @returns {string} URL with linked-order params.
 */
export function getLinkedOrderHref(pathname, orders, fallbackBucket = '') {
  return buildLinkedOrderHref(
    pathname,
    resolveLinkedOrderSelection(orders, getBrowserSelection(), fallbackBucket),
  );
}

/**
 * Mirrors the active linked-order selection into storage and the URL.
 *
 * @param {string} pathname - Current route path.
 * @param {Object} selection - Linked order selection to persist.
 * @returns {void}
 */
function persistLinkedOrderSelection(pathname, selection) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(ORDER_SELECTION_STORAGE_KEY, JSON.stringify(selection));
  } catch {
    // Ignore persistence failures and keep the in-memory selection.
  }

  window.history.replaceState({}, '', buildLinkedOrderHref(pathname, selection));
}


/**
 * Stores an order selection for the next order-aware page visit.
 *
 * @param {Object} selection - Linked order selection to save.
 * @returns {void}
 */
export function rememberLinkedOrderSelection(selection) {
  if (typeof window === 'undefined' || !selection) {
    return;
  }

  try {
    window.localStorage.setItem(
      ORDER_SELECTION_STORAGE_KEY,
      JSON.stringify(selection),
    );
  } catch {
    // Ignore storage failures and keep navigation working without persistence.
  }
}

/**
 * Keeps My Orders and Trip Detail synchronized on bucket, date, and order.
 *
 * @param {Object[]} orders - UI order models.
 * @param {string|Object} fallbackBucket - Preferred fallback bucket or options.
 * @returns {Object} Active selection, selected orders, and navigation handlers.
 */
export default function useLinkedOrderSelection(orders, fallbackBucket = '') {
  const options = normalizeOptions(fallbackBucket);
  const [selectionState, setSelectionState] = useState(() =>
    resolveLinkedOrderSelection(orders, getBrowserSelection(), options),
  );

  const selection = useMemo(
    () => resolveLinkedOrderSelection(orders, selectionState, options),
    [orders, selectionState, options],
  );
  const scopedOrders = useMemo(
    () =>
      options.scope === 'all'
        ? orders
        : orders.filter((order) => order.bucket === selection.bucket),
    [orders, selection.bucket, options.scope],
  );
  const ordersForDate = useMemo(
    () => scopedOrders.filter((order) => order.date === selection.date),
    [scopedOrders, selection.date],
  );
  const activeOrder =
    ordersForDate.find((order) => order.id === selection.orderId) || ordersForDate[0] || null;
  const activeOrderIndex = activeOrder
    ? ordersForDate.findIndex((order) => order.id === activeOrder.id)
    : -1;

  useEffect(() => {
    // If the available orders change, re-normalize the local state so it never
    // points at a date or order that no longer exists.
    if (
      selection.bucket !== selectionState.bucket ||
      selection.date !== selectionState.date ||
      selection.orderId !== selectionState.orderId
    ) {
      setSelectionState(selection);
    }
  }, [selection, selectionState]);

  useEffect(() => {
    // Persist every selection change so moving between shopper pages preserves
    // the same order context.
    persistLinkedOrderSelection(window.location.pathname, selection);
  }, [selection]);

  function setActiveBucket(nextBucket) {
    setSelectionState((current) =>
      resolveLinkedOrderSelection(
        orders,
        { ...current, bucket: nextBucket, orderId: '' },
        { ...options, fallbackBucket: nextBucket },
      ),
    );
  }

  function setSelectedDate(nextDate) {
    setSelectionState((current) =>
      resolveLinkedOrderSelection(
        orders,
        { ...current, date: nextDate, orderId: '' },
        { ...options, fallbackBucket: current.bucket },
      ),
    );
  }

  function setActiveOrderId(nextOrderId) {
    setSelectionState((current) =>
      resolveLinkedOrderSelection(
        orders,
        { ...current, orderId: nextOrderId },
        { ...options, fallbackBucket: current.bucket },
      ),
    );
  }

  function setActiveOrderIndex(nextIndex) {
    const nextOrder = ordersForDate[nextIndex];

    if (nextOrder) {
      // Translate index-based carousel navigation into the shared order id.
      setActiveOrderId(nextOrder.id);
    }
  }

  return {
    selection,
    activeBucket: selection.bucket,
    setActiveBucket,
    selectedDate: selection.date,
    setSelectedDate,
    setActiveOrderId,
    activeOrderIndex,
    setActiveOrderIndex,
    ordersForDate,
    activeOrder,
  };
}
