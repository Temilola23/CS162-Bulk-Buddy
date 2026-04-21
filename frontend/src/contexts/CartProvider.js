import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useSession } from './SessionProvider';
import {
  enrichCartGroups,
  getCartLineCount,
  getCartSubtotal,
  mergeCartGroups,
} from '../utils/tripFeed';

const CartContext = createContext(undefined);

export function CartProvider({ children }) {
  const { currentUser } = useSession();
  const [cartGroups, setCartGroups] = useState([]);

  useEffect(() => {
    // Keep cart state tied to the signed-in shopper so a logout/login swap
    // cannot leak one person's pending selections into another session.
    setCartGroups([]);
  }, [currentUser?.email]);

  const cart = useMemo(() => enrichCartGroups(cartGroups), [cartGroups]);
  const cartLineCount = useMemo(() => getCartLineCount(cart), [cart]);
  const cartSubtotal = useMemo(() => getCartSubtotal(cart), [cart]);

  const addTripItems = useCallback((selectedTrip, chosenItems) => {
    if (!selectedTrip || chosenItems.length === 0) {
      return;
    }

    setCartGroups((currentCart) =>
      mergeCartGroups(currentCart, selectedTrip, chosenItems),
    );
  }, []);

  const removeTripGroup = useCallback((tripId) => {
    setCartGroups((currentCart) =>
      currentCart.filter((tripGroup) => String(tripGroup.tripId) !== String(tripId)),
    );
  }, []);

  const clearCart = useCallback(() => {
    setCartGroups([]);
  }, []);

  const value = useMemo(
    () => ({
      cart,
      cartLineCount,
      cartSubtotal,
      addTripItems,
      removeTripGroup,
      clearCart,
    }),
    [addTripItems, cart, cartLineCount, cartSubtotal, clearCart, removeTripGroup],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
