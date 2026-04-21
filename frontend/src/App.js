import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import TripFeed from './pages/TripFeed';
import ItemFeed from './pages/ItemFeed';
import Cart from './pages/Cart';
import MyOrders from './pages/MyOrders';
import TripDetail from './pages/TripDetail';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import DriverTrips from './pages/DriverTrips';
import AdminLogin from './pages/AdminLogin';
import AdminRegister from './pages/AdminRegister';
import AdminApplications from './pages/AdminApplications';
import AdminApplicationReview from './pages/AdminApplicationReview';
import ErrorBoundary from './components/ErrorBoundary';
import { useSession } from './contexts/SessionProvider';
import { buildAuthRedirectUrl } from './hooks/usePostAuthRedirect';
import { buildAdminAuthRedirectUrl } from './hooks/useAdminPostAuthRedirect';
import useAppLoader from './hooks/useAppLoader';
import './App.css';

/**
 * Guards shopper-facing routes and redirects signed-out users to login.
 */
function ProtectedRoute() {
  const { currentUser, isSessionLoading } = useSession();
  const location = useLocation();

  // Hold protected pages until the session check finishes, then bounce
  // unauthenticated visitors to login with the route they originally requested.
  if (isSessionLoading && !currentUser) {
    return null;
  }

  if (!currentUser) {
    const requestedPath = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate replace to={buildAuthRedirectUrl(requestedPath)} />;
  }

  return <Outlet />;
}

/**
 * Guards admin routes so only authenticated admin users can view them.
 */
function AdminRoute() {
  const { currentUser, isSessionLoading } = useSession();
  const location = useLocation();

  if (isSessionLoading && !currentUser) {
    return null;
  }

  if (!currentUser) {
    const requestedPath = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate replace to={buildAdminAuthRedirectUrl(requestedPath)} />;
  }

  if (currentUser.role !== 'admin') {
    return <Navigate replace to="/" />;
  }

  return <Outlet />;
}

/**
 * Guards driver-only pages and sends unapproved shoppers back to profile.
 */
function DriverRoute() {
  const { currentUser, isSessionLoading } = useSession();
  const location = useLocation();

  if (isSessionLoading && !currentUser) {
    return null;
  }

  if (!currentUser) {
    const requestedPath = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate replace to={buildAuthRedirectUrl(requestedPath)} />;
  }

  // Drivers get a dedicated trip-posting surface; shoppers should be sent back
  // to profile where the approval state explains why posting is unavailable.
  if (currentUser.role !== 'driver') {
    return <Navigate replace to="/profile" />;
  }

  return <Outlet />;
}

/**
 * Defines the app route tree and global loading overlay.
 */
function App() {
  const { showLoader, loaderIsLeaving } = useAppLoader();
  const pageContent = (
    <Routes>
      <Route element={<Landing />} path="/" />
      <Route element={<Login />} path="/login" />
      <Route element={<Register />} path="/register" />
      <Route element={<AdminLogin />} path="/admin-console/login" />
      <Route element={<AdminRegister />} path="/admin-console/register" />

      <Route element={<ProtectedRoute />}>
        <Route element={<Navigate replace to="/trip-feed" />} path="/trips" />
        <Route element={<TripFeed />} path="/trip-feed" />
        <Route element={<ItemFeed />} path="/item-feed" />
        <Route element={<Cart />} path="/cart" />
        <Route element={<MyOrders />} path="/my-orders" />
        <Route element={<TripDetail />} path="/trip-detail" />
        <Route element={<Profile />} path="/profile" />
        <Route element={<Settings />} path="/settings" />
      </Route>

      <Route element={<DriverRoute />}>
        <Route element={<DriverTrips />} path="/post-trip" />
      </Route>

      <Route element={<AdminRoute />}>
        <Route
          element={<Navigate replace to="/admin-console/driver-applications" />}
          path="/admin-console"
        />
        <Route
          element={<AdminApplications />}
          path="/admin-console/driver-applications"
        />
        <Route
          element={<AdminApplicationReview />}
          path="/admin-console/driver-applications/:applicationId"
        />
      </Route>

      <Route element={<Navigate replace to="/" />} path="*" />
    </Routes>
  );

  return (
    <ErrorBoundary>
      <div className={`app-root ${showLoader ? 'is-loading' : 'is-ready'}`.trim()}>{pageContent}</div>

      {showLoader ? (
        <div
          aria-label="Loading Bulk Buddy"
          className={`app-loader ${loaderIsLeaving ? 'is-leaving' : ''}`.trim()}
          role="status"
        >
          <div className="app-loader-scene">
            <img
              alt="Bulk Buddy logo"
              className="app-loader-logo"
              src="/images/logo-main1.png"
            />

            <svg className="app-loader-car" viewBox="0 0 102 40" xmlns="http://www.w3.org/2000/svg">
              <g
                fill="none"
                fillRule="evenodd"
                stroke="#4d216a"
                strokeLinecap="round"
                strokeLinejoin="round"
                transform="translate(2 1)"
              >
                <path
                  className="app-loader-car__body"
                  d="M47.293 2.375C52.927.792 54.017.805 54.017.805c2.613-.445 6.838-.337 9.42.237l8.381 1.863c2.59.576 6.164 2.606 7.98 4.531l6.348 6.732 6.245 1.877c3.098.508 5.609 3.431 5.609 6.507v4.206c0 .29-2.536 4.189-5.687 4.189H36.808c-2.655 0-4.34-2.1-3.688-4.67 0 0 3.71-19.944 14.173-23.902zM36.5 15.5h54.01"
                  strokeWidth="3"
                />
                <ellipse
                  className="app-loader-car__wheel--left"
                  cx="83.493"
                  cy="30.25"
                  fill="#fff"
                  rx="6.922"
                  ry="6.808"
                  strokeWidth="3.2"
                />
                <ellipse
                  className="app-loader-car__wheel--right"
                  cx="46.511"
                  cy="30.25"
                  fill="#fff"
                  rx="6.922"
                  ry="6.808"
                  strokeWidth="3.2"
                />
                <path
                  className="app-loader-car__line app-loader-car__line--top"
                  d="M22.5 16.5H2.475"
                  strokeWidth="3"
                />
                <path
                  className="app-loader-car__line app-loader-car__line--middle"
                  d="M20.5 23.5H.4755"
                  strokeWidth="3"
                />
                <path
                  className="app-loader-car__line app-loader-car__line--bottom"
                  d="M25.5 9.5h-19"
                  strokeWidth="3"
                />
              </g>
            </svg>
          </div>
        </div>
      ) : null}
    </ErrorBoundary>
  );
}

export default App;
