import { useMemo, useState, useEffect } from "react";

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

/* Mäter navbar-höjd */
function useNavOffset() {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    const header = document.querySelector("header[data-nav]") || document.querySelector("header");
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

function TopicTabs({ topic, setTopic }) {
  return (
    <div className="w-full overflow-x-auto no-scrollbar">
      <div className="flex gap-2 md:gap-3 min-w-max">
        {TOPICS.map((t) => {
          const active = topic === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTopic(t.id)}
              className={[
                "px-4 py-2 rounded-full text-sm transition whitespace-nowrap border",
                active
                  ? "bg-[linear-gradient(180deg,rgba(255,255,255,.95),rgba(240,230,200,.95))] border-rift-gold/60 text-rift-bg shadow-[inset_0_1px_0_rgba(255,255,255,.65)]"
                  : "bg-white/70 border-rift-gold/30 text-rift-bg hover:bg-white/85",
              ].join(" ")}
            >
              {t.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ThreadRow({ t, onOpen }) {
  return (
    <li className="group">
      <button
        className="w-full text-left px-4 md:px-6 py-4 transition hover:bg-white/55"
        onClick={() => onOpen(t)}
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
            <h3 className="font-display text-xl text-rift-bg/95">{t.title}</h3>
            <p className="mt-1 text-sm text-rift-bg/85 line-clamp-2">{t.excerpt}</p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-rift-bg/70">
              <span>By <span className="font-medium">{t.author}</span></span>
              <span>• {new Date(t.created).toLocaleDateString()}</span>
              <span>💬 {t.replies}</span>
              <span>👍 {t.likes}</span>
            </div>
          </div>
        </div>
      </button>
      <div className="h-px bg-gradient-to-r from-transparent via-rift-gold/25 to-transparent" />
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
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="max-w-3xl w-full parchment-panel rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <span className="parchment-pin pin-tl" />
        <span className="parchment-pin pin-tr" />
        <div className="p-6 md:p-8">
          <h3 className="font-display text-2xl md:text-3xl text-rift-bg/95">{thread.title}</h3>
          <div className="mt-2 text-xs text-rift-bg/70">
            By <span className="font-medium">{thread.author}</span> • {new Date(thread.created).toLocaleDateString()} • 💬 {thread.replies} • 👍 {thread.likes}
          </div>
          <div className="rift-sep my-4"></div>
          <pre className="whitespace-pre-wrap font-sans text-[15px] text-rift-bg/90">{thread.content}</pre>
          <div className="mt-6 flex justify-end gap-3">
            <button className="px-4 py-2 rounded-md border border-rift-gold/50 bg-white/85 text-rift-bg hover:bg-white" onClick={onClose}>Close</button>
            <button className="px-4 py-2 rounded-md border border-rift-gold/65 bg-[linear-gradient(180deg,#fff,#f0e6c8)] text-rift-bg hover:brightness-95">👍 Like</button>
            <button className="px-4 py-2 rounded-md border border-rift-gold/65 bg-[linear-gradient(180deg,#fff,#f0e6c8)] text-rift-bg hover:brightness-95">💬 Reply</button>
          </div>
        </div>
      </div>
    </div>
  );
}

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
    <div className="min-h-screen" style={{ paddingTop: navOffset }}>
      <div className="max-w-7xl mx-auto px-4 pb-20">
        <section className="relative parchment-panel rounded-3xl overflow-hidden">
          <span className="parchment-pin pin-tl" />
          <span className="parchment-pin pin-tr" />
          <div className="p-6 md:p-10">
            <h1 className="font-display text-3xl md:text-4xl text-rift-bg/95">Summoner&apos;s Hall</h1>
            <p className="mt-2 text-rift-bg/85">
              Forum för guider, diskussioner och nyheter. Välj ett ämne nedan för att se trådarna.
            </p>

            <div className="mt-6 flex flex-col md:flex-row md:items-center gap-4">
              <TopicTabs topic={topic} setTopic={setTopic} />
              <div className="md:ml-auto w-full md:w-72">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search threads..."
                  className="w-full rounded-xl border border-rift-gold/40 bg-white/85 text-rift-bg px-4 py-2 placeholder:text-rift-bg/60 focus:outline-none focus:ring-2 focus:ring-rift-gold/50"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 parchment-panel rounded-3xl overflow-hidden">
          <div className="parchment-section-title px-4 md:px-6 py-3 text-xs md:text-sm uppercase tracking-widest text-rift-bg/80">
            Threads in {TOPICS.find((t) => t.id === topic)?.name}
          </div>
          <ul className="divide-y divide-transparent">
            {list.map((t) => (
              <ThreadRow key={t.id} t={t} onOpen={setOpen} />
            ))}
            {list.length === 0 && (
              <li className="px-6 py-10 text-center text-rift-bg/70">
                No threads found. Try another topic or search query.
              </li>
            )}
          </ul>
        </section>
      </div>

      <ThreadModal thread={open} onClose={() => setOpen(null)} />
    </div>
  );
}
