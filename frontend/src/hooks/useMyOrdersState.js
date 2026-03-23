import useLinkedOrderSelection from '../components/useLinkedOrderSelection';
import { shopperOrders } from '../data/shopperOrders';
import { getOrderStatusStepIndex } from '../utils/orderStatus';

export default function useMyOrdersState() {
  // My Orders stays bucketed so the page can switch cleanly between Upcoming and Past.
  const selection = useLinkedOrderSelection(shopperOrders, 'upcoming');
  const canViewPreviousOrder = selection.activeOrderIndex > 0;
  const canViewNextOrder = selection.activeOrderIndex < selection.ordersForDate.length - 1;
  // The order-level status is driven by the least-advanced item on that order.
  const orderStatusStepIndex = getOrderStatusStepIndex(selection.activeOrder);

  return {
    selection: selection.selection,
    activeBucket: selection.activeBucket,
    setActiveBucket: selection.setActiveBucket,
    selectedDate: selection.selectedDate,
    setSelectedDate: selection.setSelectedDate,
    activeOrder: selection.activeOrder,
    activeOrderIndex: selection.activeOrderIndex,
    setActiveOrderId: selection.setActiveOrderId,
    setActiveOrderIndex: selection.setActiveOrderIndex,
    ordersForDate: selection.ordersForDate,
    canViewPreviousOrder,
    canViewNextOrder,
    orderStatusStepIndex,
  };
}
