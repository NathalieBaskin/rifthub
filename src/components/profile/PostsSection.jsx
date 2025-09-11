import { useEffect, useState } from "react";
import PostCard from "./PostCard.jsx";

const API_URL = "http://localhost:5000";

export default function PostsSection({ profileUserId, me }) {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");

  async function fetchPosts() {
    if (!profileUserId) return;

    const url = me
      ? `${API_URL}/api/user-posts/${profileUserId}?meId=${me.id}`
      : `${API_URL}/api/user-posts/${profileUserId}`;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load posts");
      const data = await res.json();

      // Säkerställ vettig avatar i UI (backend ger relativ path)
      const fixed = data.map((p) => ({
        ...p,
        avatar_url: p.avatar_url
          ? p.avatar_url.startsWith("http")
            ? p.avatar_url
            : `${API_URL}${p.avatar_url}`
          : "/images/default-avatar.png",
        comments: (p.comments || []).map((c) => ({
          ...c,
          avatar_url: c.avatar_url
            ? c.avatar_url.startsWith("http")
              ? c.avatar_url
              : `${API_URL}${c.avatar_url}`
            : "/images/default-avatar.png",
        })),
      }));

      setPosts(fixed);
    } catch (err) {
      console.error("❌ fetchPosts error:", err);
    }
  }

  async function handleCreatePost(e) {
    e.preventDefault();
    if (!newPost.trim() || !me || me.id !== profileUserId) return;

    try {
      const res = await fetch(`${API_URL}/api/user-posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: me.id,
          content: newPost,
        }),
      });

      if (res.ok) {
        setNewPost("");
        fetchPosts();
      } else {
        console.error("❌ Failed to create post:", await res.text());
      }
    } catch (err) {
      console.error("❌ handleCreatePost error:", err);
    }
  }

  useEffect(() => {
    fetchPosts();
  }, [profileUserId, me?.id]);

  return (
    <div>
      {/* Nytt inlägg — endast på din egen profil */}
      {me?.id === profileUserId && (
        <form onSubmit={handleCreatePost} className="mb-4">
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full border rounded p-2"
          />
          <button
            type="submit"
            className="mt-2 bg-green-950 text-white px-4 py-1 rounded"
          >
            Post
          </button>
        </form>
      )}

      {/* Lista av inlägg */}
      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} me={me} refresh={fetchPosts} />
        ))}
        {posts.length === 0 && (
          <p className="text-gray-500 italic">No posts yet...</p>
        )}
      </div>
    </div>
  );
}
