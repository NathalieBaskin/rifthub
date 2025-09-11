import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getUserFromToken } from "../utils/auth.js";
import AlliesSection from "../components/AlliesSection.jsx";
import GallerySection from "../components/profile/GallerySection.jsx";
import PostsSection from "../components/profile/PostsSection.jsx";

const API_URL = "http://localhost:5000";

// Mobil-offsets
const MOBILE_NAV_H = 70;
const MOBILE_FOOTER_H = 52;

export default function ProfilePage() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [champs, setChamps] = useState([]);
  const [activeTab, setActiveTab] = useState("posts");
  const user = getUserFromToken();

  useEffect(() => {
    async function fetchAll() {
      try {
        const profileId = id || user?.id;
        if (!profileId) return;
        const [pRes, cRes] = await Promise.all([
          fetch(`${API_URL}/api/profile/${profileId}`),
          fetch(`${API_URL}/api/champions`),
        ]);
        if (pRes.ok) setProfile(await pRes.json());
        if (cRes.ok) {
          const c = await cRes.json();
          setChamps(Array.isArray(c) ? c : []);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, [id, user?.id]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!profile) return <div className="p-6">No profile found</div>;

  const champ = champs.find((c) => c.name === profile.preferred_champ_id);

  const rankIcon = profile.rank
    ? `${API_URL}/rank/${profile.rank.charAt(0).toUpperCase() + profile.rank.slice(1)}.png`
    : null;

  const roleIcon = profile.preferred_lane
    ? `${API_URL}/role/${profile.preferred_lane.charAt(0).toUpperCase() + profile.preferred_lane.slice(1)}.png`
    : null;

  const gameLogo =
    profile.game === "league"
      ? `${API_URL}/images/League.png`
      : profile.game === "wildrift"
      ? `${API_URL}/images/WildRift.png`
      : null;

  const socialIcons = {
    facebook: `${API_URL}/socials/facebook.png`,
    instagram: `${API_URL}/socials/instagram.png`,
    twitch: `${API_URL}/socials/twitch.png`,
    youtube: `${API_URL}/socials/youtube.png`,
    discord: `${API_URL}/socials/discord.png`,
  };

  // ===== Show helpers (visa bara om ifyllda) =====
  const hasLevel =
    profile.level !== null &&
    profile.level !== undefined &&
    `${profile.level}` !== "";
  const hasLP =
    profile.lp !== null &&
    profile.lp !== undefined &&
    `${profile.lp}` !== "";
  const hasLeagueTag =
    profile.league_tag !== null &&
    profile.league_tag !== undefined &&
    `${profile.league_tag}`.trim() !== "";
  const hasWildriftTag =
    profile.wildrift_tag !== null &&
    profile.wildrift_tag !== undefined &&
    `${profile.wildrift_tag}`.trim() !== "";
  const hasNote =
    profile.note !== null &&
    profile.note !== undefined &&
    `${profile.note}`.trim() !== "";

  return (
    <div className="relative max-w-6xl mx-auto p-6 text-black overflow-x-hidden">
      {/* ===== MOBIL (<768) ===== */}
      <div className="md:hidden">
        <div style={{ height: MOBILE_NAV_H }} />

        <div className="flex justify-center -mt-20">
          <div className="relative w-72 h-72">
            <img
              src={
                profile.avatar_url
                  ? profile.avatar_url.startsWith("http")
                    ? profile.avatar_url
                    : `${API_URL}${profile.avatar_url}`
                  : "/images/default-avatar.png"
              }
              alt="Profile avatar"
              className="absolute inset-0 m-auto w-[60%] h-[60%] object-cover rounded-full z-10"
            />
            <img
              src="/images/frame.png"
              alt="Frame"
              className="absolute inset-0 w-full h-full pointer-events-none z-20"
            />
          </div>
        </div>

        <div className="relative mt-[-100px] max-w-lg mx-auto">
          <div
            className="rounded-xl px-10 pt-24 pb-16 bg-no-repeat bg-cover bg-center"
            style={{
              backgroundImage: "url('/images/scroll.png')",
              minHeight: "740px",
              width: "100%",
            }}
          >
            <div className="flex items-center gap-4 mb-5">
              {rankIcon && (
                <img src={rankIcon} alt={profile.rank} className="h-20 w-20 object-contain" />
              )}
              {gameLogo && (
                <img
                  src={gameLogo}
                  alt={profile.game}
                  className="object-contain w-auto"
                  style={{ height: profile.game === "wildrift" ? 100 : 60 }}
                />
              )}
            </div>

            <div className="space-y-3 text-left">
              <p className="text-lg"><b>Name:</b> {profile.name || "—"}</p>
              <p className="text-lg"><b>Age:</b> {profile.age || "—"}</p>
              <p className="text-lg"><b>Gender:</b> {profile.gender || "—"}</p>

              <div className="flex items-center gap-3 text-lg">
                <b>Preferred Lane:</b>
                {roleIcon ? (
                  <img src={roleIcon} alt={profile.preferred_lane} className="w-10 h-10 object-contain" />
                ) : ("—")}
              </div>

              <div className="flex items-center gap-3 text-lg">
                <b>Preferred Champ:</b>
                {champ ? (
                  <img
                    src={`${API_URL}${champ.file}`}
                    alt={champ.name}
                    className="w-12 h-12 object-cover rounded border border-rift-gold"
                  />
                ) : (profile.preferred_champ_id || "—")}
              </div>

              {/* Level / LP */}
              {(hasLevel || hasLP) && (
                <>
                  {hasLevel && <p className="text-lg"><b>Level:</b> {profile.level}</p>}
                  {hasLP && <p className="text-lg"><b>LP:</b> {profile.lp}</p>}
                </>
              )}

              {/* Tags */}
              {hasLeagueTag && <p className="text-lg"><b>League Tag:</b> {profile.league_tag}</p>}
              {hasWildriftTag && <p className="text-lg"><b>Wild Rift Tag:</b> {profile.wildrift_tag}</p>}

              {/* Note */}
              {hasNote && (
                <p className="text-lg whitespace-pre-wrap">
                  <b>Note:</b> {profile.note}
                </p>
              )}

              {profile.socials && (
                <div className="mt-20 flex gap-9">
                  {Object.entries(profile.socials).map(([key, value]) =>
                    value ? (
                      <a key={key} href={value} target="_blank" rel="noopener noreferrer" className="relative group">
                        <img src={socialIcons[key]} alt={key} className="w-7 h-7 opacity-95 hover:opacity-100 transition" />
                        <span className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100">
                          {key}
                        </span>
                      </a>
                    ) : null
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-4 mt-2">
          <button
            className={`px-6 py-2 rounded ${activeTab === "posts" ? "bg-green-950 text-white" : "bg-green-950 text-gray-300"}`}
            onClick={() => setActiveTab("posts")}
          >
            POSTS
          </button>
          <button
            className={`px-6 py-2 rounded ${activeTab === "gallery" ? "bg-green-950 text-white" : "bg-green-950 text-gray-300"}`}
            onClick={() => setActiveTab("gallery")}
          >
            GALLERY
          </button>
          <button
            className={`px-6 py-2 rounded ${activeTab === "allies" ? "bg-green-950 text-white" : "bg-green-950 text-gray-300"}`}
            onClick={() => setActiveTab("allies")}
          >
            ALLIES
          </button>
        </div>

        <div className="mt-4">
          {activeTab === "posts" && <PostsSection profileUserId={profile.id} me={user} />}
          {activeTab === "gallery" && <GallerySection profileUserId={profile.id} me={user} />}
          {activeTab === "allies" && (
            <div className="max-w-md mx-auto rounded-xl border border-rift-gold/25 bg-black/20 backdrop-blur p-4">
              <AlliesSection profileUserId={profile.id} />
            </div>
          )}
        </div>

        <div style={{ height: MOBILE_FOOTER_H }} />
      </div>

      {/* ===== IPAD (768–1279) ===== */}
      <div className="hidden md:block xl:hidden">
        {/* Avatar + Ram centrerad */}
        <div className="flex justify-center mt-6">
          <div className="relative w-64 aspect-square">
            <img
              src={
                profile.avatar_url
                  ? profile.avatar_url.startsWith("http")
                    ? profile.avatar_url
                    : `${API_URL}${profile.avatar_url}`
                  : "/images/default-avatar.png"
              }
              alt="Profile avatar"
              className="absolute inset-0 m-auto w-[60%] h-[60%] object-cover rounded-full z-10"
            />
            <img
              src="/images/frame.png"
              alt="Frame"
              className="absolute inset-0 w-full h-full pointer-events-none z-20"
            />
          </div>
        </div>

        {/* Scroll-”papper” */}
        <div className="relative mt-[-70px] max-w-[820px] mx-auto">
          <div
            className="relative rounded-xl px-14 pt-24 pb-20 bg-no-repeat bg-cover bg-center"
            style={{
              backgroundImage: "url('/images/scroll.png')",
              minHeight: "960px",
              width: "100%",
            }}
          >
            {/* Loggor */}
            <div className="flex items-center justify-center gap-8 -mt-12 mb-6">
              {rankIcon && (
                <img
                  src={rankIcon}
                  alt={profile.rank}
                  className="h-[104px] w-[104px] object-contain"
                />
              )}
              {gameLogo && (
                <img
                  src={gameLogo}
                  alt={profile.game}
                  className="object-contain"
                  style={{ height: profile.game === "wildrift" ? 140 : 96 }}
                />
              )}
            </div>

            {/* Info */}
            <div className="mx-auto max-w-[560px] pl-20 space-y-6 text-left text-[24px] leading-8">
              <p><b>Name:</b> {profile.name || "—"}</p>
              <p><b>Age:</b> {profile.age || "—"}</p>
              <p><b>Gender:</b> {profile.gender || "—"}</p>

              <div className="flex items-center gap-5">
                <b>Preferred Lane:</b>
                {roleIcon ? (
                  <img
                    src={roleIcon}
                    alt={profile.preferred_lane}
                    className="w-14 h-14 object-contain"
                  />
                ) : ("—")}
              </div>

              <div className="flex items-center gap-5">
                <b>Preferred Champ:</b>
                {champ ? (
                  <img
                    src={`${API_URL}${champ.file}`}
                    alt={champ.name}
                    className="w-16 h-16 object-cover rounded border border-rift-gold"
                  />
                ) : (profile.preferred_champ_id || "—")}
              </div>

              {/* Level / LP */}
              {(hasLevel || hasLP) && (
                <>
                  {hasLevel && <p><b>Level:</b> {profile.level}</p>}
                  {hasLP && <p><b>LP:</b> {profile.lp}</p>}
                </>
              )}

              {/* Tags */}
              {hasLeagueTag && <p><b>League Tag:</b> {profile.league_tag}</p>}
              {hasWildriftTag && <p><b>Wild Rift Tag:</b> {profile.wildrift_tag}</p>}

              {/* Note */}
              {hasNote && (
                <p className="whitespace-pre-wrap"><b>Note:</b> {profile.note}</p>
              )}
            </div>

            {/* Socials */}
            {profile.socials && (
              <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex items-center justify-center gap-14">
                {Object.entries(profile.socials).map(([key, value]) =>
                  value ? (
                    <a
                      key={key}
                      href={value}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative group"
                    >
                      <img
                        src={socialIcons[key]}
                        alt={key}
                        className="w-8 h-8 opacity-90 hover:opacity-100 transition"
                      />
                      <span className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100">
                        {key}
                      </span>
                    </a>
                  ) : null
                )}
              </div>
            )}
          </div>
        </div>

        {/* Flikar */}
        <div className="flex justify-center gap-6 mt-4">
          <button
            className={`px-7 py-2 rounded ${activeTab === "posts" ? "bg-green-950 text-white" : "bg-green-950 text-gray-300"}`}
            onClick={() => setActiveTab("posts")}
          >
            POSTS
          </button>
          <button
            className={`px-7 py-2 rounded ${activeTab === "gallery" ? "bg-green-950 text-white" : "bg-green-950 text-gray-300"}`}
            onClick={() => setActiveTab("gallery")}
          >
            GALLERY
          </button>
          <button
            className={`px-7 py-2 rounded ${activeTab === "allies" ? "bg-green-950 text-white" : "bg-green-950 text-gray-300"}`}
            onClick={() => setActiveTab("allies")}
          >
            ALLIES
          </button>
        </div>

        {/* Innehåll per flik */}
        <div className="mt-4">
          {activeTab === "posts" && (
            <div className="max-w-[820px] mx-auto">
              <PostsSection profileUserId={profile.id} me={user} />
            </div>
          )}
          {activeTab === "gallery" && (
            <div className="max-w-[820px] mx-auto">
              <GallerySection profileUserId={profile.id} me={user} />
            </div>
          )}
          {activeTab === "allies" && (
            <div className="mt-4 flex justify-center">
              <div className="w-full max-w-[350px] mx-auto rounded-xl border border-rift-gold/25 bg-black/20 backdrop-blur p-4">
                <AlliesSection profileUserId={profile.id} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== DESKTOP (≥1280) ===== */}
<div className="hidden xl:block">
  <div className="flex gap-2">
    <div
      className="relative flex flex-col items-center p-12 flex-1"
      style={{
        backgroundImage: "url('/images/mypage-paper.png')",
        backgroundSize: "contain",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center top",
        minHeight: "700px",
      }}
    >
      {/* Vänsterspalt: avatar + loggor + (NYTT) tag/LP under loggorna */}
      <div className="absolute -top-0 left-0 flex items-start gap-6">
        {/* Avatar */}
        <div className="relative w-56 h-56">
          <img
            src={
              profile.avatar_url
                ? profile.avatar_url.startsWith("http")
                  ? profile.avatar_url
                  : `${API_URL}${profile.avatar_url}`
                : "/images/default-avatar.png"
            }
            alt="Profile avatar"
            className="absolute inset-0 m-auto w-[57%] h-[57%] object-cover rounded-full"
          />
          <img
            src="/images/frame.png"
            alt="Frame"
            className="absolute inset-0 w-full h-full pointer-events-none"
          />
        </div>

        {/* Loggor + (NY) League Tag + LP direkt under */}
        <div className="flex flex-col ml-60 mt-24">
          <div className="flex items-center gap-3">
            {rankIcon && (
              <div className="relative group">
                <img src={rankIcon} alt={profile.rank} className="w-16 h-16 object-contain" />
                <span className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100">
                  {profile.rank}
                </span>
              </div>
            )}
            {gameLogo && (
              <img
                src={gameLogo}
                alt={profile.game}
                className={`object-contain ${profile.game === "wildrift" ? "h-16" : "h-14"}`}
              />
            )}
          </div>

          {/* 🔹 NYTT: League Tag & LP precis under loggorna (visas bara om ifyllt) */}
          {(hasLeagueTag || hasLP) && (
            <div className="mt-2 text-sm text-black/80 space-y-0.5">
              {hasLeagueTag && (
                <div><b>League Tag:</b> {profile.league_tag}</div>
              )}
              {hasLP && (
                <div><b>LP:</b> {profile.lp}</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Info-ruta */}
      <div className="mt-44 text-left w-full max-w-lg space-y-2 relative">
        <p><b>Name:</b> {profile.name || "—"}</p>
        <p><b>Age:</b> {profile.age || "—"}</p>
        <p><b>Gender:</b> {profile.gender || "—"}</p>

        <div className="flex items-center gap-2">
          <b>Preferred Lane:</b>{" "}
          {roleIcon ? (
            <div className="relative group">
              <img src={roleIcon} alt={profile.preferred_lane} className="w-8 h-8 object-contain" />
              <span className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100">
                {profile.preferred_lane}
              </span>
            </div>
          ) : ("—")}
        </div>

        <div className="flex items-center gap-2">
          <b>Preferred Champ:</b>{" "}
          {champ ? (
            <div className="relative group flex items-center gap-2">
              <img
                src={`${API_URL}${champ.file}`}
                alt={champ.name}
                className="w-10 h-10 object-cover rounded border border-rift-gold"
              />
              <span className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100">
                {champ.name}
              </span>
            </div>
          ) : (profile.preferred_champ_id || "—")}
        </div>

        {/* Level/LP inne i info-delen låter vi vara – LP visas ändå redan uppe under loggorna */}
        {profile.level !== null && profile.level !== undefined && `${profile.level}` !== "" && (
          <p><b>Level:</b> {profile.level}</p>
        )}
      {/* (valfritt) visa Wild Rift Tag / Note här om du vill */}
        {profile.wildrift_tag && `${profile.wildrift_tag}`.trim() !== "" && (
          <p className="mt-2"><b>Wild Rift Tag:</b> {profile.wildrift_tag}</p>
        )}
        {profile.note && `${profile.note}`.trim() !== "" && (
          <p className="mt-1 whitespace-pre-wrap"> {profile.note}</p>
        )}
      </div>
        {/* 🔹 NYTT: Socials på desktop (de saknades tidigare) */}
        {profile.socials && Object.values(profile.socials).some(Boolean) && (
          <div className="mt-4 flex flex-wrap items-center gap-6">
            {Object.entries(profile.socials).map(([key, value]) =>
              value ? (
                <a
                  key={key}
                  href={value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative group"
                  title={key}
                >
                  <img
                    src={socialIcons[key]}
                    alt={key}
                    className="w-8 h-9 opacity-95 hover:opacity-100 transition"
                  />
                  <span className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100">
                    {key}
                  </span>
                </a>
              ) : null
            )}
          </div>
        )}

  

      {/* Tabs */}
      <div className="flex justify-center gap-8 mt-6">
        <button
          className={`px-8 py-2 rounded ${activeTab === "posts" ? "bg-green-950 text-white" : "bg-green-950 text-gray-300"}`}
          onClick={() => setActiveTab("posts")}
        >
          POSTS
        </button>
        <button
          className={`px-8 py-2 rounded ${activeTab === "gallery" ? "bg-green-950 text-white" : "bg-green-950 text-gray-300"}`}
          onClick={() => setActiveTab("gallery")}
        >
          GALLERY
        </button>
      </div>

      <div className="mt-6 w-full">
        {activeTab === "posts" && <PostsSection profileUserId={profile.id} me={user} />}
        {activeTab === "gallery" && <GallerySection profileUserId={profile.id} me={user} />}
      </div>
    </div>

    {/* Desktop: Allies som sidokolumn */}
    <AlliesSection profileUserId={profile.id} />
  </div>
</div>

        </div>
    
  );
}
