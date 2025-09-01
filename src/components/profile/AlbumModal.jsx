import { useEffect, useState } from "react";
import AlbumImageModal from "./AlbumImageModal.jsx";

const API_URL = "http://localhost:5000";

export default function AlbumModal({ album, onClose, me }) {
  const [details, setDetails] = useState(null);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);
  const [openImageId, setOpenImageId] = useState(null);

  async function fetchAlbum() {
    const uid = me?.id ? `?meId=${me.id}` : "";
    const res = await fetch(`${API_URL}/api/albums/${album.id}${uid}`);
    if (!res.ok) {
      console.error("Failed to fetch album details");
      return;
    }
    const data = await res.json();
    setDetails(data);
    setComments(data.comments || []);
  }

  useEffect(() => {
    fetchAlbum();
  }, [album.id, me]);

  async function handleLike() {
    if (!me) return alert("Logga in för att gilla");
    const res = await fetch(`${API_URL}/api/albums/${album.id}/like`, {
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
    const res = await fetch(`${API_URL}/api/albums/${album.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: me.id, content: comment }),
    });
    if (res.ok) {
      const newC = await res.json();
      setComments((prev) => [...prev, newC]);
      setDetails((prev) => ({
        ...prev,
        comment_count: (prev.comment_count || 0) + 1,
      }));
      setComment("");
    }
  }

  if (!details) return null;

  return (
    <div
      className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white text-black rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">{details.title}</h2>
          <button onClick={onClose} className="px-3 py-1 bg-gray-200 rounded">
            Close
          </button>
        </div>

        {/* Bilder */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-4">
          {details.images?.map((img) => (
            <img
              key={img.id}
              src={`${API_URL}${img.media_url}`}
              alt="album item"
              className="w-full h-40 object-cover rounded cursor-pointer hover:opacity-80"
              onClick={() => setOpenImageId(img.id)}
            />
          ))}
        </div>

        {/* Likes */}
        <div className="px-4 py-2 flex gap-4 text-sm text-gray-700">
          <button
            onClick={handleLike}
            className="flex gap-1 items-center hover:text-rift-gold"
          >
            {details.liked_by_me ? "👍" : "👍"} {details.like_count || 0}
          </button>
          <span>💬 {details.comment_count || 0}</span>
        </div>

        {/* Kommentarer */}
        <div className="p-4">
          <h3 className="font-semibold mb-2">Comments</h3>
          {comments.map((c) => (
            <div key={c.id} className="mb-3 border-b pb-2">
              <div className="flex items-center gap-2">
                <img
                  src={
                    c.avatar_url
                      ? c.avatar_url.startsWith("http")
                        ? c.avatar_url
                        : `${API_URL}${c.avatar_url}`
                      : "/images/default-avatar.png"
                  }
                  alt={c.username}
                  className="w-8 h-8 rounded-full"
                />
                <span className="font-medium">{c.username}</span>
              </div>
              <p className="ml-10 text-sm">{c.content}</p>
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
            <p className="text-sm text-gray-500">
              Logga in för att kommentera
            </p>
          )}
        </div>
      </div>

      {openImageId && (
        <AlbumImageModal
          itemId={openImageId}
          onClose={() => setOpenImageId(null)}
          me={me}
        />
      )}
    </div>
  );
}
