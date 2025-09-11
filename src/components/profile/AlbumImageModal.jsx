import { useEffect, useState } from "react";

const API_URL = "http://localhost:5000";

export default function AlbumImageModal({ itemId, images, onClose, me }) {
  const [details, setDetails] = useState(null);
  const [comment, setComment] = useState("");
  const [currentIndex, setCurrentIndex] = useState(
    images.findIndex((img) => img.id === itemId)
  );

  const currentImage = images[currentIndex];

  async function fetchImage(id) {
    const uid = me?.id ? `?meId=${me.id}` : "";
    const res = await fetch(`${API_URL}/api/album-items/${id}${uid}`);
    if (!res.ok) return;
    const data = await res.json();
    setDetails(data);
  }

  useEffect(() => {
    if (currentImage) fetchImage(currentImage.id);
  }, [currentImage, me]);

  function goPrev() {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  }

  function goNext() {
    if (currentIndex < images.length - 1) setCurrentIndex((i) => i + 1);
  }

  async function handleLike() {
    if (!me) return alert("Logga in för att gilla");
    const res = await fetch(`${API_URL}/api/album-items/${currentImage.id}/like`, {
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
    const res = await fetch(`${API_URL}/api/album-items/${currentImage.id}/comments`, {
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

  async function handleDeleteComment(id) {
    if (!me) return;
    if (!window.confirm("Radera din kommentar?")) return;

    const res = await fetch(`${API_URL}/api/album-item-comments/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: me.id }),
    });

    if (res.ok) {
      setDetails((prev) => ({
        ...prev,
        comments: prev.comments.filter((c) => c.id !== id),
      }));
    }
  }

  if (!details) return null;

  return (
    <div
      className="fixed inset-0 z-70 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-white text-black rounded-lg shadow-lg w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Bild */}
        <div className="relative">
          <img
            src={`${API_URL}${details.media_url}`}
            alt="Album item"
            className="w-full max-h-[55vh] object-contain"
          />

          {/* Prev/Next */}
          {currentIndex > 0 && (
            <button
              onClick={goPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 text-white px-3 py-2 rounded-full"
            >
              ‹
            </button>
          )}
          {currentIndex < images.length - 1 && (
            <button
              onClick={goNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 text-white px-3 py-2 rounded-full"
            >
              ›
            </button>
          )}
        </div>

        {/* Info */}
        <div className="p-4 overflow-y-auto flex-1">
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
                      ? (c.avatar_url.startsWith("http")
                          ? c.avatar_url
                          : `${API_URL}${c.avatar_url}`)
                      : "/images/default-avatar.png"
                  }
                  alt={c.username}
                  className="w-6 h-6 rounded-full"
                />
                <span className="font-medium">{c.username}</span>
                {me && me.id === c.user_id && (
                  <button
                    onClick={() => handleDeleteComment(c.id)}
                    className="ml-auto text-xs text-rift-gold hover:underline"
                  >
                    Delete
                  </button>
                )}
              </div>
              <p className="ml-8 text-sm">{c.content}</p>
            </div>
          ))}
          {me ? (
            <form onSubmit={handleAddComment} className="flex gap-2 mt-3">
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write a comment..."
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
