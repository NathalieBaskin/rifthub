// src/pages/TavernPage.jsx
import { useEffect, useState } from "react";
import { HiOutlineVideoCamera, HiPlay, HiHeart } from "react-icons/hi2";
import { useNavigate, Link } from "react-router-dom";
import { getUserFromToken } from "../utils/auth.js";
import { timeAgo } from "../utils/time.js";
import UploadHighlightModal from "../components/UploadHighlightModal.jsx";

const API_URL = "http://localhost:5000";

export default function TavernPage() {
  const me = getUserFromToken();
  const nav = useNavigate();

  const [highlights, setHighlights] = useState([]);
  const [live, setLive] = useState([]);
  const [openModal, setOpenModal] = useState(false);

  async function load() {
    const [h, s] = await Promise.all([
      fetch(`${API_URL}/api/tavern/highlights?meId=${me?.id || ""}`).then((r) =>
        r.json()
      ),
      fetch(`${API_URL}/api/tavern/streams`).then((r) => r.json()),
    ]);
    setHighlights(h);
    setLive(s.filter((x) => Number(x.is_live) === 1));
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  async function toggleLikeHighlight(id) {
    await fetch(`${API_URL}/api/tavern/highlights/${id}/like`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: me.id }),
    });
    load();
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Topp: rubrik + iPad/desktop-knappar */}
      <div className="flex items-center justify-between mb-3 md:mb-6">
        <h1 className="text-3xl font-display text-rift-white">The Rift Tavern</h1>

        {/* iPad/desktop (md+) – bildknappar */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => setOpenModal(true)}
            className="p-0 bg-transparent shrink-0"
            aria-label="Upload highlight"
            title="Upload highlight"
          >
            <img
              src={`${API_URL}/images/highlight-button.png`}
              alt="Upload highlight"
              className="block h-9 md:h-28 lg:h-24 w-auto select-none"
              draggable="false"
            />
          </button>

          <button
            onClick={() => nav("/tavern/live")}
            className="p-0 bg-transparent shrink-0"
            aria-label="Go Live"
            title="Go Live"
          >
            <img
              src={`${API_URL}/images/live-button.png`}
              alt="Go Live"
              className="block h-9 md:h-20 lg:h-20 w-auto select-none"
              draggable="false"
            />
          </button>
        </div>
      </div>

      {/* Mobil (under rubriken) – bildknappar synliga även på små skärmar */}
      <div className="md:hidden flex items-center gap-3 mb-6">
        <button
          onClick={() => setOpenModal(true)}
          className="p-0 bg-transparent shrink-0"
          aria-label="Upload highlight"
          title="Upload highlight"
        >
       <img
  src={`${API_URL}/images/highlight-button.png`}
  alt="Upload highlight"
  className="block h-28 md:h-28 lg:h-24 w-auto select-none
          filter drop-shadow-[0_0_10px_rgba(0,0,0,0.35)]
             hover:drop-shadow-[0_0_16px_rgba(0,0,0,0.99)]
             transition"
  draggable="false"
/>

        </button>

        <button
          onClick={() => nav("/tavern/live")}
          className="p-0 bg-transparent shrink-0"
          aria-label="Go Live"
          title="Go Live"
        >
    <img
  src={`${API_URL}/images/live-button.png`}
  alt="Go Live"
  className="block h-24 md:h-20 lg:h-20 w-auto select-none
                filter drop-shadow-[0_0_10px_rgba(0,0,0,0.35)]
             hover:drop-shadow-[0_0_16px_rgba(0,0,0,0.99)]
             transition"
