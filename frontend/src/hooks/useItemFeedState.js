import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApi } from '../contexts/ApiProvider';
import { useSession } from '../contexts/SessionProvider';
import { shopperLocation } from '../data/tripFeedData';
import { buildAuthRedirectUrl } from './usePostAuthRedirect';
import { getShopperLocationFromUser } from '../utils/tripApiAdapters';
import { mapApiOrdersToUi } from '../utils/orderApiAdapters';
import {
  getActiveOrderForTrip,
  getOrderItemQuantity,
  mapApiInventoryToUi,
} from '../utils/itemFeed';
import { rememberLinkedOrderSelection } from './useLinkedOrderSelection';

/**
 * Loads claimable inventory, tracks draft quantities, and creates/updates orders.
 */
export default function useItemFeedState() {
  const api = useApi();
  const { currentUser, isSessionLoading } = useSession();
  const location = useLocation();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [draftQuantities, setDraftQuantities] = useState({});
  const [isItemFeedLoading, setIsItemFeedLoading] = useState(true);
  const [itemFeedError, setItemFeedError] = useState('');
  const [claimMessage, setClaimMessage] = useState('');
  const [submittingItemId, setSubmittingItemId] = useState(null);

  const shopperLocationForItems = useMemo(
    () => getShopperLocationFromUser(currentUser, shopperLocation),
    [currentUser],
  );

  useEffect(() => {
    let isActive = true;

    async function fetchItemFeed() {
      if (isSessionLoading) {
        return;
      }

      if (!currentUser) {
        setItems([]);
        setOrders([]);
        setIsItemFeedLoading(false);
        return;
      }

      setIsItemFeedLoading(true);
      setItemFeedError('');

      const [inventoryResponse, ordersResponse] = await Promise.all([
        api.get('/inventory'),
        api.get('/me/orders'),
      ]);

      if (!isActive) {
        return;
      }

      const unauthorizedResponse = [inventoryResponse, ordersResponse].find(
        (response) => response.status === 401,
      );
      if (unauthorizedResponse) {
        const requestedPath = `${location.pathname}${location.search}${location.hash}`;
        navigate(buildAuthRedirectUrl(requestedPath), { replace: true });
        return;
      }

      if (inventoryResponse.ok) {
        setItems(mapApiInventoryToUi(inventoryResponse.body?.items || [], shopperLocationForItems));
      } else {
        setItems([]);
      }

      if (ordersResponse.ok) {
        setOrders(ordersResponse.body?.orders || []);
      } else {
        setOrders([]);
      }

      if (!inventoryResponse.ok || !ordersResponse.ok) {
        setItemFeedError(
          inventoryResponse.body?.message
            || ordersResponse.body?.message
            || 'Unable to load the item feed.',
        );
      }

      setIsItemFeedLoading(false);
    }

    fetchItemFeed();

    return () => {
      isActive = false;
    };
  }, [
    api,
    currentUser,
    isSessionLoading,
    location.hash,
    location.pathname,
    location.search,
    navigate,
    shopperLocationForItems,
  ]);

  const itemsWithOrderContext = useMemo(
    () => items.map((item) => {
      const existingOrder = getActiveOrderForTrip(orders, item.tripId);
      const existingQuantity = getOrderItemQuantity(existingOrder, item.itemId);

      return {
        ...item,
        existingOrder,
        existingQuantity,
      };
    }),
    [items, orders],
  );

  function setItemQuantity(itemId, nextValue, maxValue) {
    const clampedValue = Math.max(0, Math.min(maxValue, nextValue));
    setDraftQuantities((current) => ({ ...current, [itemId]: clampedValue }));
    setClaimMessage('');
  }

  async function handleAddItem(item) {
    const quantity = draftQuantities[item.id] || 0;

    if (quantity <= 0) {
      setClaimMessage(`Choose a quantity for ${item.name} first.`);
      return;
    }

    setClaimMessage('');
    setSubmittingItemId(item.id);

    const response = await api.post('/me/orders', {
      trip_id: Number(item.tripId),
      items: [
        {
          item_id: Number(item.itemId),
          quantity,
        },
      ],
    });

    setSubmittingItemId(null);

    if (!response.ok) {
      if (response.status === 401) {
        const requestedPath = `${location.pathname}${location.search}${location.hash}`;
        navigate(buildAuthRedirectUrl(requestedPath), { replace: true });
        return;
      }

      setClaimMessage(response.body?.message || 'Unable to update this order.');
      return;
    }

    const updatedOrder = response.body?.order;
    if (updatedOrder) {
      const updatedOrderUi = mapApiOrdersToUi(
        [updatedOrder],
        shopperLocationForItems,
      )[0];

      setOrders((currentOrders) => {
        const orderIndex = currentOrders.findIndex(
          (order) => order.order_id === updatedOrder.order_id,
        );

        if (orderIndex < 0) {
          return [updatedOrder, ...currentOrders];
        }

        return currentOrders.map((order) =>
          order.order_id === updatedOrder.order_id ? updatedOrder : order,
        );
      });

      if (updatedOrderUi) {
        // Point shared shopper-page navigation at the order that was just
        // updated so My Orders and Trip Detail open on the fresh data next.
        rememberLinkedOrderSelection({
          bucket: updatedOrderUi.bucket,
          date: updatedOrderUi.date,
          orderId: updatedOrderUi.id,
        });
      }

      const availabilityByItemId = new Map(
        (updatedOrder.trip?.items || []).map((tripItem) => [
          String(tripItem.item_id),
          tripItem,
        ]),
      );

      setItems((currentItems) =>
        currentItems
          .map((currentItem) => {
            const updatedItem = availabilityByItemId.get(String(currentItem.itemId));

            if (!updatedItem) {
              return currentItem;
            }

            return {
              ...currentItem,
              totalQuantity: updatedItem.total_quantity,
              claimedQuantity: updatedItem.claimed_quantity,
              availableQuantity: updatedItem.available_quantity,
              unitPrice: updatedItem.price_per_unit || 0,
            };
          })
          .filter((currentItem) => currentItem.availableQuantity > 0),
      );
    }

    setDraftQuantities((current) => ({ ...current, [item.id]: 0 }));
    setClaimMessage(
      response.body?.message === 'Order updated successfully'
        ? `Added ${quantity} ${item.unit} to your order for ${item.name}.`
        : `Created an order for ${quantity} ${item.unit} of ${item.name}.`,
    );
  }

  return {
    items: itemsWithOrderContext,
    draftQuantities,
    isItemFeedLoading,
    itemFeedError,
    claimMessage,
    submittingItemId,
    setItemQuantity,
    handleAddItem,
  };
}
