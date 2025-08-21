import { useEffect, useState } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import rifthubLogo from "../assets/images/rifthub.png"; // stora loggan
import rLogo from "../assets/images/r-logo.png";        // lilla loggan

const linkBase =
  "px-3 py-1.5 rounded-md border border-rift-gold/25 bg-rift-card/60 hover:bg-rift-card text-sm transition";
const active = "text-rift-gold drop-shadow-glow border-rift-gold/50";

function NavLinks({ className = "" }) {
  return (
    <nav className={`flex gap-5 ${className}`}>
      <NavLink
        to="/summoners-hall"
        className={({ isActive }) => `${linkBase} ${isActive ? active : ""}`}
      >
        Summoner&apos;s Hall
      </NavLink>
      <NavLink
        to="/forum"
        className={({ isActive }) => `${linkBase} ${isActive ? active : ""}`}
      >
        The Rift Tavern
      </NavLink>
      <NavLink
        to="/champions"
        className={({ isActive }) => `${linkBase} ${isActive ? active : ""}`}
      >
        Legends Bazaar
      </NavLink>
    </nav>
  );
}

export default function Navbar() {
  const location = useLocation();
  const isHome = location.pathname === "/";

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    // På startsidan: lyssna på scroll, annars: alltid scrolled
    if (isHome) {
      const onScroll = () => setIsScrolled(window.scrollY > 50);
      // init direkt (om man t.ex. landar mitt i sidan via ankare)
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
      return () => window.removeEventListener("scroll", onScroll);
    } else {
      setIsScrolled(true);
      // ingen scroll-lyssnare på andra sidor
      return () => {};
    }
  }, [isHome]);

  // FIXED så den ligger ovanpå heron på startsidan.
  // Transparent på home innan scroll; solid på scroll/andra sidor.
  return (
    <header
      data-nav
      className={`fixed top-0 left-0 w-full z-50 transition-colors duration-300
        ${isScrolled ? "backdrop-blur border-b border-rift-gold/15" : "bg-transparent"}
      `}
    >
      <div className="max-w-7xl mx-auto px-4">
        {/* === LÄGE 1: STOR LOGGA CENTRERAD (endast på home & när ej scrolled) === */}
        <div className={`${!isHome || isScrolled ? "hidden" : "block"} py-2`}>
          <div className="relative flex items-center justify-center">
            <Link to="/" className="flex justify-center">
              <img
                src={rifthubLogo}
                alt="RiftHub Logo"
                className="h-32 md:h-48 w-auto object-contain transition-all duration-500"
              />
            </Link>

            <div className="absolute right-0 md:right-2 flex items-center gap-4 text-rift-gold">
              <Link to="/cart" className="p-2" aria-label="Cart"></Link>
              <Link to="/account" className="p-2" aria-label="Account"></Link>
            </div>
          </div>

          <div className="mt-3 flex justify-center">
            <NavLinks />
          </div>
        </div>

        {/* === LÄGE 2: KOMPAKT RAD (alltid på andra sidor, eller på home när scrolled) === */}
        <div
          className={`${(!isHome || isScrolled) ? "flex" : "hidden"} items-center justify-between py-2 transition-all duration-500`}
        >
          <Link to="/" className="flex items-center gap-2 min-w-0">
            <img
              src={rLogo}
              alt="RiftHub Small Logo"
              className="h-14 md:h-16 w-auto object-contain transition-all duration-500"
            />
          </Link>

          <div className="hidden sm:block mx-3">
            <NavLinks />
          </div>

          <div className="flex items-center gap-3 text-rift-gold">
            <Link to="/cart" className="p-2" aria-label="Cart"></Link>
            <Link to="/account" className="p-2" aria-label="Account"></Link>
          </div>
        </div>
      </div>
    </header>
  );
}
