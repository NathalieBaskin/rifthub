// src/pages/ThreadPage.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getUserFromToken } from "../utils/auth";

export default function ThreadPage() {
  const { id } = useParams();
  const [thread, setThread] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const user = getUserFromToken();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchThread() {
      try {
        const res = await fetch(`http://localhost:5000/api/threads/${id}`);
        const data = await res.json();
        setThread(data.thread);
        setComments(data.comments || []);
      } catch (err) {
        console.error("Failed to fetch thread", err);
      } finally {
        setLoading(false);
      }
    }
    fetchThread();
  }, [id]);

  async function handleAddComment() {
    if (!user) return navigate("/auth");
    if (!newComment.trim()) return;

    await fetch(`http://localhost:5000/api/threads/${id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, text: newComment }),
    });

    setComments([...comments, { user: user.username, text: newComment }]);
    setNewComment("");
  }

  if (loading) return <div className="p-6">Loading...</div>;
  if (!thread) return <div className="p-6">Thread not found</div>;

  return (
    <div className="max-w-4xl mx-auto parchment-wrapper mt-6">
      <h1 className="font-display text-2xl text-rift-bg mb-4">{thread.title}</h1>
      <div className="text-sm text-rift-bg/70 mb-6">
        By {thread.author} • {new Date(thread.created_at).toLocaleDateString()} • 👍 {thread.likes}
      </div>
      <p className="whitespace-pre-line text-rift-bg mb-6">{thread.content}</p>

      <button className="px-3 py-1 border border-rift-gold rounded mb-6">👍 Like</button>

      <h2 className="font-bold mb-2">Comments</h2>
      <ul className="space-y-2 mb-4">
        {comments.map((c, i) => (
          <li key={i} className="p-2 border border-rift-gold/30 rounded bg-white/70 text-rift-bg">
            <b>{c.user}:</b> {c.text}
          </li>
        ))}
      </ul>

      {user ? (
        <div className="flex gap-2">
          <input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="flex-1 p-2 border border-rift-gold/30 rounded text-rift-bg"
            placeholder="Write a comment..."
          />
          <button
            onClick={handleAddComment}
            className="px-4 py-2 bg-rift-card text-rift-gold border border-rift-gold/50 rounded"
          >
            Reply
          </button>
        </div>
      ) : (
        <p className="text-sm text-rift-bg/70">You must be logged in to comment.</p>
      )}
    </div>
  );
}
