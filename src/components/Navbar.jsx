import { useEffect, useState } from "react";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import rifthubLogo from "../assets/images/rifthub.png";
import rLogo from "../assets/images/r-logo.png";
import { useCart } from "../context/useCart.js";
import { getUserFromToken } from "../utils/auth.js";

const linkBase =
  "px-3 py-1.5 rounded-md border border-rift-gold/25 bg-rift-card/60 hover:bg-rift-card text-sm transition";
const active = "text-rift-gold drop-shadow-glow border-rift-gold/50";

function NavLinks({ className = "" }) {
  return (
    <nav className={`flex gap-3 ${className}`}>
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
  const { count } = useCart();
  const [isScrolled, setIsScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const user = getUserFromToken();
  const navigate = useNavigate();

  useEffect(() => {
    if (isHome) {
      const onScroll = () => setIsScrolled(window.scrollY > 50);
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
      return () => window.removeEventListener("scroll", onScroll);
    } else {
      setIsScrolled(true);
      return () => {};
    }
  }, [isHome]);

  // Ikoner (från public/images)
  const accountIcon = "/images/account-icon.png";
  const cartIcon = "/images/cart-icon.png";
  const chatIcon = "/images/chat-icon.png";
  const keyIcon = "/images/key-icon.png";

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
    window.location.reload();
  };

  // Account-ikon block
  const AccountMenu = () => {
    if (!user) {
      // Om inte inloggad → gå till login/register
      return (
        <Link to="/auth" className="p-2" aria-label="Account">
          <img
            src={accountIcon}
            alt="Account"
            className="h-11 w-11 md:h-12 md:w-12"
          />
        </Link>
      );
    }

    // Inloggad → dropdown
    return (
      <div className="relative">
        <button
          onClick={() => setDropdownOpen((prev) => !prev)}
          className="p-2"
          aria-label="Account"
        >
          <img
            src={accountIcon}
            alt="Account"
            className="h-11 w-11 md:h-12 md:w-12"
          />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-rift-card border border-rift-gold/40 rounded-md shadow-lg z-50">
            <Link
              to="/profile"
              className="block px-4 py-2 text-sm text-gray-200 hover:bg-rift-bg"
              onClick={() => setDropdownOpen(false)}
            >
              My Page
            </Link>
            <Link
              to="/profile/edit"
              className="block px-4 py-2 text-sm text-gray-200 hover:bg-rift-bg"
              onClick={() => setDropdownOpen(false)}
            >
              Edit My Page
            </Link>
            <button
              onClick={() => {
                setDropdownOpen(false);
                navigate("/account/delete");
              }}
              className="w-full text-left block px-4 py-2 text-sm text-red-400 hover:bg-rift-bg"
            >
              Delete Account
            </button>
            <button
              onClick={handleLogout}
              className="w-full text-left block px-4 py-2 text-sm text-gray-200 hover:bg-rift-bg"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <header
      data-nav
      className={`fixed top-0 left-0 w-full z-50 transition-colors duration-300
        ${isScrolled ? "backdrop-blur border-b border-rift-gold/15" : "bg-transparent"}
      `}
    >
      <div className="max-w-7xl mx-auto px-4">

        {/* === MOBILVERSION === */}
        <div className="flex sm:hidden items-center justify-between py-2">
          <Link to="/" className="flex items-center gap-2 min-w-0">
            <img
              src={rLogo}
              alt="RiftHub Small Logo"
              className="h-12 w-auto object-contain transition-all duration-500"
            />
          </Link>
          <div className="flex items-center gap-3 text-rift-gold">
            <NavLinks />

            {/* Cart */}
            <Link to="/cart" className="relative p-2" aria-label="Cart">
              <img src={cartIcon} alt="Cart" className="h-9 w-9 md:h-10 md:w-10" />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs px-1.5 rounded-full">
                  {count}
                </span>
              )}
            </Link>

            {/* Chat */}
            {user && (
              <Link to="/chat" className="p-2" aria-label="Chat">
                <img src={chatIcon} alt="Chat" className="h-9 w-9 md:h-10 md:w-10" />
              </Link>
            )}

            {/* Account / Dropdown */}
            <AccountMenu />

            {/* Admin – mindre */}
            {user?.is_admin === 1 && (
              <Link to="/admin" className="p-2" aria-label="Admin">
                <img src={keyIcon} alt="Admin" className="h-7 w-7 md:h-8 md:w-8" />
              </Link>
            )}
          </div>
        </div>

        {/* === DESKTOP === */}
        <div className="hidden sm:block">
          {/* LÄGE 1: stor logga (STARTSIDAN, INNAN SCROLL) */}
          <div className={`${!isHome || isScrolled ? "hidden" : "block"} py-2`}>
            <div className="relative flex items-center justify-center">
              <Link to="/" className="flex justify-center">
                <img
                  src={rifthubLogo}
                  alt="RiftHub Logo"
                  className="h-32 md:h-48 w-auto object-contain transition-all duration-500"
                />
              </Link>
            </div>
            <div className="mt-3 flex justify-center">
              <NavLinks />
            </div>
          </div>

          {/* LÄGE 2: kompakt rad (andra sidor + efter scroll) */}
          <div
            className={`${
              !isHome || isScrolled ? "flex" : "hidden"
            } items-center justify-between py-2 transition-all duration-500`}
          >
            <Link to="/" className="flex items-center gap-2 min-w-0">
              <img
                src={rLogo}
                alt="RiftHub Small Logo"
                className="h-14 md:h-16 w-auto object-contain transition-all duration-500"
              />
            </Link>
            <div className="mx-3">
              <NavLinks />
            </div>
            <div className="flex items-center gap-4 text-rift-gold">
              {/* Cart */}
              <Link to="/cart" className="relative p-2" aria-label="Cart">
                <img src={cartIcon} alt="Cart" className="h-9 w-9 md:h-10 md:w-10" />
                {count > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs px-1.5 rounded-full">
                    {count}
                  </span>
                )}
              </Link>

              {/* Chat */}
              {user && (
                <Link to="/chat" className="p-2" aria-label="Chat">
                  <img src={chatIcon} alt="Chat" className="h-9 w-9 md:h-10 md:w-10" />
                </Link>
              )}

              {/* Account / Dropdown */}
              <AccountMenu />

              {/* Admin */}
              {user?.is_admin === 1 && (
                <Link to="/admin" className="p-2" aria-label="Admin">
                  <img src={keyIcon} alt="Admin" className="h-7 w-7 md:h-8 md:w-8" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
