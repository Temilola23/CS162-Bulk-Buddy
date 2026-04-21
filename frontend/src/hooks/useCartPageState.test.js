import { act, renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useApi } from '../contexts/ApiProvider';
import { useCart } from '../contexts/CartProvider';
import useCartPageState from './useCartPageState';

jest.mock('../contexts/ApiProvider', () => ({
  useApi: jest.fn(),
}));

jest.mock('../contexts/CartProvider', () => ({
  useCart: jest.fn(),
}));

jest.mock('./usePageScrollProgress', () => () => ({
  isScrolled: false,
  scrollProgress: 0,
}));

function wrapper({ children }) {
  return (
    <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      {children}
    </MemoryRouter>
  );
}

test('checkout creates one order request per driver trip group and clears the cart', async () => {
  const post = jest.fn().mockResolvedValue({ ok: true, status: 201, body: {} });
  const clearCart = jest.fn();
  const removeTripGroup = jest.fn();

  useApi.mockReturnValue({ post });
  useCart.mockReturnValue({
    cart: [
      {
        tripId: '7',
        driverName: 'Driver X',
        items: [
          { id: '10', name: 'Potato', quantity: 1, unitPrice: 3, unit: 'bag' },
          { id: '11', name: 'Beans', quantity: 5, unitPrice: 2, unit: 'bag' },
        ],
      },
      {
        tripId: '8',
        driverName: 'Driver Y',
        items: [
          { id: '20', name: 'Pineapple', quantity: 5, unitPrice: 4, unit: 'each' },
        ],
      },
    ],
    cartLineCount: 11,
    cartSubtotal: 33,
    clearCart,
    removeTripGroup,
  });

  const { result } = renderHook(() => useCartPageState(), { wrapper });

  await act(async () => {
    await result.current.handleCheckout();
  });

  expect(post).toHaveBeenNthCalledWith(1, '/me/orders', {
    trip_id: 7,
    items: [
      { item_id: 10, quantity: 1 },
      { item_id: 11, quantity: 5 },
    ],
  });
  expect(post).toHaveBeenNthCalledWith(2, '/me/orders', {
    trip_id: 8,
    items: [{ item_id: 20, quantity: 5 }],
  });
  expect(clearCart).toHaveBeenCalledTimes(1);
  expect(result.current.checkoutMessage).toBe(
    'Checkout complete for 11 items across 2 driver trips.',
  );
});
