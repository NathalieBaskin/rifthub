// src/pages/SummonersHall.jsx
import React, { useMemo, useState, useEffect } from "react";
import { getUserFromToken } from "../utils/auth.js";
import { FaEdit, FaTrash } from "react-icons/fa";
import { AiOutlineLike, AiFillLike, AiOutlineComment } from "react-icons/ai";

const API_URL = "http://localhost:5000";

const TOPICS = [
  { id: 0, key: "all", name: "All Threads" },
  { id: 1, key: "guides", name: "Guides & Builds" },
  { id: 2, key: "champions", name: "Champs & Database" },
  { id: 3, key: "tft", name: "Teamfight Tactics" },
  { id: 4, key: "tiers", name: "Tier Lists" },
  { id: 5, key: "news", name: "News" },
  { id: 6, key: "free", name: "Free Talk" },
];

function useNavOffset() {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    const header =
      document.querySelector("header[data-nav]") ||
      document.querySelector("header");
    const measure = () => setOffset(header?.offsetHeight ?? 0);
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, { passive: true });
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure);
    };
  }, []);
  return offset;
}

function SideRail({ topic, setTopic, onNewThread }) {
  return (
    <aside className="paper-rail">
      <div className="flex justify-end mb-4">
        <button
          onClick={onNewThread}
          className="px-4 py-2 rounded bg-rift-card text-rift-gold hover:bg-rift-card/80"
        >
          + Create
        </button>
      </div>

      <details className="paper-acc" open>
        <summary className="paper-acc__summary">TOPICS</summary>
        <ul className="paper-list">
          {TOPICS.map((t) => {
            const active = topic === t.key;
            return (
              <li key={t.id}>
                <button
                  onClick={() => setTopic(t.key)}
                  className={[
                    "paper-tab",
                    active ? "paper-tab--active" : "paper-tab--idle",
                  ].join(" ")}
                >
                  {t.name}
                </button>
              </li>
            );
          })}
        </ul>
      </details>
    </aside>
  );
}

function ThreadRow({ t, onOpen, onLike, onEdit, onDelete, user }) {
  const hasLiked = !!t.liked_by_me;

  return (
    <li>
      <div
        className="w-full text-left px-5 md:px-6 py-5 rounded-lg hover:bg-black/5 transition cursor-pointer"
        onClick={() => onOpen(t)}
      >
        <div className="flex items-start gap-4">
          {t.thumb && (
            <img
              src={`${API_URL}${t.thumb}`}
              alt="thumb"
              className="w-12 h-12 md:w-14 md:h-14 rounded-md object-cover ring-1 ring-black/10"
            />
          )}
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-xl text-rift-bg line-clamp-1">
              {t.title}
            </h3>
            <p className="mt-1 text-sm text-rift-bg/85 line-clamp-2">
              {t.content}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-rift-bg/70">
              <span>
                By <span className="font-medium">{t.author}</span>
              </span>
              <span>• {new Date(t.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 px-6 py-2 text-sm text-rift-bg/70">
        <button
          className="flex items-center gap-1 hover:text-rift-gold"
          onClick={(e) => {
            e.stopPropagation();
            onLike(t);
          }}
        >
          {hasLiked ? <AiFillLike /> : <AiOutlineLike />}
          {t.like_count || 0}
        </button>

        <button
          className="flex items-center gap-1 hover:text-rift-gold"
          onClick={(e) => {
            e.stopPropagation();
            onOpen(t);
          }}
        >
          <AiOutlineComment />
          {t.comment_count || 0}
        </button>

        {user && user.id === t.user_id && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(t);
              }}
              className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <FaEdit /> Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(t);
              }}
              className="text-red-600 hover:text-red-800 flex items-center gap-1"
            >
              <FaTrash /> Delete
            </button>
          </>
        )}
      </div>

      <div className="paper-divider" />
    </li>
  );
}

