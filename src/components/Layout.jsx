// src/components/Layout.jsx
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function Layout() {
  const location = useLocation();
  const isChat = location.pathname.startsWith("/chat");

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main
        className={`flex-1 pt-20 ${
          isChat ? "bg-transparent" : ""
        } pb-16 sm:pb-0`} // padding bara i mobil för fixed footer
      >
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
