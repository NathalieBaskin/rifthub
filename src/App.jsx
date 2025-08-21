// src/App.jsx
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import StartSida from "./pages/StartSida.jsx";
import Forum from "./pages/Forum.jsx";
import Champions from "./pages/Champions.jsx";
import SummonersHall from "./pages/SummonersHall.jsx";

export default function App() {
  return (
      <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<StartSida />} />
        <Route path="/forum" element={<Forum />} />
        <Route path="/champions" element={<Champions />} />
        <Route path="/summoners-hall" element={<SummonersHall />} />
        <Route path="*" element={<div className="p-8">Sidan kunde inte hittas.</div>} />
      </Route>
    </Routes>
  );
}
