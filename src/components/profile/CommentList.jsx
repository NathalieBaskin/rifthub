import { useEffect, useState } from "react";

export default function CommentList({ postId, me, refresh, onCommentAdded }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  async function fetchComments() {
    const url = `http://localhost:5000/api/user-posts/${postId}/comments${
      me ? `?meId=${me.id}` : ""
    }`;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      console.log("✅ Hämtade kommentarer:", data);
      setComments(data);
    } catch (err) {
      console.error("❌ fetchComments error:", err.message);
    }
  }

  async function addComment(e) {
    e.preventDefault();
    if (!newComment.trim()) return alert("Kommentaren får inte vara tom");
    if (!me) return alert("Du måste vara inloggad");

    const payload = { userId: me.id, content: newComment };
    console.log("➡️ Skickar kommentar:", payload);

    try {
      const res = await fetch(
        `http://localhost:5000/api/user-posts/${postId}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const text = await res.text();
      console.log("⬅️ Backend-svar:", text);

      if (!res.ok) throw new Error(text);

      const data = JSON.parse(text);
      console.log("✅ Kommentar sparad:", data);

      setNewComment("");
      fetchComments();
      if (refresh) refresh(); // uppdatera post-listan
      if (onCommentAdded) onCommentAdded(); // uppdatera direkt i PostCard
    } catch (err) {
      console.error("❌ addComment error:", err.message);
      alert("Misslyckades att skapa kommentar: " + err.message);
    }
  }

  async function toggleLike(commentId) {
    if (!me) return alert("Logga in för att gilla kommentarer");

    try {
      const res = await fetch(
        `http://localhost:5000/api/user-post-comments/${commentId}/like`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: me.id }),
        }
      );

      if (!res.ok) throw new Error(await res.text());

      console.log("👍 Lyckades toggla like på kommentar:", commentId);
      fetchComments();
    } catch (err) {
      console.error("❌ toggleLike error:", err.message);
    }
  }

  useEffect(() => {
    fetchComments();
  }, [postId, me]);

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

      {me ? (
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
      ) : (
        <p className="text-gray-500 italic text-sm mt-2">
          Logga in för att kommentera
        </p>
      )}
    </div>
  );
}
