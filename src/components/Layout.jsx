import { Outlet } from "react-router-dom";
import Navbar from "./Navbar.jsx";

export default function Layout() {
  return (
    <>
      <header data-nav>
        <Navbar />
      </header>
      <main>
        <Outlet />
      </main>
    </>
  );
}
