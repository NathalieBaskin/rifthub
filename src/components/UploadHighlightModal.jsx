import { useState } from "react";
import { getUserFromToken } from "../utils/auth.js";

const API_URL = "http://localhost:5000";

export default function UploadHighlightModal({ open, onClose, onUploaded }) {
  const me = getUserFromToken();
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  async function submit(e) {
    e.preventDefault();
    if (!me) return alert("Logga in först.");
    if (!file || !title.trim()) return;

    setBusy(true);
    const fd = new FormData();
    fd.append("userId", me.id);
    fd.append("title", title.trim());
    fd.append("description", desc.trim());
    fd.append("video", file);

    const r = await fetch(`${API_URL}/api/tavern/highlights`, { method: "POST", body: fd });
    setBusy(false);
    if (!r.ok) return alert("Upload failed");
    setFile(null); setTitle(""); setDesc("");
    onUploaded?.();
    onClose?.();
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60">
      <div className="w-full max-w-xl bg-rift-card border border-rift-gold/40 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-rift-gold">Upload highlight</h3>
          <button onClick={onClose} className="text-gray-300 hover:text-white">✕</button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <input
            type="text"
            placeholder="Title"
            className="w-full bg-black/30 border border-rift-gold/30 rounded p-2 text-white"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            type="text"
            placeholder="Description (optional)"
            className="w-full bg-black/30 border border-rift-gold/30 rounded p-2 text-white"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
          <input
            type="file"
            accept="video/mp4,video/webm"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-gray-200"
          />
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="px-3 py-2 rounded border border-gray-500/50 text-gray-200">
              Cancel
            </button>
            <button
              disabled={busy || !file || !title.trim()}
              className="px-4 py-2 rounded border border-rift-gold/60 text-rift-gold hover:bg-rift-card/70 disabled:opacity-60"
            >
              {busy ? "Uploading…" : "Upload"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
