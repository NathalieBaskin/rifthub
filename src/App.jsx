// src/App.jsx
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import StartSida from "./pages/StartSida.jsx";
import SummonersHall from "./pages/SummonersHall.jsx";
import LegendsBazaar from "./pages/LegendsBazaar.jsx";
import Cart from "./pages/Cart.jsx";
import Checkout from "./pages/Checkout.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import EditProfilePage from "./pages/EditProfilePage.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";

export default function App() {
  return (
    <Routes>
      {/* Allt innehåll använder Layout som wrapper (Navbar + ev. Footer där) */}
      <Route element={<Layout />}>
        {/* Startsida */}
        <Route path="/" element={<StartSida />} />

        {/* Forum / Summoners Hall */}
        <Route path="/summoners-hall" element={<SummonersHall />} />

        {/* Shop */}
        <Route path="/champions" element={<LegendsBazaar />} />

        {/* Cart + Checkout */}
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />

        {/* Placeholder för The Rift Tavern */}
        <Route
          path="/forum"
          element={<div className="p-8">Forum (kommer senare)</div>}
        />

        {/* Auth */}
        <Route path="/auth" element={<AuthPage />} />

        {/* Profiler */}
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/:id" element={<ProfilePage />} />  {/* 👈 LÄGG TILL DENNA */}
        <Route path="/profile/edit" element={<EditProfilePage />} />

        {/* Admin */}
        <Route path="/admin" element={<AdminDashboard />} />

        {/* 404 fallback */}
        <Route
          path="*"
          element={<div className="p-8">Sidan kunde inte hittas.</div>}
        />
      </Route>
    </Routes>
  );
}
