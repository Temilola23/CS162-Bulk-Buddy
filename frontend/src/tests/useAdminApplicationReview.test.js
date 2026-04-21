import { act, renderHook, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { useApi } from '../contexts/ApiProvider';
import useAdminApplicationReview from '../hooks/useAdminApplicationReview';

jest.mock('../contexts/ApiProvider', () => ({
  useApi: jest.fn(),
}));

function wrapper({ children }) {
  return (
    <MemoryRouter
      future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
      initialEntries={['/admin-console/driver-applications/5']}
    >
      <Routes>
        <Route
          element={children}
          path="/admin-console/driver-applications/:applicationId"
        />
      </Routes>
    </MemoryRouter>
  );
}

test('admin approval sends the decision and updates the reviewed application status', async () => {
  const get = jest.fn((url) => {
    const bodyByUrl = {
      '/admin/pending': {
        pending_apps: [
          {
            driver_application_id: 5,
            user_id: 99,
            status: 'pending',
            license_info: 'D1234567 | exp 2028-04-12',
            created_at: '2026-03-18T12:00:00',
            updated_at: '2026-03-18T12:00:00',
          },
        ],
      },
      '/admin/approved': { approved_apps: [] },
      '/admin/rejected': { rejected_apps: [] },
    };

    return Promise.resolve({ ok: true, status: 200, body: bodyByUrl[url] });
  });
  const put = jest.fn().mockResolvedValue({ ok: true, status: 200, body: {} });

  useApi.mockReturnValue({ get, put });

  const { result } = renderHook(() => useAdminApplicationReview(), { wrapper });

  await waitFor(() => expect(result.current.isLoading).toBe(false));
  expect(result.current.application.licenseNumber).toBe('D1234567');

  await act(async () => {
    await result.current.handleDecision('approved');
  });

  expect(put).toHaveBeenCalledWith('/admin/decision/5', {
    new_status: 'approved',
  });
  expect(result.current.application.status).toBe('approved');
  expect(result.current.actionMessage).toBe('Application approved.');
});
