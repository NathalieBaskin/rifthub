// src/pages/SummonersHall.jsx
import React, { useMemo, useState, useEffect } from "react";

/* ===================== DATA ===================== */
const TOPICS = [
  { id: "guides", name: "Guides & Builds" },
  { id: "champions", name: "Champs & Database" },
  { id: "tft", name: "Teamfight Tactics" },
  { id: "tiers", name: "Tier Lists" },
  { id: "news", name: "News" },
  { id: "free", name: "Free Talk" },
];

const THREADS = [
  {
    id: "t1",
    topic: "guides",
    title: "({15.15}) Rank 1 Briar — Jungle LETHALITY & BRUISER (READ NOTES!)",
    author: "LoganJG",
    replies: 203,
    likes: 3518,
    created: "2025-07-10",
    excerpt:
      "Full pathing, clears, matchups och hur du snowballar tidigt. Uppdaterad för 15.15.",
    thumb: "https://ddragon.leagueoflegends.com/cdn/14.9.1/img/item/3071.png",
    content:
      "**Briar Guide 15.15**\n\n- Rune: Hail of Blades / Conq\n- Start: Emberknife + Refillable\n- First buy: Serrated Dirk\n- Path: Red → Krugs → Raptors\n- Tips: Undvik extended vs peel comps",
  },
  {
    id: "t2",
    topic: "tiers",
    title: "Top Jungle Mythics Right Now",
    author: "GoliathGames",
    replies: 59,
    likes: 2210,
    created: "2025-06-28",
    excerpt:
      "Varför Titanic/Stride är tillbaka och när du väljer Black Cleaver före Sundered.",
    thumb: "https://ddragon.leagueoflegends.com/cdn/14.9.1/img/item/6631.png",
    content:
      "**Meta snapshot**\n\n- Titanic på HP stackers\n- Cleaver när laget saknar shred\n- Trinity på bruisers med on-hit",
  },
  {
    id: "t3",
    topic: "news",
    title: "Patch 15.2 – Djupdykning",
    author: "RiftHub Staff",
    replies: 12,
    likes: 640,
    created: "2025-01-19",
    excerpt:
      "K.O. Coliseum gör entré: balansändringar som faktiskt spelar roll.",
    thumb: "https://ddragon.leagueoflegends.com/cdn/14.9.1/img/item/6632.png",
    content:
      "**Highlights**\n\n- Omnivamp nerfs\n- Nya camp timers\n- ADC crit-justeringar",
  },
  {
    id: "t4",
    topic: "free",
    title: "Visa era bästa pentakills!",
    author: "Namahka",
    replies: 50,
    likes: 1056,
    created: "2025-05-03",
    excerpt: "Posta klipp eller bilder – bästa playsen får guld-reaktioner.",
    thumb: "https://ddragon.leagueoflegends.com/cdn/14.9.1/img/item/3031.png",
    content: "Drop your clips 👇",
  },
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
function Accordion({ title, defaultOpen = true, children }) {
  return (
    <details className="paper-acc" open={defaultOpen}>
      <summary className="paper-acc__summary">{title}</summary>
      <div className="paper-acc__body">{children}</div>
    </details>
  );
}

function SideRail({ topic, setTopic }) {
  return (
    <aside className="paper-rail">
      <Accordion title="TOPICS" defaultOpen>
        <ul className="paper-list">
          {TOPICS.map((t) => {
            const active = topic === t.id;
            return (
              <li key={t.id}>
                <button
                  onClick={() => setTopic(t.id)}
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
      </Accordion>

      <Accordion title="ACTIONS" defaultOpen={false}>
        <div className="paper-actions">
          <button className="paper-link">✍️ Start new thread</button>
          <button className="paper-link">⭐ Mark as favorite</button>
          <button className="paper-link">🧭 Rules &amp; etiquette</button>
        </div>
      </Accordion>

      <Accordion title="LATEST" defaultOpen={false}>
        <ul className="paper-latest">
          {THREADS.slice(0, 4).map((t) => (
            <li key={t.id} className="paper-latest__item">
              <img
                src={t.thumb}
                alt=""
                className="paper-latest__thumb"
                loading="lazy"
              />
              <div className="paper-latest__text">
                <div className="paper-latest__title line-clamp-2">{t.title}</div>
                <div className="paper-latest__meta">
                  {new Date(t.created).toLocaleDateString()}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </Accordion>
    </aside>
  );
}

function ThreadRow({ t, onOpen }) {
  const shortTitle = t.title.length > 30 ? t.title.slice(0, 30) + "…" : t.title;
  const shortExcerpt =
    t.excerpt.length > 30 ? t.excerpt.slice(0, 30) + "…" : t.excerpt;

  return (
    <li>
      <button
        onClick={() => onOpen(t)}
        className="w-full text-left px-5 md:px-6 py-5 rounded-lg hover:bg-black/5 transition"
      >
        <div className="flex items-start gap-4">
          {t.thumb && (
            <img
              src={t.thumb}
              alt=""
              className="w-12 h-12 md:w-14 md:h-14 rounded-md object-contain ring-1 ring-black/10 bg-white/85"
            />
          )}
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-xl text-rift-bg">{shortTitle}</h3>
            <p className="mt-1 text-sm text-rift-bg/85">{shortExcerpt}</p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-rift-bg/70">
              <span>
                By <span className="font-medium">{t.author}</span>
              </span>
              <span>• {new Date(t.created).toLocaleDateString()}</span>
              <span>💬 {t.replies}</span>
              <span>🔥 {t.likes}</span>
            </div>
          </div>
        </div>
      </button>
      <div className="paper-divider" />
    </li>
  );
}

function ThreadModal({ thread, onClose }) {
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
        <span className="parchment-pin pin-tl" />
        <span className="parchment-pin pin-tr" />
        <div className="p-6 md:p-8">
          <h3 className="font-display text-2xl md:text-3xl text-rift-bg">
            {thread.title}
          </h3>
          <div className="mt-2 text-xs text-rift-bg/70">
            By <span className="font-medium">{thread.author}</span> •{" "}
            {new Date(thread.created).toLocaleDateString()} • 💬 {thread.replies} • 🔥{" "}
            {thread.likes}
          </div>
          <div className="rift-sep my-4"></div>
          <pre className="whitespace-pre-wrap font-sans text-[15px] text-rift-bg/90">
            {thread.content}
          </pre>
          <div className="mt-6 flex justify-end gap-3">
            <button
              className="px-4 py-2 rounded-md border border-rift-gold/50 bg-white/85 text-rift-bg hover:bg-white"
              onClick={onClose}
            >
              Close
            </button>
            <button className="px-4 py-2 rounded-md border border-rift-gold/65 bg-[linear-gradient(180deg,#fff,#f0e6c8)] text-rift-bg hover:brightness-95">
              👍 Like
            </button>
            <button className="px-4 py-2 rounded-md border border-rift-gold/65 bg-[linear-gradient(180deg,#fff,#f0e6c8)] text-rift-bg hover:brightness-95">
              💬 Reply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===================== HUVUDKOMPONENT ===================== */
export default function SummonersHall() {
  const [topic, setTopic] = useState(TOPICS[0].id);
  const [open, setOpen] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(null);
  const navOffset = useNavOffset();

  const list = useMemo(
    () => THREADS.filter((t) => t.topic === topic),
    [topic]
  );

  return (
    <div className="min-h-screen bg-transparent">
      <div
        className="parchment-wrapper min-h-[1100px]"
        style={{ marginTop: (navOffset || 0) + -90 }} // 🔧 tidigare +30
      >
        {/* Rubrik */}
        <h1 className="font-display text-3xl md:text-4xl text-rift-bg text-center mb-1">
          Summoner&apos;s Hall
        </h1>

        {/* === MOBIL DROPDOWNS === */}
        <div className="md:hidden mb-8 flex gap-2 justify-center relative z-40">
          {["topics", "actions", "latest"].map((section) => (
            <div key={section} className="relative flex-1">
              <button
                onClick={() =>
                  setMobileOpen(mobileOpen === section ? null : section)
                }
                className="w-full rounded-lg text-rift-bg px-3 py-2 text-sm font-medium bg-transparent border border-rift-gold/50"
              >
                {section.toUpperCase()}
              </button>
              {mobileOpen === section && (
                <div className="absolute left-0 mt-2 w-56 rounded-lg z-50 
                                bg-white/30 backdrop-blur-md text-black shadow-lg">
                  {section === "topics" && (
                    <ul className="space-y-1 p-2">
                      {TOPICS.map((t) => (
                        <li key={t.id}>
                          <button
                            onClick={() => {
                              setTopic(t.id);
                              setMobileOpen(null);
                            }}
                            className={`block w-full text-left px-3 py-1 rounded ${
                              topic === t.id
                                ? "bg-black/20 font-medium"
                                : "hover:bg-black/10"
                            }`}
                          >
                            {t.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {section === "actions" && (
                    <div className="space-y-1 p-2">
                      <button className="block w-full text-left px-3 py-1 hover:bg-black/10">
                        ✍️ Start new thread
                      </button>
                      <button className="block w-full text-left px-3 py-1 hover:bg-black/10">
                        ⭐ Mark as favorite
                      </button>
                      <button className="block w-full text-left px-3 py-1 hover:bg-black/10">
                        🧭 Rules & etiquette
                      </button>
                    </div>
                  )}
                  {section === "latest" && (
                    <ul className="space-y-1 p-2">
                      {THREADS.slice(0, 4).map((t) => (
                        <li key={t.id} className="px-3 py-1 hover:bg-black/10">
                          {t.title}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* DESKTOP/IPAD GRID */}
        <div
          className="hidden md:grid gap-6"
          style={{ gridTemplateColumns: "420px 1fr" }}
        >
          <SideRail topic={topic} setTopic={setTopic} />

          <div className="flex-1 pt-14 pl-1"> {/* 🔧 tidigare pt-12 */}
            <ul>
              {list.map((t) => (
                <ThreadRow key={t.id} t={t} onOpen={setOpen} />
              ))}
              {list.length === 0 && (
                <li className="px-4 py-10 text-center text-rift-bg/70">
                  No threads found.
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* MOBIL TRÅDAR */}
        <div className="md:hidden">
          <ul>
            {list.map((t) => (
              <ThreadRow key={t.id} t={t} onOpen={setOpen} />
            ))}
            {list.length === 0 && (
              <li className="px-4 py-10 text-center text-rift-bg/70">
                No threads found.
              </li>
            )}
          </ul>
        </div>
      </div>

      <ThreadModal thread={open} onClose={() => setOpen(null)} />
    </div>
  );
}
