import { useState } from "react";
import CommentList from "./CommentList.jsx";

const API_URL = "http://localhost:5000";

export default function PostCard({ post, me, refresh }) {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [liked, setLiked] = useState(post.liked_by_me);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [commentCount, setCommentCount] = useState(post.comment_count);

  async function toggleLike() {
    if (!me) return alert("Logga in för att gilla inlägg");

    try {
      const res = await fetch(`${API_URL}/api/user-posts/${post.id}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: me.id }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Något gick fel");
      }

      const data = await res.json();
      setLikeCount(data.like_count);
      setLiked(data.liked);
    } catch (error) {
      console.error("❌ Gilla misslyckades:", error.message);
      alert("Kunde inte gilla inlägget: " + error.message);
    }
  }

  async function handleDelete() {
    if (!me) return alert("Du måste vara inloggad för att radera");
    if (!confirm("Är du säker på att du vill radera detta inlägg?")) return;

    try {
      const res = await fetch(`${API_URL}/api/user-posts/${post.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: me.id }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Okänt fel");
      }

      const result = await res.json();
      console.log("✅ Post raderad:", result);
      refresh();
    } catch (error) {
      console.error("❌ Misslyckades att radera post:", error.message);
      alert("Kunde inte radera: " + error.message);
    }
  }

  return (
    <div className="p-4 border rounded bg-white">
      <div className="flex justify-between items-center">
        <p className="font-bold">{post.author}</p>
        {me && me.id === post.user_id && (
          <button
            onClick={handleDelete}
            className="text-red-600 text-sm hover:underline"
          >
            Delete
          </button>
        )}
      </div>

      <p>{post.content}</p>

      {post.image && (
        <img
          src={`${API_URL}${post.image}`}
          alt="post"
          className="w-full h-48 object-cover rounded mt-2"
        />
      )}

      <div className="flex gap-4 text-sm text-gray-600 mt-2">
        <button
          onClick={toggleLike}
          className="flex items-center gap-1 hover:text-rift-gold"
        >
          {liked ? "👍" : "👍"} {likeCount || 0}
        </button>
        <button
          onClick={() => setCommentsOpen(!commentsOpen)}
          className="hover:text-rift-gold"
        >
          💬 {commentCount || 0}
        </button>
      </div>

      {commentsOpen && (
        <CommentList
          postId={post.id}
          me={me}
          refresh={refresh}
          onCommentAdded={() => setCommentCount((c) => c + 1)} // ✅ direkt update
        />
      )}
    </div>
  );
}
