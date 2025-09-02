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
    setTitle(data.title);
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
        comment_count: (prev.comment_count || 1) - 1,
      }));
    } else {
      console.error(await res.text());
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

    if (!res.ok) {
      console.error(await res.text());
      return;
    }
    await fetchAlbum();
    setEditMode(false);
  }

  async function handleDeleteAlbum() {
    if (!me) return;
    if (!window.confirm("Är du säker på att du vill radera albumet?")) return;

    const res = await fetch(`${API_URL}/api/albums/${album.id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: me.id }),
    });

    if (!res.ok) {
      console.error(await res.text());
      return;
    }
    onClose();
  }

  async function handleAddImages(e) {
    e.preventDefault();
    if (!me) return;
    if (newImages.length === 0) return;

    const formData = new FormData();
    formData.append("userId", me.id);
    for (let f of newImages) {
      formData.append("images", f);
    }

    const res = await fetch(`${API_URL}/api/albums/${album.id}/images`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      console.error(await res.text());
      return;
    }

    setNewImages([]);
    fetchAlbum();
  }

  async function handleDeleteImage(imageId) {
    if (!me) return;
    if (!window.confirm("Radera denna bild?")) return;

    const res = await fetch(`${API_URL}/api/album-items/${imageId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: me.id }),
    });

    if (!res.ok) {
      console.error(await res.text());
      return;
    }
    fetchAlbum();
  }

  if (!details) return null;

  return (
    <div
      className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white text-black rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center shrink-0 sticky top-0 bg-white z-10">
          {editMode ? (
            <form onSubmit={handleUpdateAlbum} className="flex gap-2 w-full">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="flex-1 border p-2 rounded"
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setCoverFile(e.target.files[0])}
              />
              <button
                type="submit"
                className="px-3 py-1 bg-rift-gold rounded text-black"
              >
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
            <>
              <h2 className="text-xl font-bold">{details.title}</h2>
              {me && me.id === details.user_id && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditMode(true)}
                    className="px-3 py-1 bg-blue-600 text-white rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleDeleteAlbum}
                    className="px-3 py-1 bg-red-600 text-white rounded"
                  >
                    Delete
                  </button>
                  <button
                    onClick={onClose}
                    className="px-3 py-1 bg-gray-200 rounded"
                  >
                    Close
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Content scrollable */}
        <div className="flex-1 overflow-y-auto">
          {/* Bilder */}
          <div className="p-4">
            {me && me.id === details.user_id && (
              <form
                onSubmit={handleAddImages}
                className="mb-4 flex gap-2 items-center"
              >
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setNewImages([...e.target.files])}
                />
                <button
                  type="submit"
                  className="px-3 py-1 bg-green-600 text-white rounded"
                >
                  Add Images
                </button>
              </form>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {details.images?.map((img) => (
                <div key={img.id} className="relative group">
                  <img
                    src={`${API_URL}${img.media_url}`}
                    alt="album item"
                    className="w-full h-40 object-cover rounded cursor-pointer"
                    onClick={() => setOpenImageId(img.id)}
                  />
                  {me && me.id === details.user_id && (
                    <button
                      onClick={() => handleDeleteImage(img.id)}
                      className="absolute top-1 right-1 bg-red-600 text-white px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100"
                    >
                      ✖
                    </button>
                  )}
                </div>
              ))}
            </div>
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

                  {me && me.id === c.user_id && (
                    <button
                      onClick={() => handleDeleteComment(c.id)}
                      className="ml-auto text-xs text-red-600 hover:underline"
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
