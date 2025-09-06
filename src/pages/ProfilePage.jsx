// src/pages/ProfilePage.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getUserFromToken } from "../utils/auth.js";
import AlliesSection from "../components/AlliesSection.jsx";
import GallerySection from "../components/profile/GallerySection.jsx";
import PostsSection from "../components/profile/PostsSection.jsx";

const API_URL = "http://localhost:5000";

// Endast för mobil-offsets (krockar inte med andra sidor)
const MOBILE_NAV_H = 70;    // höjd på fixed navbar i mobil
const MOBILE_FOOTER_H = 52; // höjd på fixed footer i mobil

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

  return (
    <div className="relative max-w-6xl mx-auto p-6 text-black overflow-x-hidden">
      {/* ===== MOBIL ===== */}
      <div className="md:hidden">
        {/* Spacer så vi hamnar under fixed navbar */}
        <div style={{ height: MOBILE_NAV_H }} />

        {/* 1) Avatar + ram – centrerad och längre upp */}
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

        {/* 2) Scroll-bakgrund – vänsterställd text, större typsnitt */}
        <div className="relative mt-[-100px] max-w-lg mx-auto">
          <div
            className="rounded-xl px-10 pt-24 pb-16 bg-no-repeat bg-cover bg-center"
            style={{
              backgroundImage: "url('/images/scroll.png')",
              minHeight: "740px",
              width: "100%",
            }}
          >
            {/* Logotyper */}
            <div className="flex items-center gap-4 mb-5">
              {rankIcon && (
                <img
                  src={rankIcon}
                  alt={profile.rank}
                  className="h-20 w-20 object-contain"
                />
              )}
              {gameLogo && (
                <img
                  src={gameLogo}
                  alt={profile.game}
                  className={`object-contain ${profile.game === "wildrift" ? "h-16" : "h-15"}`}
                />
              )}
            </div>

            {/* Info – vänsterställd & större text */}
            <div className="space-y-3 text-left">
              <p className="text-lg">
                <b>Name:</b> {profile.name || "—"}
              </p>
              <p className="text-lg">
                <b>Age:</b> {profile.age || "—"}
              </p>
              <p className="text-lg">
                <b>Gender:</b> {profile.gender || "—"}
              </p>

              <div className="flex items-center gap-3 text-lg">
                <b>Preferred Lane:</b>
                {roleIcon ? (
                  <img
                    src={roleIcon}
                    alt={profile.preferred_lane}
                    className="w-10 h-10 object-contain"
                  />
                ) : (
                  "—"
                )}
              </div>

              <div className="flex items-center gap-3 text-lg">
                <b>Preferred Champ:</b>
                {champ ? (
                  <img
                    src={`${API_URL}${champ.file}`}
                    alt={champ.name}
                    className="w-12 h-12 object-cover rounded border border-rift-gold"
                  />
                ) : (
                  profile.preferred_champ_id || "—"
                )}
              </div>

              <p className="text-lg">
                <b>Level:</b> {profile.level || "—"}
              </p>
            </div>

            {/* Socials – ännu längre ned på pappret */}
            {profile.socials && (
              <div className="mt-20 flex gap-9">
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
                        className="w-7 h-7 opacity-90 hover:opacity-100 transition"
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

        {/* 3) Flikar – närmare pappret & ny ALLIES-flik */}
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

        {/* 4) Flik-innehåll */}
        <div className="mt-4">
          {activeTab === "posts" && <PostsSection profileUserId={profile.id} me={user} />}
          {activeTab === "gallery" && <GallerySection profileUserId={profile.id} me={user} />}
          {activeTab === "allies" && (
            <div className="max-w-md mx-auto rounded-xl border border-rift-gold/25 bg-black/20 backdrop-blur p-4">
              <AlliesSection profileUserId={profile.id} />
            </div>
          )}
        </div>

        {/* Spacer för fixed footer i mobil */}
        <div style={{ height: MOBILE_FOOTER_H }} />
      </div>

      {/* ===== iPAD / DESKTOP – oförändrat ===== */}
      <div className="hidden md:block">
        <div className="flex gap-8">
          {/* Vänster: Profilkort – original */}
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
            {/* Profilbild + rank + game logo */}
            <div className="absolute -top-0 left-0 flex items-center gap-6">
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

              {/* Rank + Game logo på samma rad */}
              <div className="flex items-center gap-3 ml-60 mt-2">
                {rankIcon && (
                  <div className="relative group">
                    <img
                      src={rankIcon}
                      alt={profile.rank}
                      className="w-16 h-16 object-contain"
                    />
                    <span className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100">
                      {profile.rank}
                    </span>
                  </div>
                )}
                {gameLogo && (
                  <img
                    src={gameLogo}
                    alt={profile.game}
                    className={`object-contain ${
                      profile.game === "wildrift" ? "h-16" : "h-14"
                    }`}
                  />
                )}
              </div>
            </div>

            {/* Profilinfo */}
            <div className="mt-44 text-left w-full max-w-lg space-y-2 relative">
              <p><b>Name:</b> {profile.name || "—"}</p>
              <p><b>Age:</b> {profile.age || "—"}</p>
              <p><b>Gender:</b> {profile.gender || "—"}</p>

              {/* Lane */}
              <div className="flex items-center gap-2">
                <b>Preferred Lane:</b>{" "}
                {roleIcon ? (
                  <div className="relative group">
                    <img
                      src={roleIcon}
                      alt={profile.preferred_lane}
                      className="w-8 h-8 object-contain"
                    />
                    <span className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100">
                      {profile.preferred_lane}
                    </span>
                  </div>
                ) : (
                  "—"
                )}
              </div>

              {/* Champ */}
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
                ) : (
                  profile.preferred_champ_id || "—"
                )}
              </div>

              <p><b>Level:</b> {profile.level || "—"}</p>

              {/* Socials längst ner i kortet, högerhörn */}
              {profile.socials && (
                <div className="absolute bottom-0 right-6 flex gap-3">
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
                          className="w-6 h-6 opacity-90 hover:opacity-100 transition"
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

            {/* Flikar */}
            <div className="flex justify-center gap-8 mt-6">
              <button
                className={`px-8 py-2 rounded ${
                  activeTab === "posts" ? "bg-green-950 text-white" : "bg-green-950 text-gray-300"
                }`}
                onClick={() => setActiveTab("posts")}
              >
                POSTS
              </button>
              <button
                className={`px-8 py-2 rounded ${
                  activeTab === "gallery" ? "bg-green-950 text-white" : "bg-green-950 text-gray-300"
                }`}
                onClick={() => setActiveTab("gallery")}
              >
                GALLERY
              </button>
            </div>

            {/* Flik-innehåll */}
            <div className="mt-6 w-full">
              {activeTab === "posts" && <PostsSection profileUserId={profile.id} me={user} />}
              {activeTab === "gallery" && <GallerySection profileUserId={profile.id} me={user} />}
            </div>
          </div>

          {/* Höger: Allies */}
          <AlliesSection profileUserId={profile.id} />
        </div>
      </div>
    </div>
  );
}
