import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import StartSida from "./pages/StartSida.jsx";
import SummonersHall from "./pages/SummonersHall.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<StartSida />} />
        <Route path="/summoners-hall" element={<SummonersHall />} />
        {/* Enkla placeholders för länkar som inte är byggda ännu */}
        <Route
          path="/forum"
          element={<div className="p-8">Forum (kommer senare)</div>}
        />
        
        <Route
          path="*"
          element={<div className="p-8">Sidan kunde inte hittas.</div>}
        />
      </Route>
    </Routes>
  );
}
