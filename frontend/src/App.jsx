import { Navigate, Route, Routes } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import MyOrders from "./pages/MyOrders";
import MyTrips from "./pages/MyTrips";
import PostTrip from "./pages/PostTrip";
import Profile from "./pages/Profile";
import Register from "./pages/Register";
import TripDetail from "./pages/TripDetail";
import TripFeed from "./pages/TripFeed";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/trips" element={<TripFeed />} />
      <Route path="/trips/:tripId" element={<TripDetail />} />
      <Route path="/post-trip" element={<PostTrip />} />
      <Route path="/my-orders" element={<MyOrders />} />
      <Route path="/my-trips" element={<MyTrips />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