function ThreadModal({
  thread,
  onClose,
  user,
  onCommentCountChange,
  onThreadEdited,
  onThreadDeleted,
}) {
  const [comments, setComments] = useState([]);
  const [replyOpen, setReplyOpen] = useState({});
  const [replyText, setReplyText] = useState({});
  const [text, setText] = useState("");
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    if (!thread) return;
    const uid = user?.id ? `?userId=${user.id}` : "";
    fetch(`${API_URL}/api/threads/${thread.id}/comments${uid}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setComments(data);
        else setComments([]);
      })
      .catch((err) => {
        console.error("Failed to load comments:", err);
        setComments([]);
      });
  }, [thread, user?.id]);

  if (!thread) return null;

  const resolveAvatar = (path) => {
    if (!path) return "/default-avatar.png";
    return path.startsWith("/uploads") ? `${API_URL}${path}` : path;
  };

  const toggleReply = (cid) =>
    setReplyOpen((p) => ({ ...p, [cid]: !p[cid] }));

  const onReplyChange = (cid, val) =>
    setReplyText((p) => ({ ...p, [cid]: val }));

  async function handlePostComment(parentId = null, contentOverride = null) {
    if (!user) return alert("Log in to comment");
    const content = contentOverride ?? (parentId ? replyText[parentId] : text);
    if (!content || !content.trim()) return;

    const res = await fetch(`${API_URL}/api/threads/${thread.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        content,
        parent_id: parentId || null,
      }),
    });
    if (!res.ok) return;
    const newComment = await res.json();
    setComments((prev) => [...prev, newComment]);
    onCommentCountChange?.(thread.id, +1);

    if (parentId) {
      setReplyText((p) => ({ ...p, [parentId]: "" }));
      setReplyOpen((p) => ({ ...p, [parentId]: false }));
    } else {
      setText("");
    }
  }

  async function handleToggleLikeComment(commentId) {
    if (!user) return alert("Log in to like");
    const res = await fetch(`${API_URL}/api/comments/${commentId}/like`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id }),
    });
    if (!res.ok) return;
    const { like_count, liked } = await res.json();
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId ? { ...c, like_count, liked_by_me: liked ? 1 : 0 } : c
      )
    );
  }

  async function handleDeleteComment(commentId) {
    if (!user) return;
    const res = await fetch(`${API_URL}/api/comments/${commentId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id }),
    });
    if (!res.ok) return;
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    onCommentCountChange?.(thread.id, -1);
  }

  async function handleEditCommentSave() {
    if (!editingComment) return;
    const res = await fetch(`${API_URL}/api/comments/${editingComment.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, content: editText }),
    });
    if (!res.ok) return;
    setComments((prev) =>
      prev.map((c) => (c.id === editingComment.id ? { ...c, content: editText } : c))
    );
    setEditingComment(null);
    setEditText("");
  }

  const tree = (() => {
    const byId = new Map();
    comments.forEach((c) => byId.set(c.id, { ...c, children: [] }));
    const roots = [];
    byId.forEach((c) => {
      if (c.parent_id) {
        const parent = byId.get(c.parent_id);
        if (parent) parent.children.push(c);
        else roots.push(c);
      } else roots.push(c);
    });
    return roots;
  })();

  function CommentItem({ c, depth = 0 }) {
    const liked = !!c.liked_by_me;
    const canEdit = user && user.id === c.user_id;

    return (
      <div className="mb-3" style={{ marginLeft: depth ? depth * 16 : 0 }}>
        <div className="flex items-start gap-3">
          <img
            src={resolveAvatar(c.avatar_url)}
            alt="avatar"
            className="w-8 h-8 rounded-full"
          />
          <div className="flex-1">
            <a
              href={`/profile/${c.user_id}`}
              className="font-medium text-rift-gold hover:underline"
            >
              {c.username}
            </a>

            {editingComment?.id === c.id ? (
              <div className="mt-1">
                <textarea
                  className="w-full border rounded p-2 text-sm"
                  rows={3}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                />
                <div className="mt-1 flex gap-2 text-xs">
                  <button
                    className="px-3 py-1 rounded bg-rift-card text-rift-gold"
                    onClick={handleEditCommentSave}
                  >
                    Save
                  </button>
                  <button
                    className="px-3 py-1 rounded bg-gray-200"
                    onClick={() => {
                      setEditingComment(null);
                      setEditText("");
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm">{c.content}</p>
            )}

            <div className="flex items-center gap-3 text-xs text-rift-bg/70 mt-1">
              <button
                onClick={() => handleToggleLikeComment(c.id)}
                className="flex items-center gap-1 hover:text-rift-gold"
              >
                {liked ? <AiFillLike /> : <AiOutlineLike />} {c.like_count || 0}
              </button>
              <button
                className="hover:underline"
                onClick={() => toggleReply(c.id)}
              >
                Reply
              </button>
              {canEdit && editingComment?.id !== c.id && (
                <button
                  className="hover:underline text-blue-600"
                  onClick={() => {
                    setEditingComment(c);
                    setEditText(c.content); // ✅ initiera lokalt state
                  }}
                >
                  Edit
                </button>
              )}
              {canEdit && (
                <button
                  onClick={() => handleDeleteComment(c.id)}
                  className="hover:underline text-red-600"
                >
                  Delete
                </button>
              )}
            </div>

            {replyOpen[c.id] && (
              <div className="mt-2 flex gap-2">
                <input
                  className="flex-1 border rounded p-2 text-sm"
                  placeholder={`Reply to ${c.username}...`}
                  value={replyText[c.id] || ""}
                  onChange={(e) => onReplyChange(c.id, e.target.value)}
                />
                <button
                  className="bg-rift-card text-rift-gold px-3 py-2 rounded"
                  onClick={() => handlePostComment(c.id)}
                >
                  Reply
                </button>
              </div>
            )}

            {c.children?.length > 0 &&
              c.children.map((child) => (
                <CommentItem key={child.id} c={child} depth={depth + 1} />
              ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="max-w-3xl w-full parchment-panel rounded-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-0 bg-white/90 text-rift-bg rounded-lg">
          <div className="p-6 border-b sticky top-0 bg-white/90 flex items-start gap-2 z-10">
            <div className="flex-1">
              <h3 className="font-display text-2xl md:text-3xl">{thread.title}</h3>
              <div className="mt-2 text-xs">
                By <span className="font-medium">{thread.author}</span> •{" "}
                {new Date(thread.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8 max-h-[70vh] overflow-y-auto">
            <pre className="whitespace-pre-wrap font-sans text-[15px]">
              {thread.content}
            </pre>

            <div className="mt-6">
              <h4 className="font-semibold mb-2">Comments</h4>
              {tree.map((c) => (
                <CommentItem key={c.id} c={c} />
              ))}

              {user ? (
                <div className="mt-2 flex gap-2">
                  <input
                    className="flex-1 border rounded p-2"
                    placeholder="Write a comment..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />
                  <button
                    className="bg-rift-card text-rift-gold px-4 py-2 rounded"
                    onClick={() => handlePostComment(null)}
                  >
                    Post
                  </button>
                </div>
              ) : (
                <p className="text-sm text-rift-bg/70 mt-2">
                  You must{" "}
                  <a href="/auth" className="text-rift-gold underline">
                    log in
                  </a>{" "}
                  to comment.
                </p>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded-md border border-gray-400 bg-gray-200 hover:bg-gray-300"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NewThreadModal({ onClose, onCreate }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [topicId, setTopicId] = useState(TOPICS[1].id);

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white text-black rounded-lg shadow-lg p-6 w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4">Create new thread</h2>
        <label className="block mb-2">
          Title:
          <input
            className="w-full border p-2 rounded"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label className="block mb-2">
          Content:
          <textarea
            className="w-full border p-2 rounded"
            rows={5}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </label>
        <label className="block mb-2">
          Topic:
          <select
            className="w-full border p-2 rounded"
            value={topicId}
            onChange={(e) => setTopicId(Number(e.target.value))}
          >
            {TOPICS.filter((t) => t.id !== 0).map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block mb-2">
          Upload image (optional):
          <input
            type="file"
            accept="image/*"
            className="w-full"
            onChange={(e) => setFile(e.target.files[0])}
          />
        </label>
        <div className="flex justify-end gap-2 mt-4">
          <button className="px-4 py-2 bg-gray-300 rounded" onClick={onClose}>
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-rift-card text-rift-gold rounded"
            onClick={() => onCreate({ title, content, topicId, file })}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SummonersHall() {
  const [topic, setTopic] = useState("all");
  const [threads, setThreads] = useState([]);
  const [open, setOpen] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const navOffset = useNavOffset();
  const user = getUserFromToken();

  async function loadThreads() {
    const uid = user?.id ? `?userId=${user.id}` : "";
    const res = await fetch(`${API_URL}/api/threads${uid}`);
    const data = await res.json();
    setThreads(data);
  }

  useEffect(() => {
    loadThreads();
  }, [user?.id]);

  const list = useMemo(() => {
    if (topic === "all") return threads;
    return threads.filter((t) => {
      const topicObj = TOPICS.find((x) => x.id === t.topic_id);
      return topicObj?.key === topic;
    });
  }, [topic, threads]);

  async function handleLike(thread) {
    if (!user) return alert("Log in to like posts");
    const res = await fetch(`${API_URL}/api/threads/${thread.id}/like`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id }),
    });
    if (!res.ok) return;
    const { like_count, liked } = await res.json();
    setThreads((prev) =>
      prev.map((t) =>
        t.id === thread.id ? { ...t, like_count, liked_by_me: liked ? 1 : 0 } : t
      )
    );
  }

  async function handleCreateThread({ title, content, topicId, file }) {
    if (!user) return alert("Log in to create thread");
    const formData = new FormData();
    formData.append("userId", user.id);
    formData.append("title", title);
    formData.append("content", content);
    formData.append("topic_id", topicId);
    if (file) formData.append("thumb", file);

    const res = await fetch(`${API_URL}/api/threads`, { method: "POST", body: formData });
    if (!res.ok) return;
    const newThread = await res.json();
    setThreads((prev) => [newThread, ...prev]);
    setShowNew(false);
  }

  async function handleDeleteThread(thread) {
    if (!user) return;
    if (!confirm("Delete this thread?")) return;
    const res = await fetch(`${API_URL}/api/threads/${thread.id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id }),
    });
    if (!res.ok) return;
    setThreads((prev) => prev.filter((t) => t.id !== thread.id));
    if (open?.id === thread.id) setOpen(null);
  }

  function handleThreadEdited(id, patch) {
    setThreads((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    if (open?.id === id) setOpen({ ...open, ...patch });
  }

  function handleCommentCountChange(threadId, delta) {
    setThreads((prev) =>
      prev.map((t) =>
        t.id === threadId ? { ...t, comment_count: (t.comment_count || 0) + delta } : t
      )
    );
    if (open?.id === threadId) setOpen((o) => ({ ...o, comment_count: (o.comment_count || 0) + delta }));
  }

  return (
    <div className="min-h-screen bg-transparent">
      <div
        className="parchment-wrapper min-h-[1100px]"
        style={{ marginTop: (navOffset || 0) - 90 }}
      >
        <h1 className="font-display text-3xl md:text-4xl text-rift-bg text-center mb-6">
          Summoner&apos;s Hall
        </h1>
        <div
          className="hidden md:grid gap-6"
          style={{ gridTemplateColumns: "420px 1fr" }}
        >
          <SideRail
            topic={topic}
            setTopic={setTopic}
            onNewThread={() =>
              user ? setShowNew(true) : alert("Log in to create a thread")
            }
          />
          <div className="flex-1 pt-8 pl-1">
            <ul>
              {list.map((t) => (
                <ThreadRow
                  key={t.id}
                  t={t}
                  user={user}
                  onOpen={setOpen}
                  onLike={handleLike}
                  onEdit={(thr) => {
                    setOpen(thr);
                  }}
                  onDelete={handleDeleteThread}
                />
              ))}
              {list.length === 0 && (
                <li className="px-4 py-10 text-center text-rift-bg/70">
                  No threads found.
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {open && (
        <ThreadModal
          thread={open}
          onClose={() => setOpen(null)}
          user={user}
          onCommentCountChange={handleCommentCountChange}
          onThreadEdited={handleThreadEdited}
          onThreadDeleted={(id) => {
            setThreads((prev) => prev.filter((t) => t.id !== id));
          }}
        />
      )}

      {showNew && (
        <NewThreadModal
          onClose={() => setShowNew(false)}
          onCreate={handleCreateThread}
        />
      )}
    </div>
  );
}
