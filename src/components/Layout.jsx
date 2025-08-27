// src/components/Layout.jsx
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

export default function Layout() {
  return (
    <div className="min-h-screen">
      <Navbar />
      {/* ✅ Lägg till padding-top så allt hamnar under nav-baren */}
      <main className="pt-20">  
        <Outlet />
      </main>
    </div>
  );
}
