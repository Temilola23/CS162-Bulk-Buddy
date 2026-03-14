import Landing from './components/Landing';
import Login from './components/Login';
import Register from './components/Register';
import TripFeed from './components/TripFeed';
import './App.css';

function App() {
  // Keep routing lightweight for now by mapping views directly from the URL path.
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

  return (
    <div className="app-root">
      <Landing />
    </div>
  );
}

export default App;
