// src/pages/ProfilePage.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getUserFromToken } from "../utils/auth.js";
import AlliesSection from "../components/AlliesSection.jsx";
import GallerySection from "../components/profile/GallerySection.jsx";


// 👇 importera våra nya components
import PostsSection from "../components/profile/PostsSection.jsx";

export default function ProfilePage() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [champs, setChamps] = useState([]);
  const [activeTab, setActiveTab] = useState("posts"); // 🔹 ny state för flikar
  const user = getUserFromToken();

  useEffect(() => {
    async function fetchProfile() {
      try {
        const profileId = id || user.id;
        const res = await fetch(`http://localhost:5000/api/profile/${profileId}`);
        if (!res.ok) throw new Error("Profile fetch failed");
        const data = await res.json();
        setProfile(data);
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        setLoading(false);
      }
    }

    async function fetchChamps() {
      try {
        const res = await fetch("http://localhost:5000/api/champions");
        if (!res.ok) throw new Error("Failed to load champs");
        const data = await res.json();
        setChamps(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load champs", err);
      }
    }

    if (user) {
      fetchProfile();
      fetchChamps();
    }
  }, [id, user]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!profile) return <div className="p-6">No profile found</div>;

  // champion info
  const champ = champs.find((c) => c.name === profile.preferred_champ_id);

  const rankIcon = profile.rank
    ? `http://localhost:5000/rank/${profile.rank.charAt(0).toUpperCase() + profile.rank.slice(1)}.png`
    : null;

  const roleIcon = profile.preferred_lane
    ? `http://localhost:5000/role/${profile.preferred_lane.charAt(0).toUpperCase() + profile.preferred_lane.slice(1)}.png`
    : null;

  const gameLogo =
    profile.game === "league"
      ? "http://localhost:5000/images/League.png"
      : profile.game === "wildrift"
      ? "http://localhost:5000/images/WildRift.png"
      : null;

  // social media ikoner (hämtas från backend/public/socials)
  const socialIcons = {
    facebook: "http://localhost:5000/socials/facebook.png",
    instagram: "http://localhost:5000/socials/instagram.png",
    twitch: "http://localhost:5000/socials/twitch.png",
    youtube: "http://localhost:5000/socials/youtube.png",
    discord: "http://localhost:5000/socials/discord.png",
  };

  return (
    <div className="relative max-w-6xl mx-auto mt-10 p-6 text-black">
      <div className="flex gap-8">
        {/* Vänster: Profilkort */}
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
                      : `http://localhost:5000${profile.avatar_url}`
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
                    src={`http://localhost:5000${champ.file}`}
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

            {/* ✅ Socials längst ner i kortet, högerhörn */}
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

          {/* 🔹 Flikar */}
          <div className="flex justify-center gap-6 mt-6">
            <button
              className={`px-4 py-2 ${activeTab === "posts" ? "bg-green-950 text-white" : "bg-green-950"}`}
              onClick={() => setActiveTab("posts")}
            >
              POSTS
            </button>
            <button
              className={`px-4 py-2 ${activeTab === "gallery" ? "bg-green-950 text-white" : "bg-green-950"}`}
              onClick={() => setActiveTab("gallery")}
            >
              GALLERY
            </button>
            <button
              className={`px-4 py-2 ${activeTab === "history" ? "bg-green-950 text-white" : "bg-green-950"}`}
              onClick={() => setActiveTab("history")}
            >
              MATCH HISTORY
            </button>
          </div>

          {/* 🔹 Innehållet beroende på flik */}
          <div className="mt-6 w-full">
          {activeTab === "posts" && <PostsSection profileUserId={profile.id} me={user} />}
{activeTab === "gallery" && <GallerySection profileUserId={profile.id} me={user} />}


            {activeTab === "history" && <div>⚔️ Match history kommer snart...</div>}
          </div>
        </div>

        {/* Höger: Allies */}
        <AlliesSection profileUserId={profile.id} />
      </div>
    </div>
  );
}
