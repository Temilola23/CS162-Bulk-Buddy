import { useEffect, useMemo, useState } from 'react';
import { buildLinkedOrderHref } from '../utils/linkedOrderHref';

const ORDER_SELECTION_STORAGE_KEY = 'bulk-buddy-linked-order-selection';
const defaultOptions = {
  fallbackBucket: '',
  scope: 'bucketed',
};

// Allow callers to either pass a simple fallback bucket string or a fuller
// options object when a page needs different selection behavior.
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

// Read the current linked order context from both the URL and local storage.
// URL params win so deep links can intentionally override the last saved state.
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

function getUniqueBuckets(orders) {
  return Array.from(new Set(orders.map((order) => order.bucket)));
}

function getUniqueDates(orders) {
  return Array.from(new Set(orders.map((order) => order.date))).sort();
}

// Normalize any partial selection into a valid order/date/bucket combination.
// "bucketed" mode keeps the selection inside one My Orders bucket, while "all"
// mode lets Trip Detail browse any linked order regardless of bucket.
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

export function getLinkedOrderHref(pathname, orders, fallbackBucket = '') {
  return buildLinkedOrderHref(
    pathname,
    resolveLinkedOrderSelection(orders, getBrowserSelection(), fallbackBucket),
  );
}

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

// Keeps shopper pages in sync by exposing one shared selection model for
// bucket/date/order, then mirroring it into the URL and local storage.
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
