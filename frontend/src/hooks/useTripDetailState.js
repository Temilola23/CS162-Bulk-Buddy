import { useMemo, useState } from 'react';
import useLinkedOrderSelection from '../components/useLinkedOrderSelection';
import { shopperOrders } from '../data/shopperOrders';
import { getOrderStatusStepIndex } from '../utils/orderStatus';

function getInitialQuantitiesByOrder() {
  return shopperOrders.reduce((orderAccumulator, order) => {
    orderAccumulator[order.id] = order.items.reduce((itemAccumulator, item) => {
      itemAccumulator[item.id] = item.defaultQuantity;
      return itemAccumulator;
    }, {});

    return orderAccumulator;
  }, {});
}

function getInitialClaimStates() {
  return shopperOrders.reduce((accumulator, order) => {
    accumulator[order.id] = order.bucket === 'past' ? 'completed' : 'picked-up';
    return accumulator;
  }, {});
}

export default function useTripDetailState() {
  // Trip Detail can browse across all linked orders, not just one bucket.
  const selection = useLinkedOrderSelection(shopperOrders, { scope: 'all' });
  const [quantitiesByOrder, setQuantitiesByOrder] = useState(getInitialQuantitiesByOrder);
  const [claimStatesByOrder, setClaimStatesByOrder] = useState(getInitialClaimStates);
  const activeOrder = selection.activeOrder;
  const activeClaimState = activeOrder ? claimStatesByOrder[activeOrder.id] || 'picked-up' : null;
  const canViewPreviousOrder = selection.activeOrderIndex > 0;
  const canViewNextOrder = selection.activeOrderIndex < selection.ordersForDate.length - 1;
  const orderStatusStepIndex = getOrderStatusStepIndex(activeOrder);

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

  function updateClaimState(nextState) {
    if (!activeOrder) {
      return;
    }

    // Persist claim-state UI per order so switching dates does not wipe the slider.
    setClaimStatesByOrder((current) => ({
      ...current,
      [activeOrder.id]: nextState,
    }));
  }

  return {
    ...selection,
    quantitiesByOrder,
    activeClaimState,
    canViewPreviousOrder,
    canViewNextOrder,
    summary,
    orderStatusStepIndex,
    updateQuantity,
    updateClaimState,
  };
}
