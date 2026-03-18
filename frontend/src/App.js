import Landing from './components/Landing';
import Login from './components/Login';
import Register from './components/Register';
import TripFeed from './components/TripFeed';
import MyOrders from './components/MyOrders';
import TripDetail from './components/TripDetail';
import Profile from './components/Profile';
import Settings from './components/Settings';
import './App.css';

function App() {
  // Keep routing lightweight for now by mapping views directly from the URL path
  // instead of introducing a router dependency during the prototype phase.
  const pathname = window.location.pathname.replace(/\/+$/, '') || '/';

  if (pathname === '/login') {
    return (
      <div className="app-root">
        <Login />
      </div>
    );
  }

  if (pathname === '/register') {
    return (
      <div className="app-root">
        <Register />
      </div>
    );
  }

  if (pathname === '/trip-feed' || pathname === '/trips') {
    return (
      <div className="app-root">
        <TripFeed />
      </div>
    );
  }

  if (pathname === '/my-orders') {
    return (
      <div className="app-root">
        <MyOrders />
      </div>
    );
  }

  if (pathname === '/trip-detail') {
    return (
      <div className="app-root">
        <TripDetail />
      </div>
    );
  }

  if (pathname === '/profile') {
    return (
      <div className="app-root">
        <Profile />
      </div>
    );
  }

  if (pathname === '/settings') {
    return (
      <div className="app-root">
        <Settings />
      </div>
    );
  }

  return (
    <div className="app-root">
      <Landing />
    </div>
  );
}

export default App;
