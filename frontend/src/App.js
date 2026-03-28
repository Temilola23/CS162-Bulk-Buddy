import { useEffect } from 'react';
import Landing from './components/Landing';
import Login from './components/Login';
import Register from './components/Register';
import TripFeed from './components/TripFeed';
import MyOrders from './components/MyOrders';
import TripDetail from './components/TripDetail';
import Profile from './components/Profile';
import Settings from './components/Settings';
import { useSession } from './contexts/SessionProvider';
import { buildAuthRedirectUrl } from './hooks/usePostAuthRedirect';
import useAppLoader, { getCurrentPathname } from './hooks/useAppLoader';
import './App.css';

const PROTECTED_PATHS = new Set([
  '/trip-feed',
  '/trips',
  '/my-orders',
  '/trip-detail',
  '/profile',
  '/settings',
]);

function isProtectedPathname(pathname) {
  return PROTECTED_PATHS.has(pathname);
}

function App() {
  const { showLoader, loaderIsLeaving } = useAppLoader();
  const { currentUser, isSessionLoading } = useSession();

  // Keep routing lightweight for now by mapping views directly from the URL path
  // instead of introducing a router dependency during the prototype phase.
  const pathname = getCurrentPathname();
  const routeRequiresAuth = isProtectedPathname(pathname);
  const shouldRedirectToLogin = routeRequiresAuth && !isSessionLoading && !currentUser;
  const shouldHoldProtectedRoute = routeRequiresAuth && isSessionLoading && !currentUser;
  // Capture the protected destination before swapping the rendered page to
  // Login so the submit handler can send the shopper back to the same route.
  const requestedPath =
    shouldRedirectToLogin && typeof window !== 'undefined'
      ? `${window.location.pathname}${window.location.search}${window.location.hash}`
      : null;
  const resolvedPathname = shouldRedirectToLogin ? '/login' : pathname;
  let pageContent = shouldHoldProtectedRoute ? null : <Landing />;

  useEffect(() => {
    if (!shouldRedirectToLogin || pathname === '/login') {
      return;
    }

    // Replace the URL so protected routes cannot be browsed directly without
    // an authenticated session. The login screen becomes the canonical route.
    window.history.replaceState(null, '', buildAuthRedirectUrl(requestedPath));
  }, [pathname, requestedPath, shouldRedirectToLogin]);

  if (resolvedPathname === '/login') {
    pageContent = <Login pendingRedirectPath={requestedPath} />;
  }

  if (resolvedPathname === '/register') {
    pageContent = <Register />;
  }

  if (resolvedPathname === '/trip-feed' || resolvedPathname === '/trips') {
    pageContent = <TripFeed />;
  }

  if (resolvedPathname === '/my-orders') {
    pageContent = <MyOrders />;
  }

  if (resolvedPathname === '/trip-detail') {
    pageContent = <TripDetail />;
  }

  if (resolvedPathname === '/profile') {
    pageContent = <Profile />;
  }

  if (resolvedPathname === '/settings') {
    pageContent = <Settings />;
  }

  return (
    <>
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
    </>
  );
}

export default App;
