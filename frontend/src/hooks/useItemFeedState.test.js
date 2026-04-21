import { act, renderHook, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useApi } from '../contexts/ApiProvider';
import { useSession } from '../contexts/SessionProvider';
import useItemFeedState from './useItemFeedState';

jest.mock('../contexts/ApiProvider', () => ({
  useApi: jest.fn(),
}));

jest.mock('../contexts/SessionProvider', () => ({
  useSession: jest.fn(),
}));

const tripPayload = {
  trip_id: 7,
  store_name: 'Costco',
  pickup_time: '2099-04-21T18:30:00',
  pickup_location_text: 'Mission District',
  pickup_lat: 37.7599,
  pickup_lng: -122.4148,
  status: 'open',
  driver: { full_name: 'Driver X' },
  items: [
    {
      item_id: 10,
      name: 'banana',
      unit: 'bunch',
      total_quantity: 5,
      claimed_quantity: 3,
      available_quantity: 2,
      price_per_unit: 2,
    },
  ],
};

function wrapper({ children }) {
  return (
    <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      {children}
    </MemoryRouter>
  );
}

beforeEach(() => {
  window.localStorage.clear();
});

test('adding from Item Feed updates an existing order and remembers that order for My Orders', async () => {
  const get = jest.fn((url) => {
    if (url === '/inventory') {
      return Promise.resolve({
        ok: true,
        status: 200,
        body: {
          items: [
            {
              item_id: 10,
              name: 'banana',
              unit: 'bunch',
              total_quantity: 5,
              claimed_quantity: 2,
              available_quantity: 3,
              price_per_unit: 2,
              trip: tripPayload,
            },
          ],
        },
      });
    }

    if (url === '/me/orders') {
      return Promise.resolve({
        ok: true,
        status: 200,
        body: {
          orders: [
            {
              order_id: 22,
              trip_id: 7,
              status: 'claimed',
              trip: tripPayload,
              order_items: [{ order_item_id: 100, item_id: 10, quantity: 2 }],
            },
          ],
        },
      });
    }

    return Promise.resolve({ ok: false, status: 404, body: { message: 'Not found' } });
  });
  const post = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    body: {
      message: 'Order updated successfully',
      order: {
        order_id: 22,
        trip_id: 7,
        status: 'claimed',
        trip: tripPayload,
        order_items: [{ order_item_id: 100, item_id: 10, quantity: 3 }],
      },
    },
  });

  useApi.mockReturnValue({ get, post });
  useSession.mockReturnValue({
    currentUser: {
      email: 'shopper@example.com',
      full_name: 'Shopper One',
      latitude: 37.7599,
      longitude: -122.4148,
    },
    isSessionLoading: false,
  });

  const { result } = renderHook(() => useItemFeedState(), { wrapper });

  await waitFor(() => expect(result.current.isItemFeedLoading).toBe(false));
  expect(result.current.items[0].existingQuantity).toBe(2);

  act(() => {
    result.current.setItemQuantity('10', 1, 3);
  });

  await act(async () => {
    await result.current.handleAddItem(result.current.items[0]);
  });

  expect(post).toHaveBeenCalledWith('/me/orders', {
    trip_id: 7,
    items: [{ item_id: 10, quantity: 1 }],
  });
  expect(result.current.claimMessage).toBe(
    'Added 1 bunch to your order for banana.',
  );
  expect(window.localStorage.getItem('bulk-buddy-linked-order-selection')).toContain(
    '"orderId":"22"',
  );
});
