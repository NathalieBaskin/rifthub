// src/components/Navbar.jsx
import { useEffect, useRef, useState } from "react";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import rifthubLogo from "../assets/images/rifthub.png";
import rLogo from "../assets/images/r-logo.png";
import { useCart } from "../context/useCart.js";
import { getUserFromToken } from "../utils/auth.js";
import { useFavorites } from "../hooks/useFavorites";

// Guldiga ikoner (Heroicons v2 via react-icons)
import {
  HiHeart,
  HiOutlineShoppingCart,
  HiOutlineChatBubbleLeftRight,
  HiOutlineUser,
  HiOutlineKey,
} from "react-icons/hi2";

const linkBase =
  "px-3 py-1.5 rounded-md border border-rift-gold/25 bg-rift-card/60 hover:bg-rift-card text-sm transition";
const active = "text-rift-gold drop-shadow-glow border-rift-gold/50";

function NavLinks({ className = "" }) {
  return (
    <nav className={`flex gap-3 ${className}`}>
      <NavLink to="/summoners-hall" className={({ isActive }) => `${linkBase} ${isActive ? active : ""}`}>
        Summoner&apos;s Hall
      </NavLink>
    <NavLink to="/tavern" className={({ isActive }) => `${linkBase} ${isActive ? active : ""}`}>
  The Rift Tavern
</NavLink>

      <NavLink to="/shop" className={({ isActive }) => `${linkBase} ${isActive ? active : ""}`}>
        Legends Bazaar
      </NavLink>
    </nav>
  );
}

