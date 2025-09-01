import { useState } from "react";
import CommentList from "./CommentList.jsx";

export default function PostCard({ post, me, refresh }) {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [liked, setLiked] = useState(post.liked_by_me);
  const [likeCount, setLikeCount] = useState(post.like_count);

  async function toggleLike() {
    const res = await fetch(`http://localhost:5000/api/user-posts/${post.id}/like`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: me.id }),
    });
    if (res.ok) {
      const data = await res.json();
      setLikeCount(data.like_count);
      setLiked(data.liked);
    }
  }

  return (
    <div className="p-4 border rounded bg-white">
      <p className="font-bold">{post.author}</p>
      <p>{post.content}</p>
      <div className="flex gap-4 text-sm text-gray-600 mt-2">
        <button onClick={toggleLike}>
          {liked ? "👍" : "👍"} {likeCount}
        </button>
        <button onClick={() => setCommentsOpen(!commentsOpen)}>
          💬 {post.comment_count}
        </button>
      </div>

      {commentsOpen && (
        <CommentList postId={post.id} me={me} refresh={refresh} />
      )}
    </div>
  );
}
