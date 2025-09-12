// src/components/profile/AlbumModal.jsx
import { useEffect, useState } from "react";
import AlbumImageModal from "./AlbumImageModal.jsx";

const API_URL = "http://localhost:5000";

export default function AlbumModal({ album, onClose, me }) {
  const [details, setDetails] = useState(null);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);
  const [openImageId, setOpenImageId] = useState(null);

  const [editMode, setEditMode] = useState(false);
  const [title, setTitle] = useState("");
  const [coverFile, setCoverFile] = useState(null);
  const [newImages, setNewImages] = useState([]);

  const isOwner = !!(me && details && me.id === details.user_id);

  async function fetchAlbum() {
    const uid = me?.id ? `?meId=${me.id}` : "";
    const res = await fetch(`${API_URL}/api/albums/${album.id}${uid}`);
    if (!res.ok) return;
    const data = await res.json();
    setDetails(data);
    setComments(data.comments || []);
    setTitle(data.title || "");
  }
 useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);
  useEffect(() => {
    fetchAlbum();
  }, [album.id, me?.id]);

  // ---------- Interaktioner ----------
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

  async function handleDeleteComment(commentId) {
    if (!me) return;
    if (!window.confirm("Vill du verkligen radera din kommentar?")) return;

    const res = await fetch(`${API_URL}/api/album-comments/${commentId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: me.id }),
    });

    if (res.ok) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setDetails((prev) => ({
        ...prev,
        comment_count: Math.max((prev.comment_count || 1) - 1, 0),
      }));
    }
  }

  async function handleUpdateAlbum(e) {
    e.preventDefault();
    if (!me) return;
    const formData = new FormData();
    formData.append("userId", me.id);
    formData.append("title", title);
    if (coverFile) formData.append("cover", coverFile);

    const res = await fetch(`${API_URL}/api/albums/${album.id}`, {
      method: "PUT",
      body: formData,
    });
    if (res.ok) {
      await fetchAlbum();
      setEditMode(false);
    }
  }

  async function handleDeleteAlbum() {
    if (!me) return;
    if (!window.confirm("Är du säker på att du vill radera albumet?")) return;
    const res = await fetch(`${API_URL}/api/albums/${album.id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: me.id }),
    });
    if (res.ok) onClose();
  }

  async function handleAddImages(e) {
    e.preventDefault();
    if (!me) return;
    if (newImages.length === 0) return;
    const formData = new FormData();
    formData.append("userId", me.id);
    for (let f of newImages) formData.append("images", f);

    const res = await fetch(`${API_URL}/api/albums/${album.id}/images`, {
      method: "POST",
      body: formData,
    });
    if (res.ok) {
      setNewImages([]);
      fetchAlbum();
    }
  }

  async function handleDeleteImage(imageId) {
    if (!me) return;
    if (!window.confirm("Radera denna bild?")) return;
    const res = await fetch(`${API_URL}/api/album-items/${imageId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: me.id }),
    });
    if (res.ok) fetchAlbum();
  }

  if (!details) return null;

  return (
<div
  className="fixed inset-0 z-60 bg-black/70 flex justify-center items-center xl:items-start xl:pt-20 p-4"
  onClick={onClose}
>
  <div
    className="bg-black/70 text-rift-gold rounded-lg shadow-lg w-full flex flex-col overflow-hidden
               max-w-md max-h-[85vh]
               sm:max-w-lg
               md:max-w-3xl md:max-h-[85vh]
               xl:max-w-3xl xl:max-h-[75vh]"
    onClick={(e) => e.stopPropagation()}
  >
        {/* Header */}
        <div className="p-3 border-b flex items-center justify-between gap-3 sticky top-0 bg-black z-20">
          {editMode ? (
            <form
              onSubmit={handleUpdateAlbum}
              className="flex flex-wrap items-center gap-2 w-full"
            >
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="flex-1 border p-1 rounded min-w-[140px]"
                placeholder="Album title"
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setCoverFile(e.target.files[0])}
                className="min-w-[180px]"
              />
              <button type="submit" className="px-3 py-1 bg-rift-gold rounded text-black">
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditMode(false)}
                className="px-3 py-1 bg-gray-300 rounded"
              >
                Cancel
              </button>
            </form>
          ) : (
            <h2 className="text-lg font-bold truncate">{details.title}</h2>
          )}

          <div className="flex gap-2 shrink-0">
            {isOwner && !editMode && (
              <button
                onClick={() => setEditMode(true)}
                className="px-3 py-1 bg-rift-gold text-black hover:bg-white transition hover:text-black transition rounded"
              >
                Edit
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded bg-red-600 text-white font-bold"
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto w-full mx-auto max-w-4xl">
          {editMode && isOwner && (
            <div className="p-4 space-y-4">
              <form
                onSubmit={handleAddImages}
                className="flex flex-wrap gap-2 items-center"
              >
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setNewImages([...e.target.files])}
                />
                <button type="submit" className="px-3 py-1 bg-green-600 text-white rounded">
                  Add Images
                </button>
              </form>
              <button
                onClick={handleDeleteAlbum}
                className="px-3 py-1 bg-red-700 text-white rounded"
              >
                Delete Album
              </button>
            </div>
          )}

          {/* Bilder */}
          <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {details.images?.map((img) => (
              <div key={img.id} className="relative group">
                <img
                  src={`${API_URL}${img.media_url}`}
                  alt="album item"
                  className="w-full h-40 object-cover rounded cursor-pointer"
                  onClick={() => !editMode && setOpenImageId(img.id)}
                />
                {editMode && isOwner && (
                  <button
                    onClick={() => handleDeleteImage(img.id)}
                    className="absolute top-1 right-1 bg-red-600 text-white px-2 py-1 text-xs rounded"
                  >
                    ✖
                  </button>
                )}
              </div>
            ))}
          </div>

          {!editMode && (
            <div className="px-4 pb-2 flex gap-4 text-sm text-white">
              <button
                onClick={handleLike}
                className="flex gap-1 items-center hover:text-rift-gold"
              >
                👍 {details.like_count || 0}
              </button>
              <span>💬 {details.comment_count || 0}</span>
            </div>
          )}

          {/* Comments */}
          {!editMode && (
            <div className="px-4 pb-4 max-h-[250px] sm:max-h-[300px] xl:max-h-[350px] overflow-y-auto">
              <h3 className="font-semibold mb-2">Comments</h3>
              {comments.map((c) => (
                <div key={c.id} className="mb-3 border-b pb-2">
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
                      className="w-8 h-8 rounded-full"
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
                  <p className="ml-10 text-sm">{c.content}</p>
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
                  <button type="submit" className="px-3 py-1 bg-rift-card text-rift-gold rounded">
                    Send
                  </button>
                </form>
              ) : (
                <p className="text-sm text-gray-500">Logga in för att kommentera</p>
              )}
            </div>
          )}
        </div>
      </div>

      {openImageId && (
        <AlbumImageModal
          itemId={openImageId}
          images={details.images}
          onClose={() => setOpenImageId(null)}
          me={me}
        />
      )}
    </div>
  );
}
