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
    excerpt:
      "Posta klipp eller bilder – bästa playsen får guld-reaktioner.",
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
function SideTopicList({ topic, setTopic }) {
  return (
    <section className="rounded-xl border border-rift-gold/30 bg-white/80 text-rift-bg overflow-hidden">
      <div className="px-4 py-2.5 text-xs tracking-widest uppercase border-b border-rift-gold/25 bg-white/85">
        Topics
      </div>
      <ul className="py-2">
        {TOPICS.map((t) => {
          const active = topic === t.id;
          return (
            <li key={t.id}>
              <button
                onClick={() => setTopic(t.id)}
                className={[
                  "w-full text-left px-4 py-2.5 transition",
                  active
                    ? "bg-[linear-gradient(180deg,#fff,#f0e6c8)] text-rift-bg font-medium"
                    : "hover:bg-white/80 text-rift-bg/80",
                ].join(" ")}
              >
                {t.name}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Widget({ title, children }) {
  return (
    <section className="rounded-xl border border-rift-gold/30 bg-white/80 text-rift-bg overflow-hidden">
      <div className="px-4 py-2.5 text-xs tracking-widest uppercase border-b border-rift-gold/25 bg-white/85">
        {title}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function ThreadRow({ t, onOpen }) {
  return (
    <li>
      <button
        onClick={() => onOpen(t)}
        className="w-full text-left px-3 md:px-4 py-4 rounded-lg hover:bg-black/5 transition"
      >
        <div className="flex items-start gap-3 md:gap-4">
          {t.thumb && (
            <img
              src={t.thumb}
              alt=""
              className="w-12 h-12 md:w-14 md:h-14 rounded-md object-contain ring-1 ring-black/10 bg-white/85"
            />
          )}
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-xl text-rift-bg">{t.title}</h3>
            <p className="mt-1 text-sm text-rift-bg/85 line-clamp-2">
              {t.excerpt}
            </p>
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
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(null);
  const navOffset = useNavOffset();

  const list = useMemo(
    () =>
      THREADS.filter(
        (t) =>
          t.topic === topic &&
          (t.title.toLowerCase().includes(query.toLowerCase()) ||
            t.excerpt.toLowerCase().includes(query.toLowerCase()))
      ),
    [topic, query]
  );

  return (
    <div className="min-h-screen bg-transparent" style={{ paddingTop: navOffset }}>
      {/* === HELA FORUMET PÅ PAPPRET === */}
      <div className="parchment-wrapper">
        {/* Header på pappret */}
        <h1 className="font-display text-3xl md:text-4xl text-rift-bg text-center">
          Summoner&apos;s Hall
        </h1>
        <p className="mt-2 mb-8 text-center text-rift-bg/85">
          Forum för guider, diskussioner och nyheter. Välj ett ämne nedan för att
          se trådarna.
        </p>

        {/* Grid på pappret: vänsterkolumn staplad, trådar till höger */}
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8">
          {/* Vänsterkolumn (staplad: Topics -> Actions -> Latest) */}
          <div className="flex flex-col gap-6">
            <SideTopicList topic={topic} setTopic={setTopic} />

            <Widget title="Actions">
              <ul className="space-y-2 text-sm">
                <li>
                  <button className="paper-link w-full text-left">✍️ Start new thread</button>
                </li>
                <li>
                  <button className="paper-link w-full text-left">⭐ Mark as favorite</button>
                </li>
                <li>
                  <button className="paper-link w-full text-left">🧭 Rules & etiquette</button>
                </li>
              </ul>
            </Widget>

            <Widget title="Latest">
              <ul className="space-y-3 text-sm">
                {THREADS.slice(0, 3).map((t) => (
                  <li key={t.id} className="flex gap-3">
                    <img
                      src={t.thumb}
                      className="w-10 h-10 rounded-md object-contain ring-1 ring-black/10 bg-white/85"
                      alt=""
                    />
                    <div className="min-w-0">
                      <div className="font-medium text-rift-bg line-clamp-2">
                        {t.title}
                      </div>
                      <div className="text-xs text-rift-bg/70">
                        {new Date(t.created).toLocaleDateString()}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </Widget>
          </div>

          {/* Trådlistan till höger, på pappret */}
          <section>
            <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between mb-4">
              <div className="text-sm uppercase tracking-widest text-rift-bg/80">
                Threads in {TOPICS.find((t) => t.id === topic)?.name}
              </div>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search threads..."
                className="w-full md:w-80 rounded-xl border border-rift-gold/40 bg-white/85 text-rift-bg px-4 py-2 placeholder:text-rift-bg/60 focus:outline-none focus:ring-2 focus:ring-rift-gold/50"
              />
            </div>

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
          </section>
        </div>
      </div>

      {/* Modal för öppnad tråd */}
      <ThreadModal thread={open} onClose={() => setOpen(null)} />
    </div>
  );
}
