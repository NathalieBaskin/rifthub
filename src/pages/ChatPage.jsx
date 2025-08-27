// src/pages/ChatPage.jsx
import { useEffect, useState } from "react";
import { getUserFromToken } from "../utils/auth";
import { useLocation } from "react-router-dom";

export default function ChatPage() {
  const user = getUserFromToken();
  const location = useLocation();

  const [friends, setFriends] = useState([]);
  const [activeFriend, setActiveFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [lastMessages, setLastMessages] = useState([]);

  // 📌 Läs query-parametern ?friend=ID
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const fid = params.get("friend");
    if (fid) setActiveFriend(Number(fid));
  }, [location.search]);

  // 🔹 Hämta mina vänner
  async function fetchFriends() {
    const res = await fetch(`http://localhost:5000/api/friends/${user.id}`);
    if (!res.ok) return;
    const data = await res.json();
    setFriends(data);
  }

  // 🔹 Hämta senaste meddelanden
  async function fetchLastMessages() {
    const res = await fetch(`http://localhost:5000/api/last-messages/${user.id}`);
    if (!res.ok) return;
    const data = await res.json();
    setLastMessages(data);
  }

  // 🔹 Hämta meddelanden med aktiv vän
  async function fetchMessages() {
    if (!activeFriend) return;
    const res = await fetch(`http://localhost:5000/api/messages/${activeFriend}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    if (!res.ok) return;
    const data = await res.json();
    setMessages(data);
    fetchLastMessages(); // uppdatera senaste
  }

  // 🔹 Skicka nytt meddelande
  async function sendMessage(e) {
    e.preventDefault();
    if (!newMsg.trim()) return;

    await fetch("http://localhost:5000/api/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ receiverId: activeFriend, content: newMsg }),
    });

    setNewMsg("");
    fetchMessages();
  }

  useEffect(() => {
    fetchFriends();
    fetchLastMessages();
  }, []);

  useEffect(() => {
    if (activeFriend) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [activeFriend]);

  return (
    <div className="flex h-screen bg-gray-900 text-gray-200">
      {/* === SIDEBAR === */}
      <aside className="w-64 border-r border-rift-gold/30 bg-rift-card p-4 overflow-y-auto">
        <h2 className="text-lg font-bold text-rift-gold mb-4">Direct Messages</h2>
        <ul className="space-y-2">
          {friends.map((f) => {
            const last = lastMessages.find((m) => m.friendId === f.id);
            const isUnread = last && last.receiver_id === user.id && last.is_read === 0;

            return (
              <li
                key={f.id}
                className={`flex flex-col p-2 rounded cursor-pointer transition ${
                  activeFriend === f.id
                    ? "bg-rift-gold/20 text-rift-gold"
                    : "hover:bg-rift-card/80"
                }`}
                onClick={() => setActiveFriend(f.id)}
              >
                <div className="flex items-center gap-2">
                  <img
                    src={
                      f.avatar_url
                        ? `http://localhost:5000${f.avatar_url}`
                        : "/images/account-icon.png"
                    }
                    alt={f.username}
                    className="h-8 w-8 rounded-full"
                  />
                  <span className="truncate">{f.username}</span>
                  {isUnread && (
                    <span className="ml-auto text-xs bg-red-600 text-white rounded-full px-2">
                      New
                    </span>
                  )}
                </div>
                <span className="ml-10 text-xs text-gray-400 truncate">
                  {last ? `${last.sender_name}: ${last.content}` : "No messages yet"}
                </span>
              </li>
            );
          })}
        </ul>
      </aside>

      {/* === CHAT WINDOW === */}
      <main className="flex-1 flex flex-col">
        {activeFriend ? (
          <>
            {/* HEADER */}
            <div className="p-4 border-b border-rift-gold/30 bg-rift-card flex items-center gap-2">
              <span className="font-bold text-rift-gold">
                {friends.find((f) => f.id === activeFriend)?.username || "Chat"}
              </span>
            </div>

            {/* MESSAGES */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {messages.length === 0 ? (
                <p className="text-gray-400 italic">No messages yet...</p>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-lg ${
                      m.sender_id === user.id
                        ? "ml-auto text-right text-green-400"
                        : "mr-auto text-left text-blue-400"
                    }`}
                  >
                    <span className="text-sm text-gray-400 block">
                      {m.sender_name}
                    </span>
                    <div className="bg-rift-card border border-rift-gold/30 rounded-md p-2">
                      {m.content}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* INPUT */}
            <form
              onSubmit={sendMessage}
              className="p-4 border-t border-rift-gold/30 bg-rift-card flex gap-2"
            >
              <input
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                className="flex-1 border border-rift-gold/40 p-2 rounded bg-white text-black"
                placeholder="Type a message..."
              />
              <button
                type="submit"
                className="px-4 py-2 bg-rift-gold text-black rounded"
              >
                Send
              </button>
            </form>
          </>
        ) : (
          <div className="flex items-center justify-center flex-1">
            <p className="text-gray-400">Select a friend to start chatting 💬</p>
          </div>
        )}
      </main>
    </div>
  );
}
