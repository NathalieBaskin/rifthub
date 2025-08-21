// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar.jsx";
import StartSida from "/pages/StartSida.jsx";
import SummonersHall from "./pages/SummonersHall.jsx";
// (valfritt) om du har en Footer-komponent kan du avkommentera nästa rad
// import Footer from "./components/Footer.jsx";

export default function App() {
  return (
    <BrowserRouter>
      {/* Navbar alltid överst */}
      <Navbar />

      {/* Sidinnehåll */}
      <main style={{ minHeight: "100vh" }}>
        <Routes>
          <Route path="/" element={<StartSida />} />
          <Route path="/summoners-hall" element={<SummonersHall />} />

          {/* Enkla placeholders för länkar som inte är byggda ännu */}
          <Route
            path="/forum"
            element={<div className="p-8">Forum (kommer senare)</div>}
          />

          {/* 404 */}
          <Route
            path="*"
            element={<div className="p-8">Sidan kunde inte hittas.</div>}
          />
        </Routes>
      </main>

      {/* Lägg gärna Footer här om du vill att den syns på alla sidor */}
      {/* <Footer /> */}
    </BrowserRouter>
  );
}
