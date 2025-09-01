import { useEffect, useState } from "react";

export default function CommentList({ postId, me, refresh }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  async function fetchComments() {
    const res = await fetch(
      `http://localhost:5000/api/user-posts/${postId}/comments?meId=${me.id}`
    );
    if (!res.ok) return;
    const data = await res.json();
    setComments(data);
  }

  async function addComment(e) {
    e.preventDefault();
    if (!newComment.trim()) return;

    const res = await fetch(
      `http://localhost:5000/api/user-posts/${postId}/comments`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: me.id, content: newComment }),
      }
    );

    if (res.ok) {
      setNewComment("");
      fetchComments();
      if (refresh) refresh();
    }
  }

  async function toggleLike(commentId) {
    const res = await fetch(
      `http://localhost:5000/api/user-post-comments/${commentId}/like`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: me.id }),
      }
    );
    if (res.ok) {
      fetchComments();
    }
  }

  useEffect(() => {
    fetchComments();
  }, [postId]);

  return (
    <div className="mt-3 pl-4 border-l">
      {comments.map((c) => (
        <div key={c.id} className="mb-2">
          <p className="font-bold">{c.username}</p>
          <p>{c.content}</p>
          <button onClick={() => toggleLike(c.id)}>
            👍 {c.like_count}
          </button>
        </div>
      ))}

      <form onSubmit={addComment} className="flex gap-2 mt-2">
        <input
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          className="flex-1 border p-1 rounded"
        />
        <button type="submit" className="px-2 bg-rift-gold rounded">
          Send
        </button>
      </form>
    </div>
  );
}
