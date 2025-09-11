// src/pages/SummonersHall.jsx
import React, { useMemo, useState, useEffect } from "react";
import { getUserFromToken } from "../utils/auth.js";
import { FaTrash } from "react-icons/fa";
import { AiOutlineLike, AiFillLike, AiOutlineComment } from "react-icons/ai";
import NotAuthModal from "../components/NotAuthModal.jsx";

const API_URL = "http://localhost:5000";

const TOPICS = [
  { id: 0, key: "all", name: "All Threads" },
  { id: 1, key: "guides", name: "Wild Rift" },
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
      <div className="flex justify-start mb-1 md:mb-1">
        {/* Bild-baserad Create-knapp (iPad/desktop) */}
 <button
  type="button"
  onClick={onNewThread}
  className="relative inline-block p-0 bg-transparent -translate-y-1 md:-translate-y-2 lg:-translate-y-3"
  aria-label="Create new thread"
  title="Create new thread"
>


  <img
    src={`${API_URL}/images/create-button.png`}
    alt="Create"
    className="relative z-10 h-6 md:h-8 lg:h-9 w-auto select-none"
    draggable="false"
  />
</button>


      </div>

      {/* Topics direkt under Create */}
      <details className="paper-acc mt-0" open>
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

function ThreadRow({ t, onOpen, onLike, onDelete, user }) {
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
            <h3 className="font-display text-xl md:text-rift-bg text-rift-gold line-clamp-1 truncate max-w-[20ch]">
              {t.title}
            </h3>
            <p className="mt-1 text-sm md:text-rift-bg/70 text-white/80 line-clamp-2 truncate max-w-[20ch]">
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
          className={`flex items-center gap-1 ${
            hasLiked ? "text-rift-gold md:text-black" : "hover:text-rift-gold"
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onLike(t);
          }}
        >
          {hasLiked ? <AiFillLike /> : <AiOutlineLike />} {t.like_count || 0}
        </button>

        <button
          className="flex items-center gap-1 hover:text-rift-gold"
          onClick={(e) => {
            e.stopPropagation();
            onOpen(t);
          }}
        >
          <AiOutlineComment /> {t.comment_count || 0}
        </button>

        {user && user.id === t.user_id && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(t);
            }}
            className="text-red-600 hover:text-red-800 flex items-center gap-1"
          >
            <FaTrash /> Delete
          </button>
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
  setShowAuthModal,
}) {
  const [comments, setComments] = useState([]);
  const [replyOpen, setReplyOpen] = useState({});
  const [replyText, setReplyText] = useState({});
  const [text, setText] = useState("");

  // trådredigering
  const [isEditingThread, setIsEditingThread] = useState(false);
  const [threadTitle, setThreadTitle] = useState(thread.title);
  const [threadContent, setThreadContent] = useState(thread.content);
  const [threadFile, setThreadFile] = useState(null);

  useEffect(() => {
    if (!thread) return;
    const uid = user?.id ? `?userId=${user.id}` : "";
    fetch(`${API_URL}/api/threads/${thread.id}/comments${uid}`)
      .then((res) => res.json())
      .then((data) => setComments(Array.isArray(data) ? data : []))
      .catch(() => setComments([]));
  }, [thread, user?.id]);

  if (!thread) return null;

  const resolveAvatar = (path) =>
    !path
      ? "/default-avatar.png"
      : path.startsWith("/uploads")
      ? `${API_URL}${path}`
      : path;

  // THREAD EDIT SAVE
  async function handleSaveThreadEdit() {
    if (!user) return;
    const formData = new FormData();
    formData.append("id", thread.id);
    formData.append("userId", user.id);
    formData.append("title", threadTitle);
    formData.append("content", threadContent);
    formData.append("topic_id", thread.topic_id);
    if (threadFile) formData.append("thumb", threadFile);

    const res = await fetch(`${API_URL}/api/threads/${thread.id}`, {
      method: "PUT",
      body: formData,
    });

    if (res.ok) {
      setIsEditingThread(false);
      onClose();
    } else {
      console.error("Failed to save edit", await res.text());
    }
  }

  // COMMENT ACTIONS
  async function handlePostComment(parentId = null) {
    if (!user) {
      if (typeof setShowAuthModal === "function") {
        setShowAuthModal(true);
      } else {
        alert("Log in to comment");
      }
      return;
    }

    const content = parentId ? replyText[parentId] : text;
    if (!content?.trim()) return;

    const res = await fetch(`${API_URL}/api/threads/${thread.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, content, parent_id: parentId }),
    });

    if (!res.ok) return;

    const newComment = await res.json();
    setComments((prev) => [...prev, newComment]);
    onCommentCountChange?.(thread.id, +1);

    parentId ? setReplyText((p) => ({ ...p, [parentId]: "" })) : setText("");
  }

  async function handleToggleLikeComment(commentId) {
    if (!user) return;
    const res = await fetch(`${API_URL}/api/comments/${commentId}/like`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id }),
    });
    if (!res.ok) return;
    const { like_count, liked } = await res.json();
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? { ...c, like_count, liked_by_me: liked ? 1 : 0 }
          : c
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
    if (res.ok) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      onCommentCountChange?.(thread.id, -1);
    }
  }

  // build comment tree
  const tree = (() => {
    const byId = new Map();
    comments.forEach((c) => byId.set(c.id, { ...c, children: [] }));
    const roots = [];
    byId.forEach((c) => {
      if (c.parent_id && byId.has(c.parent_id))
        byId.get(c.parent_id).children.push(c);
      else roots.push(c);
    });
    return roots;
  })();

  function CommentItem({ c, depth = 0 }) {
    const canEdit = user?.id === c.user_id;
    const liked = !!c.liked_by_me;
    const [isEditing, setIsEditing] = useState(false);
    const [localText, setLocalText] = useState(c.content);

    async function saveEdit() {
      if (!localText.trim()) return;
      const res = await fetch(`${API_URL}/api/comments/${c.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, content: localText }),
      });
      if (res.ok) {
        setComments((prev) =>
          prev.map((x) => (x.id === c.id ? { ...x, content: localText } : x))
        );
        setIsEditing(false);
      }
    }

    return (
      <div className="mb-3" style={{ marginLeft: depth * 16 }}>
        <div className="flex items-start gap-3">
          <img
            src={resolveAvatar(c.avatar_url)}
            className="w-8 h-8 rounded-full"
          />
          <div className="flex-1">
            <span className="font-medium text-rift-gold">{c.username}</span>

            {isEditing ? (
              <div className="mt-1">
                <textarea
                  className="w-full border rounded p-2 text-sm"
                  rows={3}
                  value={localText}
                  onChange={(e) => setLocalText(e.target.value)}
                />
                <div className="flex gap-2 mt-1 text-xs">
                  <button
                    className="px-3 py-1 bg-rift-card text-rift-gold rounded"
                    onClick={saveEdit}
                  >
                    Save
                  </button>
                  <button
                    className="px-3 py-1 bg-gray-200 rounded"
                    onClick={() => {
                      setIsEditing(false);
                      setLocalText(c.content);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm">{c.content}</p>
            )}

            <div className="flex gap-3 text-xs mt-1">
              <button onClick={() => handleToggleLikeComment(c.id)}>
                {liked ? <AiFillLike /> : <AiOutlineLike />}{" "}
                {c.like_count || 0}
              </button>
              <button
                onClick={() =>
                  setReplyOpen((p) => ({ ...p, [c.id]: !p[c.id] }))
                }
              >
                Reply
              </button>
              {canEdit && !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-blue-600"
                >
                  Edit
                </button>
              )}
              {canEdit && (
                <button
                  onClick={() => handleDeleteComment(c.id)}
                  className="text-red-600"
                >
                  Delete
                </button>
              )}
            </div>

            {replyOpen[c.id] && (
              <div className="mt-2 flex gap-2">
                <input
                  className="flex-1 border rounded p-2 text-sm"
                  value={replyText[c.id] || ""}
                  onChange={(e) =>
                    setReplyText((p) => ({ ...p, [c.id]: e.target.value }))
                  }
                  placeholder={`Reply to ${c.username}`}
                />
                <button
                  className="px-3 py-1 bg-rift-card text-rift-gold rounded"
                  onClick={() => handlePostComment(c.id)}
                >
                  Reply
                </button>
              </div>
            )}

            {c.children?.map((child) => (
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
          {/* sticky header */}
          <div className="p-6 border-b sticky top-0 bg-white/90 z-10 flex justify-between items-center">
            {!isEditingThread ? (
              <div>
                <h3 className="font-display text-2xl">{thread.title}</h3>
                <div className="text-xs">
                  By {thread.author} •{" "}
                  {new Date(thread.created_at).toLocaleDateString()}
                </div>
              </div>
            ) : (
              <div className="w-full">
                <input
                  className="w-full border p-2 rounded mb-2"
                  value={threadTitle}
                  onChange={(e) => setThreadTitle(e.target.value)}
                />
                <textarea
                  className="w-full border p-2 rounded"
                  rows={4}
                  value={threadContent}
                  onChange={(e) => setThreadContent(e.target.value)}
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setThreadFile(e.target.files[0])}
                  className="mt-2"
                />
              </div>
            )}

            {user && user.id === thread.user_id && !isEditingThread && (
              <button
                className="px-3 py-1 bg-blue-600 text-white rounded ml-4"
                onClick={() => setIsEditingThread(true)}
              >
                Edit
              </button>
            )}
          </div>

          {/* scrollable body */}
          <div className="p-6 max-h-[70vh] overflow-y-auto">
            {!isEditingThread ? (
              <pre className="whitespace-pre-wrap">{thread.content}</pre>
            ) : (
              <div className="flex gap-2 mt-2">
                <button
                  className="px-4 py-2 bg-gray-300 rounded"
                  onClick={() => setIsEditingThread(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-rift-card text-rift-gold rounded"
                  onClick={handleSaveThreadEdit}
                >
                  Save
                </button>
              </div>
            )}

            <h4 className="font-semibold mt-6 mb-2">Comments</h4>
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
                  className="px-4 py-2 bg-rift-card text-rift-gold rounded"
                  onClick={() => handlePostComment()}
                >
                  Post
                </button>
              </div>
            ) : (
              <p className="text-sm text-rift-bg/70">Log in to comment</p>
            )}
          </div>

          <div className="p-4 flex justify-end">
            <button className="px-4 py-2 bg-gray-200 rounded" onClick={onClose}>
              Close
            </button>
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
  const [showAuthModal, setShowAuthModal] = useState(false);

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
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    const res = await fetch(`${API_URL}/api/threads/${thread.id}/like`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id }),
    });
    if (!res.ok) return;

    const { like_count, liked } = await res.json();
    setThreads((prev) =>
      prev.map((t) =>
        t.id === thread.id
          ? { ...t, like_count, liked_by_me: liked ? 1 : 0 }
          : t
      )
    );
  }

  // CREATE THREAD
  async function handleCreateThread({ title, content, topicId, file }) {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    const formData = new FormData();
    formData.append("userId", user.id);
    formData.append("title", title);
    formData.append("content", content);
    formData.append("topic_id", topicId);
    if (file) formData.append("thumb", file);

    const res = await fetch(`${API_URL}/api/threads`, {
      method: "POST",
      body: formData,
    });
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

  function handleCommentCountChange(threadId, delta) {
    setThreads((prev) =>
      prev.map((t) =>
        t.id === threadId
          ? { ...t, comment_count: (t.comment_count || 0) + delta }
          : t
      )
    );
    if (open?.id === threadId) {
      setOpen((o) => ({ ...o, comment_count: (o.comment_count || 0) + delta }));
    }
  }

  return (
    <div className="min-h-screen bg-transparent">
      {/* Desktop/iPad → parchment-wrapper */}
      <div
        className="
          hidden md:block parchment-wrapper
          md:min-h-[1300px] md:pb-28
          xl:min-h-[1700px] md:pb-28
          xl:pb-20
        "
        style={{ marginTop: (navOffset || 0) - 90 }}
      >
        <h1 className="font-display text-4xl md:text-5xl text-rift-bg text-center mb-6">
          Summoner&apos;s Hall
        </h1>

        <div
          className="
            grid gap-6
            md:[grid-template-columns:340px_1fr]
            xl:[grid-template-columns:400px_1fr]
            md:-ml-4 xl:ml-0
          "
        >
          {/* Siderail iPad mer vänster + smalare */}
          <div className="md:-ml-10 xl:ml-0 md:w-[320px] xl:w-[380px]">
            <SideRail
              topic={topic}
              setTopic={setTopic}
              onNewThread={() => {
                if (user) {
                  setShowNew(true);
                } else {
                  setShowAuthModal(true);
                }
              }}
            />
          </div>

          {/* Trådlista (lite mindre vänsterskift på iPad) */}
          <div className="flex-1 pt-8 md:-ml-20 xl:ml-0">
            <ul>
              {list.map((t) => (
                <ThreadRow
                  key={t.id}
                  t={t}
                  user={user}
                  onOpen={setOpen}
                  onLike={handleLike}
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

      {/* Mobil-layout (oförändrad) */}
      <div
        className="md:hidden flex flex-col gap-4 px-3"
        style={{ marginTop: (navOffset || 0) - 60 }}
      >
        <h1 className="font-display text-2xl text-white text-center mb-2">
          Summoner&apos;s Hall
        </h1>

        {/* Rad med Create (bild) + Topic dropdown */}
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => (user ? setShowNew(true) : setShowAuthModal(true))}
            className="p-0 bg-transparent"
            aria-label="Create new thread"
            title="Create new thread"
          >
            <img
              src={`${API_URL}/images/create-button.png`}
              alt="Create"
              className="h-8 w-auto select-none"
              draggable="false"
            />
          </button>

        <select
            className="px-2 py-1 rounded border text-sm bg-white/90 text-black"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          >
            {TOPICS.map((t) => (
              <option key={t.id} value={t.key}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Trådlista */}
        <ul className="flex flex-col gap-4 mt-2">
          {list.map((t) => (
            <li key={t.id} className="backdrop-blur-md bg-black/40 rounded-xl p-2">
              <div className="text-white">
                <ThreadRow
                  t={{ ...t, liked_by_me: t.liked_by_me }}
                  user={user}
                  onOpen={setOpen}
                  onLike={handleLike}
                  onDelete={handleDeleteThread}
                />

                <style jsx>{`
                  @media (max-width: 767px) {
                    li .text-rift-bg,
                    li .text-rift-bg\\/70 {
                      color: white !important;
                    }
                  }
                `}</style>
              </div>
            </li>
          ))}
          {list.length === 0 && (
            <li className="px-4 py-10 text-center text-white/70">
              No threads found.
            </li>
          )}
        </ul>
      </div>

      {open && (
        <ThreadModal
          thread={open}
          onClose={() => setOpen(null)}
          user={user}
          onCommentCountChange={handleCommentCountChange}
          setShowAuthModal={setShowAuthModal}
        />
      )}

      {showNew && (
        <NewThreadModal
          onClose={() => setShowNew(false)}
          onCreate={handleCreateThread}
        />
      )}

      {showAuthModal && (
        <NotAuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </div>
  );
}