export default function Navbar() {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const isChat = location.pathname.startsWith("/chat");
  const { count } = useCart();
  const [isScrolled, setIsScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const user = getUserFromToken();
  const navigate = useNavigate();

  // Favoriter -> pop när antal ökar
   const { favorites } = useFavorites();
  const [favPop, setFavPop] = useState(false);
  const prevLen = useRef(favorites?.length || 0);

  useEffect(() => {
    const curr = favorites?.length || 0;
    if (curr > prevLen.current) {
      setFavPop(true);
      const t = setTimeout(() => setFavPop(false), 240);
      prevLen.current = curr; // ✅ se till att vi ALWAYS uppdaterar
      return () => clearTimeout(t);
    }
    prevLen.current = curr; // ✅ uppdatera även när det minskar/är samma
  }, [favorites?.length]);

  // Unread chat
  const [unreadCount, setUnreadCount] = useState(0);
  async function fetchUnread() {
    if (!user) return;
    const res = await fetch(`http://localhost:5000/api/unread-count/${user.id}`);
    if (!res.ok) return;
    const data = await res.json();
    setUnreadCount(data.count);
  }
  useEffect(() => {
    if (user) {
      fetchUnread();
      const interval = setInterval(fetchUnread, 5000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Scroll-bakgrund
  useEffect(() => {
    if (isHome && !isChat) {
      const onScroll = () => setIsScrolled(window.scrollY > 50);
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
      return () => window.removeEventListener("scroll", onScroll);
    } else {
      setIsScrolled(true);
      return () => {};
    }
  }, [isHome, isChat]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
    window.location.reload();
  };

  const AccountMenu = () => {
    if (!user) {
      return (
        <Link to="/auth" className="p-2" aria-label="Account">
          <HiOutlineUser className="h-8 w-8 text-rift-gold" />
        </Link>
      );
    }
    return (
      <div className="relative">
        <button onClick={() => setDropdownOpen((prev) => !prev)} className="p-2" aria-label="Account">
          <HiOutlineUser className="h-8 w-8 text-rift-gold" />
        </button>
        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-rift-card border border-rift-gold/40 rounded-md shadow-lg z-50">
            <Link to="/profile" className="block px-4 py-2 text-sm text-gray-200 hover:bg-rift-bg" onClick={() => setDropdownOpen(false)}>My Page</Link>
            <Link to="/profile/edit" className="block px-4 py-2 text-sm text-gray-200 hover:bg-rift-bg" onClick={() => setDropdownOpen(false)}>Edit My Page</Link>
            <Link to="/settings" className="block px-4 py-2 text-sm text-gray-200 hover:bg-rift-bg" onClick={() => setDropdownOpen(false)}>Settings</Link>
            <button onClick={handleLogout} className="w-full text-left block px-4 py-2 text-sm text-gray-200 hover:bg-rift-bg">Logout</button>
          </div>
        )}
      </div>
    );
  };

  // Guldhjärta + badge + pop -> till /favorites
const HeartLink = ({ className = "" }) => (
    <Link
      to="/favorites"
      aria-label="Favorites"
      title="Favorites"
      className={`relative p-2 transition-transform duration-200 ${favPop ? "scale-125" : "scale-100"} ${className}`}
    >
      <HiHeart className="h-8 w-8 text-rift-gold drop-shadow" />
      {favorites?.length > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs px-1.5 rounded-full">
          {favorites.length}
        </span>
      )}
    </Link>
  );

  return (
    <header
      data-nav
      className={`fixed top-0 left-0 w-full z-50 transition-colors duration-300
        ${
          isChat
            ? "bg-black/30 backdrop-blur-[2px] border-none"
            : isScrolled
            ? "backdrop-blur border-b border-rift-gold/15"
            : "bg-transparent"
        }`}
    >
      <div className="max-w-7xl mx-auto px-4">
        {/* MOBILE */}
        <div className="flex sm:hidden items-center justify-between py-2">
          <Link to="/" className="flex items-center gap-2 min-w-0">
            <img src={rLogo} alt="RiftHub Small Logo" className="h-12 w-auto object-contain transition-all duration-500" />
          </Link>
          <div className="flex items-center gap-3 text-rift-gold">
            <NavLinks />

            {/* Favorites */}
            <HeartLink />

            {/* Cart */}
            <Link to="/cart" className="relative p-2" aria-label="Cart" title="Cart">
              <HiOutlineShoppingCart className="h-8 w-8 text-rift-gold" />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs px-1.5 rounded-full">
                  {count}
                </span>
              )}
            </Link>

            {/* Chat */}
            {user && (
              <Link to="/chat" className="relative p-2" aria-label="Chat" title="Chat">
                <HiOutlineChatBubbleLeftRight className="h-8 w-8 text-rift-gold" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs px-1.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </Link>
            )}

            <AccountMenu />

            {/* Admin */}
            {user?.is_admin === 1 && (
              <Link to="/admin" className="p-2" aria-label="Admin" title="Admin">
                <HiOutlineKey className="h-7 w-7 md:h-8 md:w-8 text-rift-gold" />
              </Link>
            )}
          </div>
        </div>

        {/* DESKTOP */}
        <div className="hidden sm:block">
          <div className={`${!isHome || isScrolled ? "hidden" : "block"} py-2`}>
            <div className="relative flex items-center justify-center">
              <Link to="/" className="flex justify-center">
                <img src={rifthubLogo} alt="RiftHub Logo" className="h-32 md:h-48 w-auto object-contain transition-all duration-500" />
              </Link>
            </div>
            <div className="mt-3 flex justify-center">
              <NavLinks />
            </div>
          </div>

          <div className={`${!isHome || isScrolled ? "flex" : "hidden"} items-center justify-between py-2 transition-all duration-500`}>
            <Link to="/" className="flex items-center gap-2 min-w-0">
              <img src={rLogo} alt="RiftHub Small Logo" className="h-14 md:h-16 w-auto object-contain transition-all duration-500" />
            </Link>
            <div className="mx-3">
              <NavLinks />
            </div>
            <div className="flex items-center gap-4 text-rift-gold">
              {/* Favorites */}
              <HeartLink className="hidden md:inline-flex" />

              {/* Cart */}
              <Link to="/cart" className="relative p-2" aria-label="Cart" title="Cart">
                <HiOutlineShoppingCart className="h-8 w-8 text-rift-gold" />
                {count > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs px-1.5 rounded-full">
                    {count}
                  </span>
                )}
              </Link>

              {/* Chat */}
              {user && (
                <Link to="/chat" className="relative p-2" aria-label="Chat" title="Chat">
                  <HiOutlineChatBubbleLeftRight className="h-8 w-8 text-rift-gold" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs px-1.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              )}

              <AccountMenu />

              {/* Admin */}
              {user?.is_admin === 1 && (
                <Link to="/admin" className="p-2" aria-label="Admin" title="Admin">
                  <HiOutlineKey className="h-7 w-7 md:h-8 md:w-8 text-rift-gold" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
