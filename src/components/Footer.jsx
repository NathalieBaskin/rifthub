// src/components/Footer.jsx
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";

const API_URL = "http://localhost:5000"; // <-- behövs för att nå backend/public

export default function Footer() {
  const location = useLocation();
  const isChatPage = location.pathname === "/chat";

  // Toggle för socials i mobil
  const [showSocials, setShowSocials] = useState(false);

  // Socialmedia-länkar + korrekta ikon-URL:er
  const socials = [
    { name: "YouTube",   icon: `${API_URL}/socials/youtube.png`,   url: "https://www.youtube.com/c/UKLeagueofLegends" },
    { name: "Facebook",  icon: `${API_URL}/socials/facebook.png`,  url: "https://www.facebook.com/leagueoflegends/" },
    { name: "Instagram", icon: `${API_URL}/socials/instagram.png`, url: "https://www.instagram.com/ukleagueoflegends/" },
    { name: "Reddit",    icon: `${API_URL}/socials/reddit.png`,    url: "https://www.reddit.com/r/leagueoflegends/" },
    { name: "Twitter",   icon: `${API_URL}/socials/twitter.png`,   url: "https://x.com/LoLUKN" },
  ];

  return (
    <div>
      {/* DESKTOP/IPAD: endast socials (inte på chatsidan) */}
      {!isChatPage && (
        <footer className="hidden md:flex justify-center items-center py-4 backdrop-blur bg-black/20 border-t border-rift-gold/15">
          <div className="flex gap-6">
            {socials.map((s) => (
              <a
                key={s.name}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                title={s.name}
              >
                <img
                  src={s.icon}
                  alt={s.name}
                  className="h-8 w-8 object-contain hover:opacity-80 transition"
                />
              </a>
            ))}
          </div>
        </footer>
      )}

      {/* MOBIL: länkar + ^-toggle för att visa socials under */}
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

          {/* ^ / v toggle */}
          <button
            onClick={() => setShowSocials((v) => !v)}
            className="text-rift-gold hover:text-white text-lg px-2"
            aria-label="Toggle socials"
          >
            {showSocials ? "˅" : "˄"}
          </button>
        </div>

        {showSocials && (
          <div className="flex justify-center gap-6 py-3 border-t border-rift-gold/15">
            {socials.map((s) => (
              <a
                key={s.name}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                title={s.name}
              >
                <img
                  src={s.icon}
                  alt={s.name}
                  className="h-7 w-7 object-contain hover:opacity-80 transition"
                />
              </a>
            ))}
          </div>
        )}
      </footer>
    </div>
  );
}
