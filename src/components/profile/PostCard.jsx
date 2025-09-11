// 🔧 FRONTEND — src/components/profile/PostCard.jsx
import { useState } from "react";
import { Link } from "react-router-dom";

const API_URL = "http://localhost:5000";

function resolveAvatar(url) {
  if (!url) return "/images/default-avatar.png";
  if (url.startsWith("http")) return url;
  return `${API_URL}${url}`;
}

export default function PostCard({ post, me, refresh }) {
  const [comment, setComment] = useState("");

  async function handleComment(e) {
    e.preventDefault();
    if (!comment.trim() || !me) return;

    const res = await fetch(`${API_URL}/api/user-posts/${post.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: me.id, content: comment }),
    });

    if (res.ok) {
      setComment("");
      refresh();
    } else {
      console.error("❌ Failed to add comment:", await res.text());
    }
  }

  async function handleDeletePost() {
    if (!me || me.id !== post.user_id) return;
    if (!confirm("Delete this post?")) return;

    const res = await fetch(`${API_URL}/api/user-posts/${post.id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: me.id }),
    });

    if (res.ok) {
      refresh();
    } else {
      console.error("❌ Failed to delete post:", await res.text());
    }
  }

  async function handleDeleteComment(commentId) {
    if (!me) return;
    if (!confirm("Delete this comment?")) return;

    const res = await fetch(`${API_URL}/api/user-post-comments/${commentId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: me.id }),
    });

    if (res.ok) {
      refresh();
    } else {
      console.error("❌ Failed to delete comment:", await res.text());
    }
  }

  return (
    <div className="border border-rift-gold/30 rounded-lg p-4 bg-black/20">
      {/* Post header */}
      <div className="flex items-center gap-3 mb-3">
        <Link to={`/profile/${post.user_id}`}>
          <img
            src={resolveAvatar(post.avatar_url)}
            alt={post.username}
            className="w-10 h-10 rounded-full object-cover border border-rift-gold/30"
          />
        </Link>
        <Link
          to={`/profile/${post.user_id}`}
          className="text-rift-gold font-semibold hover:underline"
        >
          {post.username}
        </Link>

        {me?.id === post.user_id && (
          <button
            onClick={handleDeletePost}
            className="ml-auto hover:opacity-80"
            title="Delete post"
          >
            <img
              src={`${API_URL}/images/trash.png`}
              alt="Delete"
              className="w-5 h-5"
            />
          </button>
        )}
      </div>

      <p className="text-white mb-3">{post.content}</p>

      {/* Comments */}
      {post.comments?.length > 0 && (
        <div className="mt-3 space-y-3 border-t border-rift-gold/20 pt-3">
          {post.comments.map((c) => (
            <div key={c.id} className="flex items-start gap-3">
              <Link to={`/profile/${c.user_id}`}>
                <img
                  src={resolveAvatar(c.avatar_url)}
                  alt={c.username}
                  className="w-8 h-8 rounded-full object-cover border border-rift-gold/30"
                />
              </Link>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <Link
                    to={`/profile/${c.user_id}`}
                    className="text-rift-gold font-medium hover:underline"
                  >
                    {c.username}
                  </Link>
                  {me?.id === c.user_id && (
                    <button
                      onClick={() => handleDeleteComment(c.id)}
                      className="hover:opacity-80"
                      title="Delete comment"
                    >
                      <img
                        src={`${API_URL}/images/trash.png`}
                        alt="Delete"
                        className="w-4 h-4"
                      />
                    </button>
                  )}
                </div>
                <p className="text-sm text-white">{c.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add comment (bara om inloggad) */}
      {me && (
        <form onSubmit={handleComment} className="mt-3 flex gap-2">
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write a comment..."
            className="flex-1 bg-black/30 border border-rift-gold/30 rounded p-2 text-white text-sm"
          />
          <button
            type="submit"
            className="px-3 py-1 border border-rift-gold/50 rounded-md text-rift-gold hover:bg-rift-card/60"
          >
            Send
          </button>
        </form>
      )}
    </div>
  );
}
