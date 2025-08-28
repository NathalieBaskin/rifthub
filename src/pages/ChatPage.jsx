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
  const [myProfile, setMyProfile] = useState(null);

  useEffect(() => {
    document.body.classList.add("chat-page");
    return () => {
      document.body.classList.remove("chat-page");
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const fid = params.get("friend");
    if (fid) setActiveFriend(Number(fid));
  }, [location.search]);

  async function fetchFriends() {
    const res = await fetch(`http://localhost:5000/api/friends/${user.id}`);
    if (!res.ok) return;
    const data = await res.json();
    setFriends(data);
  }

  async function fetchMyProfile() {
    const res = await fetch(`http://localhost:5000/api/profile/${user.id}`);
    if (!res.ok) return;
    const data = await res.json();
    setMyProfile(data);
  }

  async function fetchLastMessages() {
    const res = await fetch(`http://localhost:5000/api/last-messages/${user.id}`);
    if (!res.ok) return;
    const data = await res.json();
    setLastMessages(data);
  }

  async function fetchMessages() {
    if (!activeFriend) return;
    const res = await fetch(`http://localhost:5000/api/messages/${activeFriend}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    if (!res.ok) return;
    const data = await res.json();
    setMessages(data);
    fetchLastMessages();
  }

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
    fetchMyProfile();
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
    <div className="flex min-h-[calc(100vh-80px)] text-gray-200">
      {/* === SIDEBAR === */}
      <aside className="w-64 border-r border-yellow-600/40 bg-black/40 p-4 overflow-y-auto backdrop-blur-[2px]">
        <h2 className="text-lg font-bold text-yellow-400 mb-4 font-LoL">
          Allies
        </h2>
        <ul className="space-y-3">
          {friends.map((f) => {
            const last = lastMessages.find((m) => m.friendId === f.id);
            const isUnread =
              last && last.receiver_id === user.id && last.is_read === 0;

            return (
              <li
                key={f.id}
                className={`p-2 rounded-lg cursor-pointer transition flex flex-col ${
                  activeFriend === f.id
                    ? "bg-yellow-600/20 text-yellow-400"
                    : "hover:bg-white/10"
                }`}
                onClick={() => setActiveFriend(f.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10">
                    <img
                      src={
                        f.avatar_url
                          ? `http://localhost:5000${f.avatar_url}`
                          : "/images/default-avatar.png"
                      }
                      alt={f.username}
                      className="absolute inset-0 m-auto w-[65%] h-[65%] object-cover rounded-full"
                    />
                    <img
                      src="/images/frame.png"
                      alt="Frame"
                      className="absolute inset-0 w-full h-full pointer-events-none"
                    />
                  </div>

                  <span className="truncate font-medium">{f.username}</span>
                  {isUnread && (
                    <span className="ml-auto text-xs bg-red-600 text-white rounded-full px-2">
                      New
                    </span>
                  )}
                </div>
                <span className="ml-12 text-xs text-gray-400 truncate italic">
                  {last
                    ? `${last.sender_name}: ${last.content}`
                    : "No messages yet"}
                </span>
              </li>
            );
          })}
        </ul>
      </aside>

      {/* === CHAT WINDOW === */}
      <main className="flex-1 flex flex-col bg-black/30 backdrop-blur-[2px]">
        {activeFriend ? (
          <>
            <div className="p-4 border-b border-yellow-600/40 bg-black/30 flex items-center gap-2">
              <span className="font-bold text-yellow-400 font-LoL text-lg">
                {friends.find((f) => f.id === activeFriend)?.username || "Chat"}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.length === 0 ? (
                <p className="text-gray-400 italic">No messages yet...</p>
              ) : (
                messages.map((m) => {
                  const sender =
                    m.sender_id === user.id
                      ? myProfile
                      : friends.find((f) => f.id === m.sender_id);

                  return (
                    <div
                      key={m.id}
                      className={`flex items-start gap-3 max-w-2xl ${
                        m.sender_id === user.id
                          ? "ml-auto flex-row-reverse"
                          : "mr-auto"
                      }`}
                    >
                      <div className="relative w-12 h-12 flex-shrink-0">
                        <img
                          src={
                            sender?.avatar_url
                              ? sender.avatar_url.startsWith("http")
                                ? sender.avatar_url
                                : `http://localhost:5000${sender.avatar_url}`
                              : "/images/default-avatar.png"
                          }
                          alt={sender?.username || "User"}
                          className="absolute inset-0 m-auto w-[65%] h-[65%] object-cover rounded-full z-10"
                        />
                        <img
                          src="/images/frame.png"
                          alt="Frame"
                          className="absolute inset-0 w-full h-full pointer-events-none z-20"
                        />
                      </div>

                      <div
                        className={`p-3 rounded-xl shadow-md ${
                          m.sender_id === user.id
                            ? "bg-yellow-600/30 text-yellow-200 border border-yellow-500"
                            : "bg-purple-900/40 text-purple-200 border border-purple-500"
                        }`}
                      >
                        <span className="text-xs block text-gray-300 mb-1">
                          {m.sender_name}
                        </span>
                        <p className="whitespace-pre-line">{m.content}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <form
              onSubmit={sendMessage}
              className="p-4 border-t border-yellow-600/40 bg-black/30 flex gap-3"
            >
              <input
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                className="flex-1 p-3 rounded-xl bg-white/90 text-black border border-yellow-600 focus:outline-none"
                placeholder="Type your message..."
              />
              <button
                type="submit"
                className="px-6 py-2 bg-yellow-500 hover:bg-yellow-400 text-black rounded-xl font-bold shadow-md"
              >
                Send
              </button>
            </form>
          </>
        ) : (
          <div className="flex items-center justify-center flex-1">
            <p className="text-gray-300 italic">
              Select a friend to start chatting 💬
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
