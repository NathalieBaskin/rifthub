// src/components/AlliesSection.jsx
import { useEffect, useState } from "react";
import { getUserFromToken } from "../utils/auth.js";
import { Link } from "react-router-dom";

export default function AlliesSection({ profileUserId }) {
  const me = getUserFromToken();
  const [allies, setAllies] = useState([]);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);

  // 🔹 Hämta mina allies
  async function fetchAllies() {
    try {
      const res = await fetch(`http://localhost:5000/api/allies/${me.id}`);
      if (!res.ok) throw new Error("Failed to fetch allies");
      const data = await res.json();
      setAllies(data);
    } catch (err) {
      console.error("fetchAllies error:", err);
    }
  }

  // 🔹 Sök användare efter användarnamn
  async function handleSearch(e) {
    e.preventDefault();
    if (!search.trim()) return;
    try {
      const res = await fetch(
        `http://localhost:5000/api/users/search?q=${encodeURIComponent(search)}`
      );
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error("handleSearch error:", err);
    }
  }

  // 🔹 Lägg till ally
  async function addAlly(allyId) {
    try {
      await fetch("http://localhost:5000/api/allies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: me.id, allyId }),
      });
      setSearch("");
      setResults([]);
      fetchAllies();
    } catch (err) {
      console.error("addAlly error:", err);
    }
  }

  // 🔹 Ta bort ally
  async function removeAlly(allyId) {
    try {
      await fetch(`http://localhost:5000/api/allies/${me.id}/${allyId}`, {
        method: "DELETE",
      });
      fetchAllies();
    } catch (err) {
      console.error("removeAlly error:", err);
    }
  }

  useEffect(() => {
    if (me) fetchAllies();
  }, [me]);

  // === Om jag kollar på MIN profil
  if (me.id === profileUserId) {
    return (
      <div className="p-4 bg-rift-card border border-rift-gold/40 rounded-md w-80">
        <h2 className="text-xl font-bold text-rift-gold mb-4">Allies</h2>

        {/* 🔍 Sökfält */}
        <form onSubmit={handleSearch} className="mb-4 flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search username..."
            className="flex-1 border border-rift-gold/40 p-2 rounded bg-white text-rift-bg"
          />
          <button
            type="submit"
            className="px-3 py-1 bg-rift-card border border-rift-gold/40 rounded text-rift-gold"
          >
            Search
          </button>
        </form>

        {/* 🔎 Resultat */}
        {results.length > 0 && (
          <ul className="mb-4 space-y-2">
            {results.map((u) => (
              <li
                key={u.id}
                className="flex justify-between items-center p-2 border rounded"
              >
                <div className="flex items-center gap-2">
                  <img
                    src={u.avatar_url || "/images/account-icon.png"}
                    alt={u.username}
                    className="h-8 w-8 rounded-full"
                  />
                  <span>{u.username}</span>
                </div>
                <button
                  onClick={() => addAlly(u.id)}
                  className="text-green-400"
                >
                  ➕
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* 👥 Allies list */}
        <ul className="space-y-2">
          {allies.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between p-2 border rounded"
            >
              <div className="flex items-center gap-2">
                <img
                  src={a.avatar_url || "/images/account-icon.png"}
                  alt={a.username}
                  className="h-10 w-10 rounded-full"
                />
                <Link
                  to={`/profile/${a.id}`}
                  className="text-rift-gold hover:underline"
                >
                  {a.username}
                </Link>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => removeAlly(a.id)}
                  className="text-red-400"
                >
                  🖊
                </button>
                <button
                  onClick={() => alert("Chat coming soon")}
                  className="text-blue-400"
                >
                  ➕
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // === Om jag kollar på någon ANNANS profil
  return (
    <div className="p-4 bg-rift-card border border-rift-gold/40 rounded-md w-80">
      <h2 className="text-xl font-bold text-rift-gold mb-4">Allies</h2>
      {me && me.id !== profileUserId && (
        <button
          onClick={() => addAlly(profileUserId)}
          className="px-4 py-2 bg-rift-card border border-rift-gold/40 rounded text-rift-gold"
        >
          ➕ Lägg till som vän
        </button>
      )}
    </div>
  );
}
