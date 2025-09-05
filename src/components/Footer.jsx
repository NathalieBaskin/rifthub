// src/components/Footer.jsx
import { Link } from "react-router-dom";
import rifthubLogo from "../assets/images/rifthub.png";

export default function Footer() {
  return (
    <div>
      {/* DESKTOP + IPAD (bara loggan, EJ fixed) */}
      <footer className="hidden md:flex justify-center items-center py-4 backdrop-blur bg-black/30 border-t border-rift-gold/15">
        <img
          src={rifthubLogo}
          alt="RiftHub Logo"
          className="h-16 md:h-24 w-auto object-contain mx-auto"
        />
      </footer>

      {/* MOBIL (fixed länkar) */}
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
