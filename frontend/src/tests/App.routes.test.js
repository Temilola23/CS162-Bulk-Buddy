import { render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import App from '../App';
import { useSession } from '../contexts/SessionProvider';

jest.mock('../contexts/SessionProvider', () => ({
  useSession: jest.fn(),
}));

jest.mock('../hooks/useAppLoader', () => () => ({
  showLoader: false,
  loaderIsLeaving: false,
}));

jest.mock('../pages/Landing', () => () => <div>Landing Page</div>);
jest.mock('../pages/Login', () => () => <div>Login Page</div>);
jest.mock('../pages/Register', () => () => <div>Register Page</div>);
jest.mock('../pages/TripFeed', () => () => <div>Trip Feed Page</div>);
jest.mock('../pages/ItemFeed', () => () => <div>Item Feed Page</div>);
jest.mock('../pages/Cart', () => () => <div>Cart Page</div>);
jest.mock('../pages/MyOrders', () => () => <div>My Orders Page</div>);
jest.mock('../pages/TripDetail', () => () => <div>Trip Detail Page</div>);
jest.mock('../pages/Profile', () => () => <div>Profile Page</div>);
jest.mock('../pages/Settings', () => () => <div>Settings Page</div>);
jest.mock('../pages/DriverTrips', () => () => <div>Driver Trips Page</div>);
jest.mock('../pages/AdminLogin', () => () => <div>Admin Login Page</div>);
jest.mock('../pages/AdminRegister', () => () => <div>Admin Register Page</div>);
jest.mock('../pages/AdminApplications', () => () => <div>Admin Applications Page</div>);
jest.mock('../pages/AdminApplicationReview', () => () => <div>Admin Review Page</div>);

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
