import { useEffect, useState } from "react";

const API_URL = "http://localhost:5000";

export default function AlbumImageModal({ itemId, onClose, me }) {
  const [details, setDetails] = useState(null);
  const [comment, setComment] = useState("");

  async function fetchImage() {
    const uid = me?.id ? `?meId=${me.id}` : "";
    const res = await fetch(`${API_URL}/api/album-items/${itemId}${uid}`);
    if (!res.ok) return;
    const data = await res.json();
    setDetails(data);
  }

  useEffect(() => {
    fetchImage();
  }, [itemId, me]);

  async function handleLike() {
    if (!me) return alert("Logga in för att gilla");
    const res = await fetch(`${API_URL}/api/album-items/${itemId}/like`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: me.id }),
    });
    if (res.ok) {
      const data = await res.json();
      setDetails((prev) => ({
        ...prev,
        like_count: data.like_count,
        liked_by_me: data.liked ? 1 : 0,
      }));
    }
  }

  async function handleAddComment(e) {
    e.preventDefault();
    if (!comment.trim() || !me) return;
    const res = await fetch(`${API_URL}/api/album-items/${itemId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: me.id, content: comment }),
    });
    if (res.ok) {
      const newC = await res.json();
      setDetails((prev) => ({
        ...prev,
        comments: [...(prev.comments || []), newC],
      }));
      setComment("");
    }
  }

  if (!details) return null;

  return (
    <div
      className="fixed inset-0 z-70 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white text-black rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={`${API_URL}${details.media_url}`}
          alt="Album item"
          className="w-full max-h-[60vh] object-contain"
        />
        <div className="p-4">
          <button
            onClick={handleLike}
            className="flex gap-1 items-center text-sm hover:text-rift-gold"
          >
            {details.liked_by_me ? "👍" : "👍"} {details.like_count || 0}
          </button>
          <h3 className="mt-3 font-semibold">Comments</h3>
          {details.comments?.map((c) => (
            <div key={c.id} className="mt-2 border-b pb-2">
              <div className="flex items-center gap-2">
                <img
                  src={
                    c.avatar_url
                      ? `${API_URL}${c.avatar_url}`
                      : "/images/default-avatar.png"
                  }
                  alt={c.username}
                  className="w-6 h-6 rounded-full"
                />
                <span className="font-medium">{c.username}</span>
              </div>
              <p className="ml-8 text-sm">{c.content}</p>
            </div>
          ))}
          {me ? (
            <form onSubmit={handleAddComment} className="flex gap-2 mt-3">
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Skriv en kommentar..."
                className="flex-1 border p-2 rounded"
              />
              <button
                type="submit"
                className="px-3 py-1 bg-rift-card text-rift-gold rounded"
              >
                Send
              </button>
            </form>
          ) : (
            <p className="text-sm text-gray-500">Logga in för att kommentera</p>
          )}
        </div>
      </div>
    </div>
  );
}
