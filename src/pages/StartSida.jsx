// src/pages/StartSida.jsx
import { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import yasuoImg from "../assets/images/nightbringerYasuo.jpeg";
import tftImg from "../assets/images/TeamfightTacticts.png";

const API_URL = "http://localhost:5000";


// ersätter hela tidigare IS_DEV-raden
const IS_DEV = !!(typeof import.meta !== "undefined" && import.meta.env && import.meta.env.DEV);


export default function StartSida() {
  const videoRef = useRef(null);
  const [muted, setMuted] = useState(true);

  // NEW MERCH
  const [newProducts, setNewProducts] = useState([]);
  const sliderRef = useRef(null);
  const nav = useNavigate();

  // --- HERO video setup ---
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoaded = () => {
      try {
        video.currentTime = 10;
      } catch (err) {
        if (IS_DEV) console.debug("[StartSida] video seek failed:", err);
      }
      const p = video.play();
      if (p && typeof p.then === "function") {
        p.catch((err) => {
          if (IS_DEV) console.debug("[StartSida] video autoplay blocked:", err);
        });
      }
    };

    video.addEventListener("loadedmetadata", handleLoaded);
    return () => video.removeEventListener("loadedmetadata", handleLoaded);
  }, []);

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  // --- Hämta "nya" produkter ---
  useEffect(() => {
    let cancelled = false;

    const withinDays = (createdAt, days = 30) => {
      if (!createdAt) return false;
      const t = new Date(createdAt).getTime();
      if (Number.isNaN(t)) return false;
      const diffDays = (Date.now() - t) / (1000 * 60 * 60 * 24);
      return diffDays <= days;
    };

    const normalizeArray = (raw) => {
      const arr = Array.isArray(raw) ? raw : Array.isArray(raw?.products) ? raw.products : [];
      return arr;
    };

    const isNewFlag = (p) =>
      p?.isNew === true ||
      p?.is_new === 1 ||
      /new/i.test(p?.tag || "") ||
      (Array.isArray(p?.tags) && p.tags.some((t) => /new/i.test(t)));

    async function load() {
      try {
        // Prova dedikerad endpoint om den finns
        const r1 = await fetch(`${API_URL}/api/products/new?days=30`);
        if (r1.ok) {
          const data = await r1.json();
          if (!cancelled) setNewProducts(Array.isArray(data) ? data : []);
          return;
        }
      } catch (err) {
        if (IS_DEV) console.debug("[StartSida] /api/products/new failed:", err);
        // fallback nedan
      }

      try {
        // Fallback: hämta alla, filtrera nya
        const r2 = await fetch(`${API_URL}/api/products`);
        if (!r2.ok) {
          if (!cancelled) setNewProducts([]);
          return;
        }
        const raw = await r2.json();
        const arr = normalizeArray(raw);

        const filtered = arr.filter((p) => isNewFlag(p) || withinDays(p?.created_at, 30));
        if (!cancelled) setNewProducts(filtered);
      } catch (err) {
        if (IS_DEV) console.debug("[StartSida] /api/products failed:", err);
        if (!cancelled) setNewProducts([]);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Bildresolver
  const resolveProdImage = (p) => {
    const src =
      p?.image_url ||
      p?.image ||
      (Array.isArray(p?.images) ? p.images[0] : null) ||
      null;

    if (!src) return "/images/placeholder.png";
    if (typeof src === "string" && src.startsWith("/")) return `${API_URL}${src}`;
    return src;
  };

  // Gå till produktsida
  const goToProduct = (id) => nav(`/shop/product/${id}`);

  // Dummy featured

const featured = [
  {
    id: 1,
    title: "Nightbringer Yasuo Unbound Showcase",
    date: "18/01/2025",
    tag: "GAME UPDATES",
    excerpt:
      "A new era of darkness begins! Join Nightbringer Yasuo Unbound down the path of chaos in TFT.",
    image: yasuoImg,
    link: "https://www.leagueoflegends.com/en-gb/news/game-updates/patch-25-18-notes/",
  },
  {
    id: 2,
    title: "Teamfight Tactics patch 15.4 notes",
    date: "09/00/2025",
    tag: "PATCH NOTES",
    excerpt:
      "The Coliseum calls to all with balance changes, Item Updates, Trait adjustments and more!",
    image: tftImg,
    link: "https://teamfighttactics.leagueoflegends.com/en-gb/news/game-updates/teamfight-tactics-patch-15-4-notes/",
  },
  {
    id: 3,
    title: "T1: World Championship 2024",
    date: "21/01/2025",
    tag: "GAME UPDATES",
    excerpt: "Meet T1’s World Championship 2024 team skins now.",
    videoId: "9_GrQ-v928o",
  },
];


  // Slider-knappar
  const scrollByAmount = (dir = 1) => {
    const el = sliderRef.current;
    if (!el) return;
    const amount = Math.min(480, el.clientWidth * 0.85);
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  return (
    <>
      {/* HERO: fullscreen video */}
      <section className="relative -mt-20 bg-[image:var(--bg-fallback)] bg-cover bg-center">
        <div className="relative w-full h-[50vh] sm:h-[60vh] md:h-[80vh] lg:h-screen">
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover object-center"
            src="/videos/startsidaVideo.mp4"
            autoPlay
            muted={muted}
            loop
            playsInline
            preload="auto"
          />
          <div className="absolute inset-0 flex items-end justify-end p-4">
            <button
              onClick={toggleMute}
              className="px-3 py-2 rounded-md bg-black/50 text-white border border-white/30 hover:bg-black/70 transition text-sm"
              aria-label={muted ? "Enable sound" : "Mute"}
              title={muted ? "Enable sound" : "Mute"}
            >
              {muted ? "🔇" : "🔊"}
            </button>
          </div>
        </div>
      </section>

      {/* FEATURED NEWS */}
      <section className="max-w-7xl mx-auto px-4 pt-24 pb-6">
        <h3 className="font-display text-sm tracking-widest text-rift-gold">
          FEATURED NEWS
        </h3>
        <div className="rift-sep"></div>

        <div className="flex gap-4 overflow-x-auto no-scrollbar md:grid md:grid-cols-3 md:gap-6 md:overflow-visible">
          {featured.map((n) => (
            <article
              key={n.id}
              className="card-fantasy min-w-[85%] md:min-w-0 overflow-hidden"
            >
            {n.image && (
  <a
    href={n.link}
    target="_blank"
    rel="noopener noreferrer"
    className="block"
  >
    <img
      src={n.image}
      alt={n.title}
      className="w-full h-40 md:h-44 object-cover hover:opacity-90 transition"
      loading="lazy"
    />
  </a>
)}

      {n.videoId && (
  <div className="w-full h-40 md:h-44 overflow-hidden">
    <iframe
      className="w-full h-full object-cover"
      src={`https://www.youtube.com/embed/${n.videoId}`}
      title={n.title}
      frameBorder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      referrerPolicy="strict-origin-when-cross-origin"
      allowFullScreen
    />
  </div>
)}
              

              <div className="p-2">
                <div className="text-[10px] tracking-widest text-gray-400 uppercase">
                  {n.tag} <span className="mx-1">•</span> {n.date}
                </div>
                <h4 className="mt-1 font-semibold text-gray-100">{n.title}</h4>
                <p className="mt-1 text-sm text-gray-400">{n.excerpt}</p>
              </div>
            </article>
          ))}
        </div>
      </section>


     {/* NEW MERCH! */}
<section className="max-w-7xl mx-auto px-4 pb-16">
  {/* Rubrik centrerad, pilar till höger */}
  {/* Rubrik och centrerade pilar */}
<div className="mb-3">
  <h3 className="font-display text-3xl md:text-4xl text-white text-center">
    NEW MERCH!
  </h3>

  {/* pilarna centrerade */}
  <div className="mt-3 flex items-center justify-center gap-2">
    <button
      onClick={() => scrollByAmount(-1)}
      className="px-3 py-2 rounded-md border border-rift-gold/30 text-rift-gold bg-black/30 hover:bg-black/50"
      aria-label="Scroll left"
      title="Scroll left"
    >
      ◀
    </button>
    <button
      onClick={() => scrollByAmount(1)}
      className="px-3 py-2 rounded-md border border-rift-gold/30 text-rift-gold bg-black/30 hover:bg-black/50"
      aria-label="Scroll right"
      title="Scroll right"
    >
      ▶
    </button>
  </div>
</div>


  <div className="rift-sep mb-4"></div>

  {newProducts.length === 0 ? (
    <p className="text-gray-400 text-center">No new merch yet.</p>
  ) : (
    <>
      {/* Själva slidern – scrollbar göms i CSS nedan */}
      <div
        ref={sliderRef}
        className="flex gap-4 overflow-x-auto hide-scrollbar scroll-smooth snap-x snap-mandatory"
      >
        {newProducts.map((p) => (
          <button
            key={p.id}
            onClick={() => goToProduct(p.id)}
            className="group relative min-w-[70%] sm:min-w-[48%] md:min-w-[32%] lg:min-w-[24%] text-left snap-start"
            aria-label={p.title || p.name}
            title={p.title || p.name}
          >
            <div className="border border-rift-gold/30 rounded-xl overflow-hidden bg-black/30 hover:bg-black/40 transition">
              <span className="absolute z-10 top-2 left-2 text-[10px] font-bold tracking-widest bg-rift-gold text-black px-2 py-0.5 rounded">
                NEW
              </span>

              <div className="aspect-[3/3] w-full overflow-hidden">
                <img
                  src={resolveProdImage(p)}
                  alt={p.title || p.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition"
                  loading="lazy"
                />
              </div>

              <div className="p-3">
                <div className="text-gray-100 font-semibold line-clamp-1">
                  {p.title || p.name}
                </div>
                <div className="text-sm text-gray-400 mt-1">
                  {p.price != null ? `${p.price} kr` : ""}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* CSS som döljer scrollbar i alla browsers */}
      <style>{`
        .hide-scrollbar {
          scrollbar-width: none;        /* Firefox */
          -ms-overflow-style: none;     /* IE/Edge */
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;                /* Chrome/Safari */
        }
      `}</style>
    </>
  )}
</section>
{/* CHOOSE YOUR CHAMPION */}
<section className="max-w-3xl mx-auto px-4 py-10 text-center">
  <p className="text-xs tracking-widest text-white">With more than 170 champions, you’ll find the perfect match for your playstyle. Master one, or master them all.</p>
  <h2 className="font-display text-3xl md:text-4xl text-gray-100 drop-shadow-lg">
    CHOOSE YOUR CHAMPION
  </h2>

  {/* Bild-knapp (discover-button.png från backend/public/images) */}
  <a
    href="https://www.leagueoflegends.com/en-gb/champions/"
    className="inline-flex items-center justify-center mt-6 p-0 bg-transparent"
    aria-label="Discover more champions"
    title="Discover more champions"
  >
    <img
      src={`${API_URL}/images/discover-button.png`}
      alt="Discover more champions"
      className="h-56 md:h-56 lg:h-56 w-auto select-none"
      draggable="false"
    />
  </a>
</section>


    </>
  );
}
