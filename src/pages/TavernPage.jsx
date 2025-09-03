// src/pages/TavernPage.jsx
import { useEffect, useState } from "react";
import { getUserFromToken } from "../utils/auth.js";
import { HiOutlineVideoCamera, HiPlay, HiHeart } from "react-icons/hi2";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5000";

export default function TavernPage() {
  const me = getUserFromToken();
  const nav = useNavigate();
  const [highlights, setHighlights] = useState([]);
  const [live, setLive] = useState([]);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [uploading, setUploading] = useState(false);

  async function load() {
    const [h, s] = await Promise.all([
      fetch(`${API_URL}/api/tavern/highlights`).then(r => r.json()),
      fetch(`${API_URL}/api/tavern/streams`).then(r => r.json()),
    ]);
    setHighlights(h);
    setLive(s.filter(x => x.is_live === 1));
  }

  useEffect(() => { load(); }, []);

  async function uploadHighlight(e) {
    e.preventDefault();
    if (!file || !title.trim()) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("userId", me.id);
    fd.append("title", title);
    fd.append("description", desc);
    fd.append("video", file);

    const res = await fetch(`${API_URL}/api/tavern/highlights`, { method: "POST", body: fd });
    setUploading(false);
    if (!res.ok) return alert("Upload failed");
    setFile(null); setTitle(""); setDesc("");
    load();
  }

  async function likeHighlight(id) {
    await fetch(`${API_URL}/api/tavern/highlights/${id}/like`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: me.id })
    });
    load();
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-display text-rift-gold">The Rift Tavern</h1>
        <button
          onClick={() => nav("/tavern/live")}
          className="px-4 py-2 border border-rift-gold/50 rounded-md text-rift-gold hover:bg-rift-card/60"
        >
          Go Live
        </button>
      </div>

      {/* LIVE NOW */}
      <section className="mb-10">
        <h2 className="text-xl text-rift-gold mb-3">Live now</h2>
        {live.length === 0 ? (
          <p className="text-gray-300">No one is live right now.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {live.map((s) => (
              <div key={s.id} className="border border-rift-gold/30 rounded-xl p-3">
                <div className="flex items-center gap-2 text-rift-gold">
                  <HiOutlineVideoCamera className="h-5 w-5" />
                  <span className="font-semibold">{s.title}</span>
                </div>
                <p className="text-sm text-gray-300 mt-1">by {s.author}</p>
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

      {/* UPLOAD HIGHLIGHT */}
      <section className="mb-8">
        <h2 className="text-xl text-rift-gold mb-3">Upload a highlight</h2>
        <form onSubmit={uploadHighlight} className="grid sm:grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Title"
            className="bg-black/30 border border-rift-gold/30 rounded p-2 text-white"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            type="text"
            placeholder="Description (optional)"
            className="bg-black/30 border border-rift-gold/30 rounded p-2 text-white"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
          <input
            type="file"
            accept="video/mp4,video/webm"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="sm:col-span-2"
          />
          <button
            disabled={uploading || !file || !title.trim()}
            className="sm:col-span-2 px-4 py-2 border border-rift-gold/50 rounded-md text-rift-gold hover:bg-rift-card/60 disabled:opacity-60"
          >
            {uploading ? "Uploading…" : "Upload"}
          </button>
        </form>
      </section>

      {/* HIGHLIGHTS LIST */}
      <section>
        <h2 className="text-xl text-rift-gold mb-3">Latest highlights</h2>
        {highlights.length === 0 ? (
          <p className="text-gray-300">Nothing here yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {highlights.map((h) => (
              <div key={h.id} className="border border-rift-gold/30 rounded-xl p-3">
                <video src={h.video_url} controls className="w-full rounded-lg" />
                <div className="mt-2 flex items-center justify-between">
                  <div>
                    <div className="text-white font-semibold">{h.title}</div>
                    <div className="text-xs text-gray-400">by {h.author}</div>
                  </div>
                  <button
                    onClick={() => likeHighlight(h.id)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded bg-rift-card border border-rift-gold/40 hover:bg-rift-card/70"
                  >
                    <HiHeart className="h-4 w-4 text-rift-gold" />
                    <span className="text-white text-sm">{h.like_count}</span>
                  </button>
                </div>

                {/* Simple comments list (write + list) */}
                <HighlightComments highlightId={h.id} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function HighlightComments({ highlightId }) {
  const me = getUserFromToken();
  const [list, setList] = useState([]);
  const [txt, setTxt] = useState("");

  const API_URL = "http://localhost:5000";

  async function load() {
    const r = await fetch(`${API_URL}/api/tavern/highlights/${highlightId}/comments`);
    if (r.ok) setList(await r.json());
  }
  useEffect(() => { load(); }, [highlightId]);

  async function postComment(e) {
    e.preventDefault();
    if (!txt.trim()) return;
    await fetch(`${API_URL}/api/tavern/highlights/${highlightId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: me.id, content: txt.trim() }),
    });
    setTxt("");
    load();
  }

  return (
    <div className="mt-3">
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
      <div className="mt-2 space-y-2">
        {list.map((c) => (
          <div key={c.id} className="text-sm text-gray-200">
            <span className="text-rift-gold">{c.username}</span>: {c.content}
          </div>
        ))}
      </div>
    </div>
  );
}
