import { useEffect, useState } from "react";
import AlbumModal from "./AlbumModal.jsx";
import AlbumForm from "./AlbumForm.jsx";

const API_URL = "http://localhost:5000";

export default function GallerySection({ profileUserId, me }) {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openAlbum, setOpenAlbum] = useState(null);
  const [showForm, setShowForm] = useState(false);

  async function fetchAlbums() {
    if (!profileUserId) return;
    const uid = me?.id ? `?meId=${me.id}` : "";
    const res = await fetch(`${API_URL}/api/albums/user/${profileUserId}${uid}`);
    if (!res.ok) {
      console.error("Failed to fetch albums");
      return;
    }
    const data = await res.json();
    setAlbums(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => {
    fetchAlbums();
  }, [profileUserId, me]);

  async function handleLikeAlbum(albumId) {
    if (!me) return alert("Log in to like");
    const res = await fetch(`${API_URL}/api/albums/${albumId}/like`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: me.id }),
    });
    if (!res.ok) return;
    const data = await res.json();
    setAlbums((prev) =>
      prev.map((a) =>
        a.id === albumId
          ? { ...a, like_count: data.like_count, liked_by_me: data.liked ? 1 : 0 }
          : a
      )
    );
  }

  async function handleCreateAlbum(formData) {
    if (!me) return alert("Log in to create");
    const res = await fetch(`${API_URL}/api/albums`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      console.error(await res.text());
      return;
    }
    const newAlbum = await res.json();
    setAlbums((prev) => [newAlbum, ...prev]);
    setShowForm(false);
  }

  if (loading) return <p className="text-gray-600">Loading album...</p>;

  return (
    <div>
      {me && me.id === profileUserId && (
        <button
          onClick={() => setShowForm(true)}
          className="mb-4 px-4 py-2 bg-rift-card text-rift-gold rounded"
        >
          + Create album
        </button>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {albums.map((album) => (
          <div
            key={album.id}
            className="bg-green-950 rounded shadow cursor-pointer overflow-hidden"
            onClick={() => setOpenAlbum(album)}
          >
            {album.cover && (
              <img
                src={`${API_URL}${album.cover}`}
                alt={album.title}
                className="w-full h-40 object-cover"
              />
            )}
            <div className="p-3">
              {/* 🔹 Titel + datum */}
              <h3 className="font-bold text-white">
                {album.title || "Untitled"}
              </h3>
              <div className="text-sm text-white">
                {new Date(album.created_at || Date.now()).toLocaleDateString()}
              </div>

              <div className="flex gap-4 text-sm text-white mt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLikeAlbum(album.id);
                  }}
                  className="flex gap-1 items-center hover:text-rift-gold"
                >
                  {album.liked_by_me ? "👍" : "👍"} {album.like_count || 0}
                </button>
                <span>💬 {album.comment_count || 0}</span>
              </div>
            </div>
          </div>
        ))}
        {albums.length === 0 && (
          <p className="col-span-full text-center text-gray-500">
            No albums yet
          </p>
        )}
      </div>

      {showForm && (
        <AlbumForm
          onClose={() => setShowForm(false)}
          onCreate={handleCreateAlbum}
          me={me}
        />
      )}

      {openAlbum && (
        <AlbumModal
          album={openAlbum}
          onClose={() => {
            setOpenAlbum(null);
            fetchAlbums();
          }}
          me={me}
        />
      )}
    </div>
  );
}
