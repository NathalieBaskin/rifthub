import { useRef, useEffect, useState } from "react";
import yasuoImg from "../assets/images/nightbringerYasuo.jpeg";
import tftImg from "../assets/images/TeamfightTacticts.png";

export default function StartSida() {
  const videoRef = useRef(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoaded = () => {
      try {
        video.currentTime = 10; // starta 10 sek in
      } catch {
        // ignore error
      }
      const p = video.play();
      if (p && typeof p.then === "function") {
        p.catch(() => {});
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

  const featured = [
    {
      id: 1,
      title: "Nightbringer Yasuo Unbound Showcase",
      date: "18/01/2025",
      tag: "GAME UPDATES",
      excerpt:
        "A new era of darkness begins! Join Nightbringer Yasuo Unbound down the path of chaos in TFT.",
      image: yasuoImg,
    },
    {
      id: 2,
      title: "Teamfight Tactics patch 15.2 notes",
      date: "19/01/2025",
      tag: "PATCH NOTES",
      excerpt:
        "First patch of K.O. Coliseum with balance changes and a few new opening encounters.",
      image: tftImg,
    },
    {
      id: 3,
      title: "Xin Zhao Champion Update Trailer",
      date: "21/01/2025",
      tag: "CHAMPION",
      excerpt:
        "From the arenas of Noxus to the throne room of Demacia — the legend of Xin Zhao.",
      videoId: "VlKpZmbcZ7I",
    },
  ];

  return (
    <>
      {/* HERO VIDEO */}
   {/* HERO: fullscreen video (bakgrunden syns bakom om videon inte laddar) */}
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
                <img
                  src={n.image}
                  alt={n.title}
                  className="w-full h-40 md:h-44 object-cover"
                  loading="lazy"
                />
              )}
              {n.videoId && (
                <div className="relative aspect-video">
                  <iframe
                    className="w-full h-full rounded-lg"
                    src={`https://www.youtube.com/embed/${n.videoId}`}
                    title={n.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                </div>
              )}

              <div className="p-4">
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

      {/* CHOOSE YOUR CHAMPION */}
      <section className="max-w-3xl mx-auto px-4 py-10 text-center">
        <p className="text-xs tracking-widest text-gray-400">CHOOSE YOUR</p>
        <h2 className="font-display text-3xl md:text-4xl text-gray-100 drop-shadow-lg">
          CHAMPION
        </h2>

        <a
          href="https://www.leagueoflegends.com/en-gb/champions/"
          className="inline-flex items-center justify-center mt-6 px-6 py-3 rounded-md border border-rift-gold/40 bg-rift-card/60 text-gray-100 hover:bg-rift-card drop-shadow-glow"
        >
          DISCOVER MORE CHAMPIONS
        </a>
      </section>
    </>
  );
}
