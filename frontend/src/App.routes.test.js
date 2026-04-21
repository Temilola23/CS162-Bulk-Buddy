import { render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import App from './App';
import { useSession } from './contexts/SessionProvider';

jest.mock('./contexts/SessionProvider', () => ({
  useSession: jest.fn(),
}));

jest.mock('./hooks/useAppLoader', () => () => ({
  showLoader: false,
  loaderIsLeaving: false,
}));

jest.mock('./components/Landing', () => () => <div>Landing Page</div>);
jest.mock('./components/Login', () => () => <div>Login Page</div>);
jest.mock('./components/Register', () => () => <div>Register Page</div>);
jest.mock('./components/TripFeed', () => () => <div>Trip Feed Page</div>);
jest.mock('./components/ItemFeed', () => () => <div>Item Feed Page</div>);
jest.mock('./components/Cart', () => () => <div>Cart Page</div>);
jest.mock('./components/MyOrders', () => () => <div>My Orders Page</div>);
jest.mock('./components/TripDetail', () => () => <div>Trip Detail Page</div>);
jest.mock('./components/Profile', () => () => <div>Profile Page</div>);
jest.mock('./components/Settings', () => () => <div>Settings Page</div>);
jest.mock('./components/DriverTrips', () => () => <div>Driver Trips Page</div>);
jest.mock('./components/AdminLogin', () => () => <div>Admin Login Page</div>);
jest.mock('./components/AdminRegister', () => () => <div>Admin Register Page</div>);
jest.mock('./components/AdminApplications', () => () => <div>Admin Applications Page</div>);
jest.mock('./components/AdminApplicationReview', () => () => <div>Admin Review Page</div>);

function LocationProbe() {
  const location = useLocation();
  return (
    <output aria-label="current route">
      {`${location.pathname}${location.search}${location.hash}`}
    </output>
  );
}

test('redirects signed-out users from protected pages to login with the original route', () => {
  useSession.mockReturnValue({
    currentUser: null,
    isSessionLoading: false,
  });

  render(
    <MemoryRouter
      future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
      initialEntries={['/profile?section=driver#apply']}
    >
      <App />
      <LocationProbe />
    </MemoryRouter>,
  );

  expect(screen.getByText('Login Page')).toBeInTheDocument();
  expect(screen.getByLabelText('current route')).toHaveTextContent(
    '/login?next=%2Fprofile%3Fsection%3Ddriver%23apply',
  );
});
