import { useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from '../contexts/SessionProvider';

export default function useShopperHeaderState() {
  const [menuOpen, setMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const { currentUser } = useSession();

  // Header links keep the current linked order context so My Orders and Trip Detail
  // open on the same selected day/order the shopper was already viewing.
  const navItems = useMemo(
    () => {
      const items = [
        { id: 'trip-feed', label: 'Trip Feed', to: '/trip-feed' },
        { id: 'my-orders', label: 'My Orders', to: '/my-orders' },
        { id: 'trip-detail', label: 'Trip Detail', to: '/trip-detail' },
      ];

      if (currentUser?.role === 'driver') {
        items.push({ id: 'post-trip', label: 'Post Trip', to: '/post-trip' });
      }

      return items;
    },
    [currentUser],
  );

  useEffect(() => {
    function handlePointerDown(event) {
      // Close the menu when the click lands anywhere outside the profile shell.
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);

    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  function toggleMenu() {
    // Keep the component API simple by exposing one toggle instead of raw setState.
    setMenuOpen((current) => !current);
  }

  return {
    menuOpen,
    profileMenuRef,
    navItems,
    toggleMenu,
  };
}
