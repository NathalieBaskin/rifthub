// src/components/Footer.jsx
import { Link, useLocation } from "react-router-dom";
import rifthubLogo from "../assets/images/rifthub.png";

export default function Footer() {
  const location = useLocation();

  // Kolla om vi är på chatsidan
  const isChatPage = location.pathname === "/chat";

  return (
    <div>
      {/* DESKTOP + IPAD (bara loggan) → göm om chatsidan */}
      {!isChatPage && (
        <footer className="hidden md:flex justify-center items-center py-1 backdrop-blur bg-black/10 border-t border-rift-gold/15">
          <img
            src={rifthubLogo}
            alt="RiftHub Logo"
            className="h-16 md:h-24 w-auto object-contain mx-auto"
          />
        </footer>
      )}

      {/* MOBIL (fixed länkar) → visas alltid, även på chatsidan */}
      <footer className="md:hidden fixed bottom-0 left-0 w-full z-50 backdrop-blur bg-black/30 border-t border-rift-gold/15">
        <div className="flex justify-around items-center py-3 text-rift-gold text-sm font-semibold">
          <Link to="/summoners-hall" className="hover:text-white transition">
            Summoner&apos;s Hall
          </Link>
          <Link to="/tavern" className="hover:text-white transition">
            The Rift Tavern
          </Link>
          <Link to="/shop" className="hover:text-white transition">
            Legends Bazaar
          </Link>
        </div>
      </footer>
    </div>
  );
}