/>

        </button>
      </div>

      {/* LIVE NOW */}
      <section className="mb-10">
        <h2 className="text-xl text-white mb-3">Live now</h2>
        {live.length === 0 ? (
          <p className="text-gray-300">No one is live right now.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {live.map((s) => (
              <div
                key={s.id}
                className="border border-rift-gold/30 rounded-xl p-3"
              >
                <div className="flex items-center gap-2 text-rift-gold">
                  <HiOutlineVideoCamera className="h-5 w-5" />
                  <span className="font-semibold">{s.title}</span>
                </div>
                <p className="text-sm text-gray-300 mt-1">
                  by{" "}
                  <Link
                    to={`/profile/${s.id}`}
                    className="text-rift-gold hover:underline"
                  >
                    {s.author}
                  </Link>
                </p>
                <button
                  onClick={() => nav(`/tavern/watch/${s.id}`)}
                  className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded bg-rift-card border border-rift-gold/40 hover:bg-rift-card/70"
                >
                  <HiPlay /> Watch
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* HIGHLIGHTS LIST */}
      <section>
        <h2 className="text-xl text-rift-gold mb-3">Latest highlights</h2>
        {highlights.length === 0 ? (
          <p className="text-gray-300">Nothing here yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {highlights.map((h) => (
              <HighlightCard
                key={h.id}
                h={h}
                onLike={() => toggleLikeHighlight(h.id)}
              />
            ))}
          </div>
        )}
      </section>

      <UploadHighlightModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onUploaded={load}
      />
    </div>
  );
}

export function HighlightCard({ h, onLike }) {
  return (
    <div className="border border-rift-gold/30 rounded-xl p-3 bg-black/20">
      {/* Header med avatar + namn */}
      <div className="flex items-center gap-3 mb-3">
        <Link to={`/profile/${h.user_id}`} className="flex items-center gap-2">
          <img
            src={
              h.avatar_url
                ? `${API_URL}${h.avatar_url}`
                : "/images/default-avatar.png"
            }
            alt={h.author}
            className="h-9 w-9 rounded-full object-cover border border-rift-gold/30"
          />
          <div>
            <span className="text-rift-gold font-semibold hover:underline">
              {h.author}
            </span>
            <div className="text-xs text-gray-400">{timeAgo(h.created_at)}</div>
          </div>
        </Link>
      </div>

      {/* Video */}
      <div className="rounded-lg overflow-hidden">
        <video
          src={`${API_URL}${h.video_url}`}
          controls
          preload="metadata"
          crossOrigin="anonymous"
          className="w-full h-auto bg-black"
          style={{ maxHeight: 420 }}
        />
      </div>

      {/* Titel & beskrivning */}
      <div className="mt-2">
        <div className="text-white font-semibold">{h.title}</div>
        {h.description && (
          <div className="text-sm text-gray-300 mt-1">{h.description}</div>
        )}
      </div>

      {/* Like-knapp */}
      <div className="mt-3 flex items-center justify-between">
        <button
          onClick={onLike}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded bg-rift-card border border-rift-gold/40 hover:bg-rift-card/70 ${
            h.liked_by_me ? "ring-1 ring-rift-gold/60" : ""
          }`}
          title={h.liked_by_me ? "Unlike" : "Like"}
        >
          <HiHeart
            className={`h-5 w-5 ${
              h.liked_by_me ? "text-rift-gold" : "text-gray-300"
            }`}
          />
        <span className="text-white text-sm">{h.like_count}</span>
        </button>
      </div>

      {/* Kommentarer */}
      <HighlightComments highlightId={h.id} />
    </div>
  );
}

function HighlightComments({ highlightId }) {
  const me = getUserFromToken();
  const [list, setList] = useState([]);
  const [txt, setTxt] = useState("");

  async function load() {
    const r = await fetch(
      `${API_URL}/api/tavern/highlights/${highlightId}/comments`
    );
    if (r.ok) setList(await r.json());
  }

  useEffect(() => {
    load();
  }, [highlightId]);

  async function postComment(e) {
    e.preventDefault();
    if (!me) return alert("Logga in först.");
    if (!txt.trim()) return;
    await fetch(`${API_URL}/api/tavern/highlights/${highlightId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: me.id, content: txt.trim() }),
    });
    setTxt("");
    load();
  }

  async function delComment(id) {
    if (!me) return alert("Logga in först.");
    if (!confirm("Delete this comment?")) return;
    const r = await fetch(`${API_URL}/api/tavern/highlight-comments/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: me.id }),
    });
    if (r.ok) {
      setList((prev) => prev.filter((c) => c.id !== id));
    } else {
      const e = await r.json().catch(() => ({}));
      alert(e?.error || "Failed to delete");
    }
  }

  return (
    <div className="mt-3">
      {/* Skriv kommentar */}
      <form onSubmit={postComment} className="flex gap-2">
        <input
          className="flex-1 bg-black/30 border border-rift-gold/30 rounded p-2 text-white"
          placeholder="Write a comment…"
          value={txt}
          onChange={(e) => setTxt(e.target.value)}
        />
        <button className="px-3 py-2 border border-rift-gold/50 rounded-md text-rift-gold hover:bg-rift-card/60">
          Send
        </button>
      </form>

      {/* Lista kommentarer */}
      <div className="mt-2 space-y-3">
        {list.map((c) => {
          const mine = me && me.username === c.username;
          return (
            <div key={c.id} className="flex items-start gap-2">
              <Link to={`/profile/${c.user_id}`}>
                <img
                  src={
                    c.avatar_url
                      ? `${API_URL}${c.avatar_url}`
                      : "/images/default-avatar.png"
                  }
                  alt={c.username}
                  className="h-7 w-7 rounded-full object-cover border border-rift-gold/30 mt-0.5"
                />
              </Link>

              <div className="flex-1 text-sm">
                <div className="flex items-center gap-2 text-gray-300">
                  <Link
                    to={`/profile/${c.user_id}`}
                    className="text-rift-gold font-medium hover:underline"
                  >
                    {c.username}
                  </Link>
                  <span className="text-xs text-gray-500">
                    {timeAgo(c.created_at)}
                  </span>
                  {mine && (
                    <button
                      onClick={() => delComment(c.id)}
                      className="ml-2 text-xs text-red-400 hover:text-red-300"
                      title="Delete"
                    >
                      Delete
                    </button>
                  )}
                </div>
                <div className="text-white">{c.content}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
