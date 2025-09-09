// src/components/Navbar.jsx
import { useEffect, useRef, useState } from "react";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import rifthubLogo from "../assets/images/rifthub.png";
import rLogo from "../assets/images/r-logo.png";
import { useCart } from "../context/useCart.js";
import { getUserFromToken } from "../utils/auth.js";
import { useFavorites } from "../hooks/useFavorites";
import NotAuthModal from "./NotAuthModal.jsx";

const IMG_BASE = "http://localhost:5000/images";

export default function Navbar() {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const isChat = location.pathname.startsWith("/chat");
  const { count } = useCart();
  const [isScrolled, setIsScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const user = getUserFromToken();
  const navigate = useNavigate();

  const [showAuthModal, setShowAuthModal] = useState(false);

  // Favoriter -> pop
  const { favorites } = useFavorites();
  const [favPop, setFavPop] = useState(false);
  const prevLen = useRef(favorites?.length || 0);
  useEffect(() => {
    const curr = favorites?.length || 0;
    if (curr > prevLen.current) {
      setFavPop(true);
      const t = setTimeout(() => setFavPop(false), 240);
      prevLen.current = curr;
      return () => clearTimeout(t);
    }
    prevLen.current = curr;
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

  // ------- AccountMenu -------
  const AccountMenu = () => {
    const accountImgCls =
      "h-9 w-9 md:h-11 md:w-11 object-contain shrink-0 min-w-[2.25rem] md:min-w-[2.75rem]";
    if (!user) {
      return (
        <Link to="/auth" className="p-2" aria-label="Account">
          <img src="/images/user-icon.png" alt="User" className={accountImgCls} />
        </Link>
      );
    }
    return (
      <div className="relative">
        <button onClick={() => setDropdownOpen((p) => !p)} className="p-2" aria-label="Account">
          <img src="/images/user-icon.png" alt="User" className={accountImgCls} />
        </button>
        {dropdownOpen && (
          <div className="absolute right-0 translate-x-16 mt-2 w-48 bg-rift-card border border-rift-gold/40 rounded-md shadow-lg z-50">
            <Link to="/profile" className="block px-4 py-2 text-sm text-gray-200 hover:bg-rift-bg" onClick={() => setDropdownOpen(false)}>My Page</Link>
            <Link to="/profile/edit" className="block px-4 py-2 text-sm text-gray-200 hover:bg-rift-bg" onClick={() => setDropdownOpen(false)}>Edit My Page</Link>
            <Link to="/settings" className="block px-4 py-2 text-sm text-gray-200 hover:bg-rift-bg" onClick={() => setDropdownOpen(false)}>Settings</Link>
            <button onClick={handleLogout} className="w-full text-left block px-4 py-2 text-sm text-gray-200 hover:bg-rift-bg">Logout</button>
          </div>
        )}
      </div>
    );
  };

  // ------- Hjärtikon/Favoriter -------
  const HeartLink = ({ className = "" }) => (
    <Link
      to="/favorites"
      aria-label="Favorites"
      title="Favorites"
      className={`relative p-2 transition-transform duration-200 ${favPop ? "scale-125" : "scale-100"} ${className}`}
    >
      <img
        src="/images/heart-icon.png"
        alt="Favorites"
        className="h-9 w-9 md:h-11 md:w-11 object-contain shrink-0 min-w-[2.25rem] md:min-w-[2.75rem]"
      />
      {favorites?.length > 0 && (
        <span className="absolute -top-1 -right-1 bg-rift-gold text-black text-xs px-1.5 rounded-full">
          {favorites.length}
        </span>
      )}
    </Link>
  );

  // ------- Bild-länkar (mindre på iPad/md, Rift fortfarande större) -------
  const ImageNavLinks = ({ className = "" }) => {
    const base = "transition-transform duration-150 hover:scale-[1.02] focus:outline-none";
    const activeGlow = "drop-shadow-[0_0_10px_rgba(255,215,0,0.6)]";

    // md (iPad) mindre för att ge plats åt ikonerna
    const imgSmall = "h-9 md:h-7 lg:h-9 w-auto object-contain select-none shrink-0";
    const imgLarge = "h-12 md:h-9 lg:h-12 w-auto object-contain select-none shrink-0"; // Rift större

    const isSummoners = location.pathname.startsWith("/summoners-hall");
    const isShop = location.pathname.startsWith("/shop");
    const isTavern = location.pathname.startsWith("/tavern");

    const onTavernClick = () => {
      if (user) {
        window.location.href = "/tavern";
      } else {
        setShowAuthModal(true);
      }
    };

    return (
      <nav className={`flex items-center gap-2 sm:gap-3 md:gap-2 lg:gap-4 ${className}`}>
        <NavLink
          to="/summoners-hall"
          className={`${base} ${isSummoners ? activeGlow : ""}`}
          aria-label="Summoner's Hall"
          title="Summoner's Hall"
        >
          <img src={`${IMG_BASE}/summoners-link.png`} alt="Summoner's Hall" className={imgSmall} draggable="false" />
        </NavLink>

        <button
          type="button"
          onClick={onTavernClick}
          className={`${base} ${isTavern ? activeGlow : ""} bg-transparent p-0`}
          aria-label="The Rift Tavern"
          title="The Rift Tavern"
        >
          <img src={`${IMG_BASE}/rift-link.png`} alt="The Rift Tavern" className={imgLarge} draggable="false" />
        </button>

        <NavLink
          to="/shop"
          className={`${base} ${isShop ? activeGlow : ""}`}
          aria-label="Legends Bazaar"
          title="Legends Bazaar"
        >
          <img src={`${IMG_BASE}/bazaar-link.png`} alt="Legends Bazaar" className={imgSmall} draggable="false" />
        </NavLink>
      </nav>
    );
  };

  return (
    <header
      data-nav
      className={`fixed top-0 left-0 w-full z-50 transition-colors duration-300
        ${isChat ? "bg-black/30 backdrop-blur-[2px] border-none" : isScrolled ? "backdrop-blur border-b border-rift-gold/15" : "bg-transparent"}`}
    >
      <div className="max-w-7xl mx-auto px-4">
        {/* MOBILE */}
        <div className="flex sm:hidden items-center justify-between py-2">
          <Link to="/" className="flex items-center gap-2 min-w-0">
            <img src={rLogo} alt="RiftHub Small Logo" className="h-14 w-auto object-contain transition-all duration-500" />
          </Link>
          <div className="flex items-center gap-3 text-rift-gold">
            <HeartLink />
            <Link to="/cart" className="relative p-2" aria-label="Cart" title="Cart">
              <img
                src="/images/cart-icon.png"
                alt="Cart"
                className="h-9 w-9 object-contain shrink-0 min-w-[2.25rem]"
              />
              {count > 0 && <span className="absolute -top-1 -right-1 bg-rift-gold text-black text-xs px-1.5 rounded-full">{count}</span>}
            </Link>
            {user && (
              <Link to="/chat" className="relative p-2" aria-label="Chat" title="Chat">
                <img
                  src="/images/chat-icon.png"
                  alt="Chat"
                  className="h-9 w-9 object-contain shrink-0 min-w-[2.25rem]"
                />
                {unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-rift-gold text-black text-xs px-1.5 rounded-full">{unreadCount}</span>}
              </Link>
            )}
            <AccountMenu />
            {user?.is_admin === 1 && (
              <Link to="/admin" className="p-2" aria-label="Admin" title="Admin">
                <img
                  src="/images/key-icon.png"
                  alt="Admin"
                  className="h-9 w-9 object-contain shrink-0 min-w-[2.25rem]"
                />
              </Link>
            )}
          </div>
        </div>

        {/* IPAD + DESKTOP */}
        <div className="hidden sm:block">
          {/* Stor logga på startsidan */}
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
              {/* centrera, men nudge lite vänster */}
              <ImageNavLinks className="sm:relative sm:-left-6 md:-left-4 lg:-left-5" />
            </div>
          </div>

          {/* Sticky rad */}
          <div className={`${!isHome || isScrolled ? "flex" : "hidden"} items-center justify-between py-2 transition-all duration-500`}>
            <Link to="/" className="flex items-center gap-2 min-w-0">
              <img src={rLogo} alt="RiftHub Small Logo" className="h-14 md:h-16 w-auto object-contain transition-all duration-500" />
            </Link>

            <div className="mx-1 md:mx-0">
              <ImageNavLinks />
            </div>

            <div className="flex items-center gap-4 md:gap-3 text-rift-gold">
              <HeartLink className="hidden md:inline-flex" />
              <Link to="/cart" className="relative p-2" aria-label="Cart" title="Cart">
                <img
                  src="/images/cart-icon.png"
                  alt="Cart"
                  className="h-11 w-11 object-contain shrink-0 min-w-[2.75rem]"
                />
                {count > 0 && <span className="absolute -top-1 -right-1 bg-rift-gold text-black text-xs px-1.5 rounded-full">{count}</span>}
              </Link>
              {user && (
                <Link to="/chat" className="relative p-2" aria-label="Chat" title="Chat">
                  <img
                    src="/images/chat-icon.png"
                    alt="Chat"
                    className="h-11 w-11 object-contain shrink-0 min-w-[2.75rem]"
                  />
                  {unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-rift-gold text-black text-xs px-1.5 rounded-full">{unreadCount}</span>}
                </Link>
              )}
              <AccountMenu />
              {user?.is_admin === 1 && (
                <Link to="/admin" className="p-2" aria-label="Admin" title="Admin">
                  <img
                    src="/images/key-icon.png"
                    alt="Admin"
                    className="h-11 w-11 object-contain shrink-0 min-w-[2.75rem]"
                  />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {showAuthModal && <NotAuthModal onClose={() => setShowAuthModal(false)} />}
    </header>
  );
}
