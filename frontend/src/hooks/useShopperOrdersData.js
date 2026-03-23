import { useEffect, useMemo, useState } from 'react';
import { useApi } from '../contexts/ApiProvider';
import { useSession } from '../contexts/SessionProvider';
import { shopperLocation } from '../data/tripFeedData';
import { mapApiOrdersToUi } from '../utils/orderApiAdapters';
import { getShopperLocationFromUser } from '../utils/tripApiAdapters';

export default function useShopperOrdersData() {
  const api = useApi();
  const { currentUser, isSessionLoading } = useSession();
  const [orders, setOrders] = useState([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState('');

  const shopperLocationForOrders = useMemo(
    () => getShopperLocationFromUser(currentUser, shopperLocation),
    [currentUser],
  );

  useEffect(() => {
    async function fetchOrders() {
      if (isSessionLoading) {
        return;
      }

      if (!currentUser) {
        setOrders([]);
        setIsOrdersLoading(false);
        return;
      }

      setIsOrdersLoading(true);
      const response = await api.get('/me/orders');

      if (!response.ok) {
        if (response.status === 401) {
          window.location.assign('/login');
          return;
        }

        setOrders([]);
        setOrdersError(response.body?.message || 'Unable to load orders.');
        setIsOrdersLoading(false);
        return;
      }

      setOrders(mapApiOrdersToUi(response.body?.orders || [], shopperLocationForOrders));
      setOrdersError('');
      setIsOrdersLoading(false);
    }

    fetchOrders();
  }, [api, currentUser, isSessionLoading, shopperLocationForOrders]);

  return {
    orders,
    isOrdersLoading,
    ordersError,
  };
}
