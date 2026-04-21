import { useEffect, useMemo, useState } from 'react';
import useLinkedOrderSelection from './useLinkedOrderSelection';
import { useApi } from '../contexts/ApiProvider';
import { getOrderStatusStepIndex } from '../utils/orderStatus';
import useShopperOrdersData from './useShopperOrdersData';

/**
 * Builds editable quantity drafts keyed by order and item.
 */
function getInitialQuantitiesByOrder(orders) {
  return orders.reduce((orderAccumulator, order) => {
    orderAccumulator[order.id] = order.items.reduce((itemAccumulator, item) => {
      itemAccumulator[item.id] = item.defaultQuantity;
      return itemAccumulator;
    }, {});

    return orderAccumulator;
  }, {});
}

/**
 * Initializes per-order in-progress/completed slider state.
 */
function getInitialClaimStates(orders) {
  return orders.reduce((accumulator, order) => {
    accumulator[order.id] = order.bucket === 'past' ? 'completed' : 'in-progress';
    return accumulator;
  }, {});
}

/**
 * Manages linked order detail, quantity drafts, and completion actions.
 */
export default function useTripDetailState() {
  const api = useApi();
  const { orders, isOrdersLoading, ordersError } = useShopperOrdersData();
  // Trip Detail can browse across all linked orders, not just one bucket.
  const selection = useLinkedOrderSelection(orders, { scope: 'all' });
  const [quantitiesByOrder, setQuantitiesByOrder] = useState({});
  const [claimStatesByOrder, setClaimStatesByOrder] = useState({});
  const [claimStateMessage, setClaimStateMessage] = useState('');
  const activeOrder = selection.activeOrder;
  const activeClaimState = activeOrder ? claimStatesByOrder[activeOrder.id] || 'in-progress' : null;
  const canCompleteActiveOrder = activeOrder
    ? ['ready_for_pickup', 'completed'].includes(activeOrder.apiStatus)
    : false;
  const canViewPreviousOrder = selection.activeOrderIndex > 0;
  const canViewNextOrder = selection.activeOrderIndex < selection.ordersForDate.length - 1;
  const orderStatusStepIndex = getOrderStatusStepIndex(activeOrder);

  useEffect(() => {
    if (!orders.length) {
      return;
    }

    setQuantitiesByOrder((current) => ({
      ...getInitialQuantitiesByOrder(orders),
      ...current,
    }));
    setClaimStatesByOrder((current) => ({
      ...getInitialClaimStates(orders),
      ...current,
    }));
  }, [orders]);

  useEffect(() => {
    setClaimStateMessage('');
  }, [activeOrder?.id]);

  const summary = useMemo(() => {
    if (!activeOrder) {
      return { totalQuantity: 0, subtotal: 0 };
    }

    // Recompute the claim summary from the currently selected order's draft quantities.
    const activeQuantities = quantitiesByOrder[activeOrder.id] || {};

    return activeOrder.items.reduce(
      (accumulator, item) => {
        const selectedQuantity = activeQuantities[item.id] || 0;

        accumulator.totalQuantity += selectedQuantity;
        accumulator.subtotal += selectedQuantity * item.pricePerShare;

        return accumulator;
      },
      { totalQuantity: 0, subtotal: 0 },
    );
  }, [activeOrder, quantitiesByOrder]);

  function updateQuantity(itemId, nextQuantity, maxQuantity) {
    if (!activeOrder) {
      return;
    }

    const boundedQuantity = Math.max(0, Math.min(maxQuantity, nextQuantity));

    setQuantitiesByOrder((current) => ({
      ...current,
      [activeOrder.id]: {
        ...current[activeOrder.id],
        [itemId]: boundedQuantity,
      },
    }));
  }

  async function updateClaimState(nextState) {
    if (!activeOrder) {
      return;
    }

    if (activeClaimState === 'completed' && nextState !== 'completed') {
      setClaimStateMessage('Completed orders cannot be moved back to in progress.');
      return;
    }

    if (nextState === 'completed' && !canCompleteActiveOrder) {
      setClaimStateMessage('The driver needs to mark this trip ready for pickup first.');
      return;
    }

    // Persist claim-state UI per order so switching dates does not wipe the slider.
    setClaimStatesByOrder((current) => ({
      ...current,
      [activeOrder.id]: nextState,
    }));
    setClaimStateMessage('');

    if (nextState === 'completed') {
      const response = await api.patch(`/me/orders/${activeOrder.orderId}/complete`);
      if (!response.ok) {
        setClaimStatesByOrder((current) => ({
          ...current,
          [activeOrder.id]: 'in-progress',
        }));
        setClaimStateMessage(response.body?.message || 'Unable to complete this order.');
      }
    }
  }

  return {
    ...selection,
    orders,
    isOrdersLoading,
    ordersError,
    quantitiesByOrder,
    activeClaimState,
    canCompleteActiveOrder,
    claimStateMessage,
    canViewPreviousOrder,
    canViewNextOrder,
    summary,
    orderStatusStepIndex,
    updateQuantity,
    updateClaimState,
  };
}
