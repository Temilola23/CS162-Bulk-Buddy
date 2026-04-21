import { act, renderHook, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useApi } from '../contexts/ApiProvider';
import useDriverTripsState from '../hooks/useDriverTripsState';

jest.mock('../contexts/ApiProvider', () => ({
  useApi: jest.fn(),
}));

function wrapper({ children }) {
  return (
    <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      {children}
    </MemoryRouter>
  );
}

test('driver trip posting submits trip details and adds the created trip to the page state', async () => {
  const get = jest.fn().mockResolvedValue({ ok: true, status: 200, body: { trips: [] } });
  const post = jest.fn().mockResolvedValue({
    ok: true,
    status: 201,
    body: {
      message: 'Trip created successfully.',
      trip: {
        trip_id: 12,
        store_name: 'Costco',
        pickup_location_text: 'Mission District',
        pickup_time: '2099-04-21T18:30:00',
        status: 'open',
        items: [
          {
            item_id: 30,
            name: 'Kirkland Rice 25lb',
            unit: 'bag',
            total_quantity: 4,
            claimed_quantity: 0,
            available_quantity: 4,
            price_per_unit: 10,
          },
        ],
      },
    },
  });

  useApi.mockReturnValue({ get, post });

  const { result } = renderHook(() => useDriverTripsState(), { wrapper });

  await waitFor(() => expect(result.current.isTripsLoading).toBe(false));

  act(() => {
    result.current.handleTripFieldChange({
      target: { name: 'storeName', value: 'Costco' },
    });
    result.current.handleTripFieldChange({
      target: { name: 'pickupLocationText', value: 'Mission District' },
    });
    result.current.handleTripFieldChange({
      target: { name: 'pickupTime', value: '2099-04-21T18:30' },
    });
    result.current.handleItemFieldChange(0, 'name', 'Kirkland Rice 25lb');
    result.current.handleItemFieldChange(0, 'unit', 'bag');
    result.current.handleItemFieldChange(0, 'totalQuantity', '4');
    result.current.handleItemFieldChange(0, 'pricePerUnit', '10.00');
  });

  await act(async () => {
    await result.current.handleCreateTrip({ preventDefault: jest.fn() });
  });

  expect(post).toHaveBeenCalledWith('/me/trips', {
    store_name: 'Costco',
    pickup_location_text: 'Mission District',
    pickup_time: '2099-04-21T18:30',
    items: [
      {
        name: 'Kirkland Rice 25lb',
        unit: 'bag',
        total_quantity: 4,
        price_per_unit: 10,
      },
    ],
  });
  expect(result.current.driverTrips[0]).toMatchObject({
    id: 12,
    storeName: 'Costco',
    status: 'open',
  });
  expect(result.current.submitMessage).toBe('Trip created successfully.');
});
