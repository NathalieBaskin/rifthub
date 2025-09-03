// src/App.jsx
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useEffect } from "react";
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
import ChatPage from "./pages/ChatPage.jsx";
import ThreadPage from "./pages/ThreadPage.jsx";
import AccountDelete from "./pages/AccountDelete.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import ProductDetail from "./pages/ProductDetail.jsx";
import FavoritesPage from "./pages/FavoritesPage.jsx";

export default function App() {
  const location = useLocation();

  // 🔹 Lägg till/ta bort klasser på <body> beroende på route
  useEffect(() => {
    if (location.pathname.startsWith("/chat")) {
      document.body.classList.add("chat-page");
    } else {
      document.body.classList.remove("chat-page");
    }
  }, [location]);

  return (
    <Routes>
      {/* Allt innehåll använder Layout som wrapper (Navbar + ev. Footer där) */}
      <Route element={<Layout />}>
        {/* Startsida */}
        <Route path="/" element={<StartSida />} />

        {/* Forum / Summoners Hall */}
        <Route path="/summoners-hall" element={<SummonersHall />} />

        {/* Shop */}
    <Route path="/shop" element={<LegendsBazaar />} />

<Route path="/shop/product/:id" element={<ProductDetail />} />

        {/* Cart + Checkout */}
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
      <Route path="/favorites" element={<FavoritesPage />} />
        {/* Placeholder för The Rift Tavern */}
        <Route
          path="/forum"
          element={<div className="p-8">Forum (kommer senare)</div>}
        />

        {/* Auth */}
        <Route path="/auth" element={<AuthPage />} />

        {/* Profiler */}
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/:id" element={<ProfilePage />} /> {/* 👈 viktig */}
        <Route path="/profile/edit" element={<EditProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />

        <Route path="/account/delete" element={<AccountDelete />} />

        {/* Admin */}
        <Route path="/admin" element={<AdminDashboard />} />

        {/* Chat */}
        <Route path="/chat" element={<ChatPage />} /> {/* ✅ ny route */}

        {/* Threads */}
        <Route path="/thread/:id" element={<ThreadPage />} />

        {/* 404 fallback */}
        <Route
          path="*"
          element={<div className="p-8">Sidan kunde inte hittas.</div>}
        />
      </Route>
    </Routes>
  );
}
