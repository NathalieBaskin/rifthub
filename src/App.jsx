// src/App.jsx
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import StartSida from "./pages/startsida.jsx";

import SummonersHall from "./pages/SummonersHall.jsx";
import LegendsBazaar from "./pages/LegendsBazaar.jsx";

export default function App() {
  return (
    <Routes>
      {/* Allt innehåll använder Layout som wrapper (Navbar + ev. Footer där) */}
      <Route element={<Layout />}>
        {/* Startsida */}
        <Route path="/" element={<StartSida />} />

        {/* Forum / Summoners hall */}
        <Route path="/summoners-hall" element={<SummonersHall />} />
        <Route path="/champions" element={<LegendsBazaar />} />

        {/* Enkla placeholders för sidor du inte byggt än */}
        <Route
          path="/forum"
          element={<div className="p-8">Forum (kommer senare)</div>}
        />

        {/* Fångar upp alla andra routes */}
        <Route
          path="*"
          element={<div className="p-8">Sidan kunde inte hittas.</div>}
        />
      </Route>
    </Routes>
  );
}
