import { useEffect, useState } from "react";
import PostCard from "./PostCard.jsx";

export default function PostsSection({ profileUserId, me }) {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");

  async function fetchPosts() {
    if (!profileUserId) return;

    const url = me
      ? `http://localhost:5000/api/user-posts/${profileUserId}?meId=${me.id}`
      : `http://localhost:5000/api/user-posts/${profileUserId}`;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load posts");
      const data = await res.json();
      setPosts(data);
    } catch (err) {
      console.error("❌ fetchPosts error:", err);
    }
  }

  async function handleCreatePost(e) {
    e.preventDefault();
    if (!newPost.trim() || !me) return;

    try {
      const res = await fetch("http://localhost:5000/api/user-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: me.id,
          content: newPost,
        }),
      });

      if (res.ok) {
        setNewPost("");
        fetchPosts(); // ladda om efter nytt inlägg
      } else {
        console.error("❌ Failed to create post:", await res.text());
      }
    } catch (err) {
      console.error("❌ handleCreatePost error:", err);
    }
  }

  useEffect(() => {
    fetchPosts();
  }, [profileUserId, me]);

  if (!me) {
    return (
      <p className="text-gray-600">
        ⚠️ Du måste vara inloggad för att skriva inlägg.
      </p>
    );
  }

  return (
    <div>
      {/* Nytt inlägg */}
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
