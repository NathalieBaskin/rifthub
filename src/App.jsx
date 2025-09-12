// src/App.jsx
import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";

// Layout & gemensamma wrappers
import Layout from "./components/Layout.jsx";

// Publika sidor
import StartSida from "./pages/StartSida.jsx";
import SummonersHall from "./pages/SummonersHall.jsx";
import LegendsBazaar from "./pages/LegendsBazaar.jsx";
import ProductDetail from "./pages/ProductDetail.jsx";
import Cart from "./pages/Cart.jsx";
import Checkout from "./pages/Checkout.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import FavoritesPage from "./pages/FavoritesPage.jsx";

// Profilsidor
import ProfilePage from "./pages/ProfilePage.jsx";
import EditProfilePage from "./pages/EditProfilePage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import AccountDelete from "./pages/AccountDelete.jsx";

// Admin & Community
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import ChatPage from "./pages/ChatPage.jsx";
import ThreadPage from "./pages/ThreadPage.jsx";

// Medlems-gate
import RequireAuth from "./components/RequireAuth.jsx";

// Tavern (kräver inloggning)
import TavernPage from "./pages/TavernPage.jsx";
import GoLivePage from "./pages/GoLivePage.jsx";
import WatchStreamPage from "./pages/WatchStreamPage.jsx";

export default function App() {
  const location = useLocation();

  useEffect(() => {
    // Hantera chat-body-classen
    if (location.pathname.startsWith("/chat")) {
      document.body.classList.add("chat-page");
    } else {
      document.body.classList.remove("chat-page");
    }

    // Scrolla alltid till toppen på ny sida
    window.scrollTo(0, 0);
  }, [location]);

  return (
    <Routes>
      {/* Allt innehåll använder Layout som wrapper (Navbar + Footer) */}
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

        {/* Favorites */}
        <Route path="/favorites" element={<FavoritesPage />} />

        {/* Tavern – kräver inloggning */}
        <Route
          path="/tavern"
          element={
            <RequireAuth>
              <TavernPage />
            </RequireAuth>
          }
        />
        <Route
          path="/tavern/live"
          element={
            <RequireAuth>
              <GoLivePage />
            </RequireAuth>
          }
        />
        <Route
          path="/tavern/watch/:streamId"
          element={
            <RequireAuth>
              <WatchStreamPage />
            </RequireAuth>
          }
        />

        {/* Auth */}
        <Route path="/auth" element={<AuthPage />} />

        {/* Profiler */}
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/:id" element={<ProfilePage />} />
        <Route path="/profile/edit" element={<EditProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/account/delete" element={<AccountDelete />} />

        {/* Admin */}
        <Route path="/admin" element={<AdminDashboard />} />

        {/* Chat */}
        <Route path="/chat" element={<ChatPage />} />

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
