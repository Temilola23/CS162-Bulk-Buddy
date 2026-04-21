import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApi } from '../contexts/ApiProvider';
import { useCart } from '../contexts/CartProvider';
import { buildAuthRedirectUrl } from './usePostAuthRedirect';
import usePageScrollProgress from './usePageScrollProgress';

/**
 * Provides cart totals and checkout behavior for the cart page.
 */
export default function useCartPageState() {
  const api = useApi();
  const navigate = useNavigate();
  const location = useLocation();
  const { isScrolled, scrollProgress } = usePageScrollProgress();
  const { cart, cartLineCount, cartSubtotal, clearCart, removeTripGroup } = useCart();
  const [checkoutMessage, setCheckoutMessage] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  async function handleCheckout() {
    if (cart.length === 0) {
      setCheckoutMessage('Your cart is empty.');
      return;
    }

    if (isCheckingOut) {
      return;
    }

    setIsCheckingOut(true);
    setCheckoutMessage('');

    const responses = await Promise.all(
      cart.map((tripGroup) =>
        api.post('/me/orders', {
          trip_id: Number(tripGroup.tripId),
          items: tripGroup.items.map((item) => ({
            item_id: Number(item.id),
            quantity: item.quantity,
          })),
        }),
      ),
    );

    const unauthorizedResponse = responses.find((response) => response.status === 401);
    if (unauthorizedResponse) {
      setIsCheckingOut(false);
      const requestedPath = `${location.pathname}${location.search}${location.hash}`;
      navigate(buildAuthRedirectUrl(requestedPath), { replace: true });
      return;
    }

    const failedResponse = responses.find((response) => !response.ok);
    if (failedResponse) {
      setCheckoutMessage(failedResponse.body?.message || 'Checkout failed.');
      setIsCheckingOut(false);
      return;
    }

    clearCart();
    setCheckoutMessage(
      `Checkout complete for ${cartLineCount} items across ${cart.length} driver trips.`,
    );
    setIsCheckingOut(false);
  }

  return {
    isScrolled,
    scrollProgress,
    cart,
    cartLineCount,
    cartSubtotal,
    checkoutMessage,
    isCheckingOut,
    removeTripGroup,
    handleCheckout,
  };
}
