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
const CART_STORAGE_KEY = 'bulk-buddy-cart-groups';

function readStoredCarts() {
  try {
    return JSON.parse(window.sessionStorage.getItem(CART_STORAGE_KEY) || '{}');
  } catch (error) {
    return {};
  }
}

function readStoredCartForUser(userEmail) {
  if (!userEmail) {
    return [];
  }

  return readStoredCarts()[userEmail] || [];
}

function writeStoredCartForUser(userEmail, cartGroups) {
  if (!userEmail) {
    return;
  }

  const storedCarts = readStoredCarts();
  storedCarts[userEmail] = cartGroups;
  window.sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(storedCarts));
}

export function CartProvider({ children }) {
  const { currentUser, isSessionLoading } = useSession();
  const userEmail = currentUser?.email || '';
  const [cartGroups, setCartGroups] = useState([]);
  const [hydratedUserEmail, setHydratedUserEmail] = useState(null);

  useEffect(() => {
    if (isSessionLoading) {
      return;
    }

    // Restore the current shopper's cart after reloads while keeping carts
    // isolated per signed-in account inside the same browser session.
    setCartGroups(readStoredCartForUser(userEmail));
    setHydratedUserEmail(userEmail);
  }, [isSessionLoading, userEmail]);

  useEffect(() => {
    // Wait until the active shopper's cart has been restored before writing
    // back to storage, otherwise the initial empty state can wipe the cart.
    if (isSessionLoading || hydratedUserEmail !== userEmail) {
      return;
    }

    // Persist every cart change so a page refresh does not wipe pending items.
    writeStoredCartForUser(userEmail, cartGroups);
  }, [cartGroups, hydratedUserEmail, isSessionLoading, userEmail]);

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
