// src/components/AlliesSection.jsx
import { useEffect, useState } from "react";
import { getUserFromToken } from "../utils/auth.js";
import { Link, useNavigate } from "react-router-dom";

export default function AlliesSection({ profileUserId }) {
  const me = getUserFromToken();
  const navigate = useNavigate();  // ✅ här inne, inte utanför

  const [myFriends, setMyFriends] = useState([]);          // mina vänner
  const [profileFriends, setProfileFriends] = useState([]); // vänner för profilen jag kollar på
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);

  // 🔹 Hämta mina vänner
  async function fetchMyFriends() {
    const res = await fetch(`http://localhost:5000/api/friends/${me.id}`);
    if (!res.ok) return;
    const data = await res.json();
    setMyFriends(data);
  }

  // 🔹 Hämta vänner för den profil jag kollar på
  async function fetchProfileFriends() {
    const res = await fetch(`http://localhost:5000/api/friends/${profileUserId}`);
    if (!res.ok) return;
    const data = await res.json();
    setProfileFriends(data);
  }

  // 🔹 Sök användare
  async function handleSearch(e) {
    e.preventDefault();
    if (!search.trim()) return;
    const res = await fetch(
      `http://localhost:5000/api/users/search?q=${encodeURIComponent(search)}`
    );
    if (!res.ok) return;
    const data = await res.json();
    setResults(data);
  }

  // 🔹 Lägg till vän (ömsesidigt)
  async function addFriend(friendId) {
    await fetch("http://localhost:5000/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: me.id, friendId }),
    });
    setSearch("");
    setResults([]);
    fetchMyFriends();
    fetchProfileFriends();
  }

  // 🔹 Ta bort vän
  async function removeFriend(friendId) {
    if (!window.confirm("Delete? YES / NO")) return;
    await fetch(`http://localhost:5000/api/friends/${me.id}/${friendId}`, {
      method: "DELETE",
    });
    fetchMyFriends();
    fetchProfileFriends();
  }

  // === useEffects ===
  useEffect(() => {
    if (me) {
      fetchMyFriends();
    }
  }, [me]);

  useEffect(() => {
    if (profileUserId) {
      fetchProfileFriends();
    }
  }, [profileUserId]);

  // === Om jag kollar på MIN egen profil
  if (me.id === profileUserId) {
    return (
      <div className="p-4 bg-rift-card border border-rift-gold/40 rounded-md w-80">
        <h2 className="text-xl font-bold text-rift-gold mb-4">My Allies</h2>

        {/* 🔍 Sökfält */}
        <form onSubmit={handleSearch} className="mb-4 flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search username..."
            className="flex-1 border border-rift-gold/40 p-2 rounded bg-white text-rift-bg"
          />
          <button type="submit" className="px-3 py-1 bg-rift-card border border-rift-gold/40 rounded text-rift-gold">
            Search
          </button>
        </form>

        {/* 🔎 Resultat */}
        {results.length > 0 && (
          <ul className="mb-4 space-y-2">
            {results.map((u) => {
              const alreadyFriend = myFriends.some((f) => f.id === u.id);
              return (
                <li key={u.id} className="flex justify-between items-center p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <img
                      src={u.avatar_url ? `http://localhost:5000${u.avatar_url}` : "/images/account-icon.png"}
                      alt={u.username}
                      className="h-8 w-8 rounded-full"
                    />
                    <span>{u.username}</span>
                  </div>
                  {!alreadyFriend && (
                    <button onClick={() => addFriend(u.id)} className="text-green-400">➕</button>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {/* 👥 Vänner listan */}
        <ul className="space-y-2">
          {myFriends.map((f) => (
            <li key={f.id} className="flex items-center justify-between p-2 border rounded">
              <div className="flex items-center gap-2">
                <img
                  src={f.avatar_url ? `http://localhost:5000${f.avatar_url}` : "/images/account-icon.png"}
                  alt={f.username}
                  className="h-10 w-10 rounded-full"
                />
                <Link to={`/profile/${f.id}`} className="text-rift-gold hover:underline">
                  {f.username}
                </Link>
              </div>
              <div className="flex gap-2">
                <button onClick={() => removeFriend(f.id)} className="text-red-500">🗑</button>
                <button
                  onClick={() => navigate(`/chat?friend=${f.id}`)}
                  className="text-blue-400"
                >
                  💬
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // === Om jag kollar på NÅGON ANNANS profil
  const alreadyFriend = profileFriends.some((f) => f.id === me.id);

  return (
    <div className="p-4 bg-rift-card border border-rift-gold/40 rounded-md w-80">
      <h2 className="text-xl font-bold text-rift-gold mb-4">Allies</h2>

      {/* ➕ Knapp om vi inte är vänner */}
      {me && me.id !== profileUserId && !alreadyFriend && (
        <button
          onClick={() => addFriend(profileUserId)}
          className="px-4 py-2 bg-rift-card border border-rift-gold/40 rounded text-rift-gold"
        >
          ➕ Lägg till som vän
        </button>
      )}

      {/* 👥 Lista över profilens vänner */}
      <ul className="mt-4 space-y-2">
        {profileFriends.map((f) => (
          <li key={f.id} className="flex items-center gap-2 p-2 border rounded">
            <img
              src={f.avatar_url ? `http://localhost:5000${f.avatar_url}` : "/images/account-icon.png"}
              alt={f.username}
              className="h-10 w-10 rounded-full"
            />
            <Link to={`/profile/${f.id}`} className="text-rift-gold hover:underline">
              {f.username}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
