// src/pages/ProfilePage.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getUserFromToken } from "../utils/auth.js";
import AlliesSection from "../components/AlliesSection.jsx";

export default function ProfilePage() {
  const { id } = useParams(); // så man kan besöka andras profiler via /profile/:id
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = getUserFromToken();

  useEffect(() => {
    async function fetchProfile() {
      try {
        const profileId = id || user.id; // 👈 använd id från URL om det finns, annars eget
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
    if (user) fetchProfile();
  }, [id, user]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!profile) return <div className="p-6">No profile found</div>;

  return (
    <div className="relative max-w-6xl mx-auto mt-10 p-6">
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
          {/* Profilbild med ram */}
          <div className="absolute -top-0 left-0 w-56 h-56">
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

          {/* Profilinfo */}
          <div className="mt-44 text-left w-full max-w-lg">
            <p><b>Name:</b> {profile.name || "—"}</p>
            <p><b>Age:</b> {profile.age || "—"}</p>
            <p><b>Gender:</b> {profile.gender || "—"}</p>
            <p><b>Preferred Lane:</b> {profile.preferred_lane || "—"}</p>
            <p><b>Preferred Champ:</b> {profile.preferred_champ_id || "—"}</p>
            <p><b>Rank:</b> {profile.rank || "—"}</p>
            <p><b>Level:</b> {profile.level || "—"}</p>
          </div>
        </div>

        {/* Höger: Allies */}
        <AlliesSection profileUserId={profile.id} />
      </div>
    </div>
  );
}
