import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApi } from '../contexts/ApiProvider';
import { useSession } from '../contexts/SessionProvider';
import { shopperLocation } from '../data/tripFeedData';
import { buildAuthRedirectUrl } from './usePostAuthRedirect';
import { mapApiOrdersToUi } from '../utils/orderApiAdapters';
import { getShopperLocationFromUser } from '../utils/tripApiAdapters';

export default function useShopperOrdersData() {
  const api = useApi();
  const { currentUser, isSessionLoading } = useSession();
  const location = useLocation();
  const navigate = useNavigate();
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
          const requestedPath = `${location.pathname}${location.search}${location.hash}`;
          navigate(buildAuthRedirectUrl(requestedPath), { replace: true });
          return;
        }

        setOrders([]);
        setOrdersError(response.body?.message || 'Unable to load orders.');
        setIsOrdersLoading(false);
        return;
      }

      // Backend order payloads are normalized into the UI shape once here so
      // My Orders and Trip Detail can stay mostly presentational.
      setOrders(mapApiOrdersToUi(response.body?.orders || [], shopperLocationForOrders));
      setOrdersError('');
      setIsOrdersLoading(false);
    }

    fetchOrders();
  }, [api, currentUser, isSessionLoading, location.hash, location.pathname, location.search, navigate, shopperLocationForOrders]);

  return {
    orders,
    isOrdersLoading,
    ordersError,
  };
}
