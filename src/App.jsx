// src/App.jsx
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import StartSida from "./pages/StartSida.jsx";
import SummonersHall from "./pages/SummonersHall.jsx";
import LegendsBazaar from "./pages/LegendsBazaar.jsx";
import Cart from "./pages/Cart.jsx";        // 👈 importera Cart
import Checkout from "./pages/Checkout.jsx"; // 👈 importera Checkout
import AuthPage from "./pages/AuthPage.jsx";
import MyPage from "./pages/ProfilePage.jsx";

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
    <Route path="/auth" element={<AuthPage />} />
<Route path="/profile" element={<MyPage />} />

        {/* Fångar upp alla andra routes */}
        <Route
          path="*"
          element={<div className="p-8">Sidan kunde inte hittas.</div>}
        />
      </Route>
    </Routes>
  );
}
