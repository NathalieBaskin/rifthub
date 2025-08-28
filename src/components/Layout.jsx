// src/components/Layout.jsx
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";

export default function Layout() {
  const location = useLocation();
  const isChat = location.pathname.startsWith("/chat");

  return (
    <div className="min-h-screen">
      <Navbar />
      {/* ✅ Gör main transparent på chat-sidan */}
      <main className={isChat ? "pt-20 bg-transparent" : "pt-20"}>
        <Outlet />
      </main>
    </div>
  );
}
