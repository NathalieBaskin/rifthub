import { NavLink, Link } from "react-router-dom";

export default function Navbar() {
  return (
    <header className="bg-white shadow sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-lg font-extrabold tracking-wide">
          RIFT HUB
        </Link>

        {/* Desktop-nav */}
        <nav className="hidden md:flex gap-6 text-sm">
          <NavLink
            to="/summoners-hall"
            className={({ isActive }) =>
              `hover:text-blue-600 ${isActive ? "text-blue-600 font-semibold" : ""}`
            }
          >
            Summoner&apos;s Hall
          </NavLink>
          <NavLink
            to="/forum"
            className={({ isActive }) =>
              `hover:text-blue-600 ${isActive ? "text-blue-600 font-semibold" : ""}`
            }
          >
            The Rift Tavern
          </NavLink>
          <NavLink
            to="/champions"
            className={({ isActive }) =>
              `hover:text-blue-600 ${isActive ? "text-blue-600 font-semibold" : ""}`
            }
          >
            Legends Browser
          </NavLink>
        </nav>

        {/* Mobile burger (kan kopplas till off-canvas senare) */}
        <button className="md:hidden p-2 rounded hover:bg-gray-200" aria-label="Open menu">
          ☰
        </button>
      </div>
    </header>
  );
}
