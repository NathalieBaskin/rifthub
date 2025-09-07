// src/pages/ChatPage.jsx
import { useEffect, useRef, useState } from "react";
import { getUserFromToken } from "../utils/auth";
import { useLocation, useNavigate } from "react-router-dom";
import { AiOutlinePlus } from "react-icons/ai";

const API_URL = "http://localhost:5000";

/** ==== MOBIL-MÅTT (enligt dina värden) ==== */
const TOP_OFFSET = 70;   // vän-ikonbar startar exakt 70px från toppen i mobil
const HEADER_H  = 88;    // (ikoner h-12 = 48) + (namnrad h-10 = 40) = 88
const INPUT_H   = 64;    // h-16
const FOOTER_H  = 52;    // din fasta länkrad i mobil (justera vid behov)

/** ==== iPad/DEKSTOP-MÅTT ==== */
const NAVBAR_H_MD = 80;      // höjden på din navbar i md+ (justera vid behov)
const SIDEBAR_W   = 256;     // w-64 = 16rem = 256px

export default function ChatPage() {
  const user = getUserFromToken();
  const location = useLocation();
  const navigate = useNavigate();

  const [friends, setFriends] = useState([]);
  const [activeFriend, setActiveFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [lastMessages, setLastMessages] = useState([]);
  const [myProfile, setMyProfile] = useState(null);
  const [showAlliesModal, setShowAlliesModal] = useState(false);

  // Scrollref: mobil och md+ har egna fixed scroll-ytor
  const mobileScrollRef = useRef(null);
  const mdScrollRef = useRef(null);

  const scrollToBottom = () => {
    const el = window.innerWidth < 768 ? mobileScrollRef.current : mdScrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeFriend]);

  // Query friend
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const fid = params.get("friend");
    if (fid) setActiveFriend(Number(fid));
  }, [location.search]);

  // API
  async function fetchFriends() {
    const res = await fetch(`${API_URL}/api/friends/${user.id}`);
    if (!res.ok) return;
    setFriends(await res.json());
  }
  async function fetchMyProfile() {
    const res = await fetch(`${API_URL}/api/profile/${user.id}`);
    if (!res.ok) return;
    setMyProfile(await res.json());
  }
  async function fetchLastMessages() {
    const res = await fetch(`${API_URL}/api/last-messages/${user.id}`);
    if (!res.ok) return;
    setLastMessages(await res.json());
  }
  async function fetchMessages() {
    if (!activeFriend) return;
    const res = await fetch(`${API_URL}/api/messages/${activeFriend}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    if (!res.ok) return;
    setMessages(await res.json());
    fetchLastMessages();
  }
  async function sendMessage(e) {
    e.preventDefault();
    if (!newMsg.trim()) return;
    await fetch(`${API_URL}/api/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ receiverId: activeFriend, content: newMsg }),
    });
    setNewMsg("");
    await fetchMessages();
    scrollToBottom();
  }

  useEffect(() => {
    fetchFriends();
    fetchMyProfile();
    fetchLastMessages();
  }, []);
  useEffect(() => {
    if (!activeFriend) return;
    fetchMessages();
    const t = setInterval(fetchMessages, 5000);
    return () => clearInterval(t);
  }, [activeFriend]);

  // Aktiva chattvänner (med senaste aktivitet)
  const chatFriends = lastMessages
    .map((m) => friends.find((f) => f.id === m.friendId))
    .filter(Boolean);

  return (
    <div className="relative h-screen text-gray-200 overflow-hidden">
      {/* ====== DESKTOP/IPAD (md+) ====== */}
      <div className="hidden md:block h-full">
        {/* Sidebar (samma layout som innan) */}
        <aside
          className="fixed top-0 left-0 w-64 h-full border-r border-yellow-600/40 bg-black/40 overflow-y-auto"
          style={{ paddingTop: NAVBAR_H_MD }}
        >
          <h2 className="text-lg font-bold text-yellow-400 mb-4 px-4 font-LoL">Allies</h2>
          <ul className="space-y-3 px-4 pb-6">
            {friends.map((f) => {
              const last = lastMessages.find((m) => m.friendId === f.id);
              const isUnread = last && last.receiver_id === user.id && last.is_read === 0;
              return (
                <li
                  key={f.id}
                  className={`p-2 rounded-lg cursor-pointer transition flex flex-col ${
                    activeFriend === f.id ? "bg-yellow-600/20 text-yellow-400" : "hover:bg-white/10"
                  }`}
                  onClick={() => setActiveFriend(f.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10">
                      <img
                        src={f.avatar_url ? `${API_URL}${f.avatar_url}` : "/images/default-avatar.png"}
                        alt={f.username}
                        className="absolute inset-0 m-auto w-[65%] h-[65%] object-cover rounded-full"
                      />
                      <img src="/images/frame.png" alt="Frame" className="absolute inset-0 w-full h-full pointer-events-none" />
                    </div>
                    <span className="truncate font-medium">{f.username}</span>
                    {isUnread && <span className="ml-auto text-xs bg-red-600 text-white rounded-full px-2">New</span>}
                  </div>
                  <span className="ml-12 text-xs text-gray-400 truncate italic">
                    {last ? `${last.sender_name}: ${last.content}` : "No messages yet"}
                  </span>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* Chattens scroll-yta i md+: FIXED mellan navbaren och inputen, och förskjuten från vänster med sidebar-bredd */}
        <div
          ref={mdScrollRef}
          className="fixed overflow-y-auto px-6 py-4"
          style={{
            top: NAVBAR_H_MD,         
            left: SIDEBAR_W,          
            right: 0,
            bottom: INPUT_H,          
          }}
        >
          {activeFriend ? (
            messages.length === 0 ? (
              <p className="text-gray-400 italic text-center">No messages yet...</p>
            ) : (
              messages.map((m) => {
                const sender =
                  m.sender_id === user.id ? myProfile : friends.find((f) => f.id === m.sender_id);
                return (
                  <div
                    key={m.id}
                    className={`flex items-start gap-3 max-w-2xl ${
                      m.sender_id === user.id ? "ml-auto flex-row-reverse" : "mr-auto"
                    }`}
                  >
                    <div className="relative w-12 h-12 flex-shrink-0">
                      <img
                        src={
                          sender?.avatar_url
                            ? sender.avatar_url.startsWith("http")
                              ? sender.avatar_url
                              : `${API_URL}${sender.avatar_url}`
                            : "/images/default-avatar.png"
                        }
                        alt={sender?.username || "User"}
                        className="absolute inset-0 m-auto w-[65%] h-[65%] object-cover rounded-full z-10"
                      />
                      <img src="/images/frame.png" alt="Frame" className="absolute inset-0 w-full h-full pointer-events-none z-20" />
                    </div>
                    <div
                      className={`p-3 rounded-xl shadow-md ${
                        m.sender_id === user.id
                          ? "bg-yellow-600/30 text-yellow-200 border border-yellow-500"
                          : "bg-purple-900/40 text-purple-200 border border-purple-500"
                      }`}
                    >
                      <span className="text-xs block text-gray-300 mb-1">{m.sender_name}</span>
                      <p className="whitespace-pre-line">{m.content}</p>
                    </div>
                  </div>
                );
              })
            )
          ) : (
            <p className="text-gray-300 italic text-center mt-8">Select a friend to start chatting 💬</p>
          )}
        </div>

        {/* Input – ALLTID SYNlig i md+ (fixed nere i högerspalten) */}
        {activeFriend && (
          <form
            onSubmit={sendMessage}
            className="fixed z-40 h-16 border-t border-yellow-600/40 bg-black flex items-center gap-3 px-4"
            style={{
              left: SIDEBAR_W,   
              right: 0,
              bottom: 0,
            }}
          >
            <div className="mx-auto flex w-full max-w-4xl gap-3">
              <input
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                className="flex-1 h-11 px-3 rounded-xl bg-white text-black border border-yellow-600 focus:outline-none"
                placeholder="Type your message..."
              />
              <button type="submit" className="h-11 px-5 bg-yellow-500 hover:bg-yellow-400 text-black rounded-xl font-bold shadow-md">
                Send
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ====== MOBIL ====== */}
      <div className="md:hidden h-full">
        {/* Fixed topp (ikoner + namn) */}
        <div className="fixed left-0 right-0 z-10" style={{ top: TOP_OFFSET }}>
          <div className="bg-black h-12 flex items-center gap-3 px-3 overflow-x-auto">
            {chatFriends.map((f) => (
              <button key={f.id} className="relative flex-shrink-0" onClick={() => setActiveFriend(f.id)}>
                <img
                  src={f.avatar_url ? `${API_URL}${f.avatar_url}` : "/images/default-avatar.png"}
                  alt={f.username}
                  className="w-10 h-10 rounded-full object-cover"
                />
              </button>
            ))}
            <button onClick={() => setShowAlliesModal(true)} className="ml-2 p-2 bg-yellow-500 text-black rounded-full">
              <AiOutlinePlus />
            </button>
          </div>
          <div className="bg-black border-t border-yellow-600/40 h-10 flex items-center px-3">
            {activeFriend ? (
              <span
                className="font-bold text-yellow-400 font-LoL cursor-pointer hover:underline"
                onClick={() => navigate(`/profile/${activeFriend}`)}
              >
                {friends.find((f) => f.id === activeFriend)?.username || "Chat"}
              </span>
            ) : (
              <span className="text-gray-400">Choose a chat</span>
            )}
          </div>
        </div>

        {/* Fixed input ovanför mobilfooter */}
        {activeFriend && (
          <form
            onSubmit={sendMessage}
            className="fixed left-0 right-0 z-50 h-16 border-t border-yellow-600/40 bg-black flex items-center gap-3 px-3"
            style={{ bottom: FOOTER_H }}
          >
            <input
              value={newMsg}
              onChange={(e) => setNewMsg(e.target.value)}
              className="flex-1 h-11 px-3 rounded-xl bg-white text-black border border-yellow-600 focus:outline-none"
              placeholder="Type your message..."
            />
            <button type="submit" className="h-11 px-4 bg-yellow-500 hover:bg-yellow-400 text-black rounded-xl font-bold shadow-md">
              Send
            </button>
          </form>
        )}

        {/* Chattytan */}
        <div
          ref={mobileScrollRef}
          className="fixed left-0 right-0 overflow-y-auto px-4"
          style={{
            top: TOP_OFFSET + HEADER_H,
            bottom: FOOTER_H + INPUT_H,
          }}
        >
          <div className="py-3">
            {activeFriend ? (
              messages.length === 0 ? (
                <p className="text-gray-400 italic text-center">No messages yet...</p>
              ) : (
                messages.map((m) => {
                  const sender =
                    m.sender_id === user.id ? myProfile : friends.find((f) => f.id === m.sender_id);
                  return (
                    <div
                      key={m.id}
                      className={`flex items-start gap-3 max-w-2xl ${
                        m.sender_id === user.id ? "ml-auto flex-row-reverse" : "mr-auto"
                      }`}
                    >
                      <div className="relative w-12 h-12 flex-shrink-0">
                        <img
                          src={
                            sender?.avatar_url
                              ? sender.avatar_url.startsWith("http")
                                ? sender.avatar_url
                                : `${API_URL}${sender.avatar_url}`
                              : "/images/default-avatar.png"
                          }
                          alt={sender?.username || "User"}
                          className="absolute inset-0 m-auto w-[65%] h-[65%] object-cover rounded-full z-10"
                        />
                        <img src="/images/frame.png" alt="Frame" className="absolute inset-0 w-full h-full pointer-events-none z-20" />
                      </div>
                      <div
                        className={`p-3 rounded-xl shadow-md ${
                          m.sender_id === user.id
                            ? "bg-yellow-600/30 text-yellow-200 border border-yellow-500"
                            : "bg-purple-900/40 text-purple-200 border border-purple-500"
                        }`}
                      >
                        <span className="text-xs block text-gray-300 mb-1">{m.sender_name}</span>
                        <p className="whitespace-pre-line">{m.content}</p>
                      </div>
                    </div>
                  );
                })
              )
            ) : (
              <p className="text-gray-300 italic text-center mt-8">Select a friend to start chatting 💬</p>
            )}
          </div>
        </div>
      </div>

      {/* Allies Modal */}
      {showAlliesModal && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999]" // <== ändrad till högre z-index
          onClick={() => setShowAlliesModal(false)}
        >
          <div
            className="bg-white text-black rounded-xl p-6 max-w-sm w-full overflow-y-auto max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold mb-4">Start New Chat</h2>
            <ul className="space-y-3">
              {friends.map((f) => (
                <li
                  key={f.id}
                  className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 p-2 rounded"
                  onClick={() => {
                    setActiveFriend(f.id);
                    setShowAlliesModal(false);
                    setTimeout(scrollToBottom, 0);
                  }}
                >
                  <img
                    src={f.avatar_url ? `${API_URL}${f.avatar_url}` : "/images/default-avatar.png"}
                    alt={f.username}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <span>{f.username}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
