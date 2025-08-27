// src/pages/SummonersHall.jsx
import React, { useMemo, useState, useEffect } from "react";
import { getUserFromToken } from "../utils/auth.js";
import { FaEdit, FaTrash } from "react-icons/fa";

import { AiOutlineLike, AiFillLike, AiOutlineComment } from "react-icons/ai";

/* ===================== DATA ===================== */
const TOPICS = [
  { id: 0, key: "all", name: "All Threads" },
  { id: 1, key: "guides", name: "Guides & Builds" },
  { id: 2, key: "champions", name: "Champs & Database" },
  { id: 3, key: "tft", name: "Teamfight Tactics" },
  { id: 4, key: "tiers", name: "Tier Lists" },
  { id: 5, key: "news", name: "News" },
  { id: 6, key: "free", name: "Free Talk" },
];

/* ===================== NAVBAR-OFFSET ===================== */
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

/* ===================== UI-BLOCKS ===================== */
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
  const hasLiked = t.liked || false;
  return (
    <li>
      <div
        className="w-full text-left px-5 md:px-6 py-5 rounded-lg hover:bg-black/5 transition cursor-pointer"
        onClick={() => onOpen(t)}
      >
        <div className="flex items-start gap-4">
          {t.thumb && (
            <img
              src={`http://localhost:5000${t.thumb}`}
              alt="thumb"
              className="w-12 h-12 md:w-14 md:h-14 rounded-md object-cover ring-1 ring-black/10"
            />
          )}
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-xl text-rift-bg">{t.title}</h3>
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
  {/* Like button */}
  <button
    className="flex items-center gap-1 hover:text-rift-gold"
    onClick={() => onLike(t)}
  >
    {hasLiked ? <AiFillLike /> : <AiOutlineLike />}
    {t.likes || 0}
  </button>

  {/* Comment counter */}
  <div className="flex items-center gap-1 text-rift-bg/70">
    <AiOutlineComment />
    {(t.comments && t.comments.length) || 0}
  </div>

  {/* Edit/Delete only for author */}
  {user && user.username === t.author && (
    <>
      <button
        onClick={() => onEdit(t)}
        className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
      >
        <FaEdit /> Edit
      </button>
      <button
        onClick={() => onDelete(t)}
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

/* ===================== MODALS ===================== */
function ThreadModal({ thread, onClose, user, comments, onPostComment, onToggleLikeComment }) {
  const [text, setText] = useState("");

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!thread) return null;

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="max-w-3xl w-full parchment-panel rounded-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 md:p-8 bg-white/90 text-rift-bg rounded-lg">
          <h3 className="font-display text-2xl md:text-3xl">{thread.title}</h3>
          <div className="mt-2 text-xs">
            By <span className="font-medium">{thread.author}</span> •{" "}
            {new Date(thread.created_at).toLocaleDateString()}
          </div>
          <div className="rift-sep my-4"></div>
          <pre className="whitespace-pre-wrap font-sans text-[15px]">
            {thread.content}
          </pre>

          {/* Kommentarer */}
          <div className="mt-6">
            <h4 className="font-semibold mb-2">Comments</h4>
            {(comments[thread.id] || []).map((c) => (
              <div key={c.id} className="flex items-start gap-3 mb-3">
                <img
                  src={c.avatar}
                  alt="avatar"
                  className="w-8 h-8 rounded-full"
                />
                <div className="flex-1">
                  <a
                    href={`/profile/${c.authorId}`}
                    className="font-medium text-rift-gold hover:underline"
                  >
                    {c.author}
                  </a>
                  <p className="text-sm">{c.text}</p>
                  <div className="flex items-center gap-3 text-xs text-rift-bg/70 mt-1">
                    <button
                      onClick={() => onToggleLikeComment(thread.id, c.id)}
                      className="flex items-center gap-1 hover:text-rift-gold"
                    >
                      {c.liked ? <AiFillLike /> : <AiOutlineLike />} {c.likes}
                    </button>
                    <button className="hover:underline">Reply</button>
                  </div>
                </div>
              </div>
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
                  onClick={() => {
                    onPostComment(thread.id, text);
                    setText("");
                  }}
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
  );
}

/* ===================== NEW & EDIT ===================== */
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

function ThreadModalEditor({ onClose, onSave, existing }) {
  const [title, setTitle] = useState(existing?.title || "");
  const [content, setContent] = useState(existing?.content || "");
  return (
    <div
      className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white text-black rounded-lg shadow-lg p-6 w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4">Edit thread</h2>
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
        <div className="flex justify-end gap-2 mt-4">
          <button className="px-4 py-2 bg-gray-300 rounded" onClick={onClose}>
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-rift-card text-rift-gold rounded"
            onClick={() => onSave({ title, content })}
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===================== MAIN ===================== */
export default function SummonersHall() {
  const [topic, setTopic] = useState("all");
  const [threads, setThreads] = useState([]);
  const [open, setOpen] = useState(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [editThread, setEditThread] = useState(null);
  const [commentsByThread, setCommentsByThread] = useState({});
  const navOffset = useNavOffset();
  const user = getUserFromToken();

  useEffect(() => {
    async function loadThreads() {
      const res = await fetch("http://localhost:5000/api/threads");
      const data = await res.json();
      setThreads(data.map((t) => ({ ...t, likes: t.likes || 0, liked: false })));
    }
    loadThreads();
  }, []);

  const list = useMemo(() => {
    if (topic === "all") return threads;
    return threads.filter((t) => {
      const topicObj = TOPICS.find((x) => x.id === t.topic_id);
      return topicObj?.key === topic;
    });
  }, [topic, threads]);

  function handleLike(thread) {
    if (!user) return alert("Log in to like posts");
    setThreads((prev) =>
      prev.map((t) =>
        t.id === thread.id
          ? {
              ...t,
              liked: !t.liked,
              likes: t.liked ? t.likes - 1 : t.likes + 1,
            }
          : t
      )
    );
  }

  function handlePostComment(threadId, text) {
    if (!user) return alert("Log in to comment");
    if (!text.trim()) return;
    setCommentsByThread((prev) => {
      const list = prev[threadId] || [];
      return {
        ...prev,
        [threadId]: [
          ...list,
          {
            id: Date.now(),
            author: user.username,
            authorId: user.id,
            avatar: user.avatar_url || "/default-avatar.png",
            text,
            likes: 0,
            liked: false,
            replies: [],
          },
        ],
      };
    });
  }

  function handleToggleLikeComment(threadId, commentId) {
    setCommentsByThread((prev) => {
      const list = prev[threadId] || [];
      return {
        ...prev,
        [threadId]: list.map((c) =>
          c.id === commentId
            ? {
                ...c,
                liked: !c.liked,
                likes: c.liked ? c.likes - 1 : c.likes + 1,
              }
            : c
        ),
      };
    });
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
              user ? setShowNewModal(true) : alert("Log in to create a thread")
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
                  onEdit={setEditThread}
                  onDelete={(thr) => console.log("TODO delete", thr)}
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

      <ThreadModal
        thread={open}
        onClose={() => setOpen(null)}
        user={user}
        comments={commentsByThread}
        onPostComment={handlePostComment}
        onToggleLikeComment={handleToggleLikeComment}
      />

      {showNewModal && (
        <NewThreadModal
          onClose={() => setShowNewModal(false)}
          onCreate={() => console.log("TODO create thread")}
        />
      )}
      {editThread && (
        <ThreadModalEditor
          existing={editThread}
          onClose={() => setEditThread(null)}
          onSave={() => console.log("TODO edit thread")}
        />
      )}
    </div>
  );
}
