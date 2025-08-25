import { useEffect, useState } from "react";
import { getUserFromToken } from "../utils/auth.js";

export default function MyPage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const user = getUserFromToken(); // { id, username, is_admin }

  // Hämta profil
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch(`http://localhost:5000/api/profile/${user.id}`);
        if (!res.ok) throw new Error("Failed to load profile");
        const data = await res.json();
        setProfile(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (user) fetchProfile();
  }, [user]);

  // Ändra värde i formuläret
  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  // Spara profil
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`http://localhost:5000/api/profile/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(profile),
      });
      if (!res.ok) throw new Error("Failed to save profile");
      alert("✅ Profile saved!");
    } catch (err) {
      console.error(err);
      alert("❌ Error saving profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!profile) return <div className="p-6">No profile found.</div>;

  return (
    <div className="max-w-3xl mx-auto parchment-wrapper mt-10">
      <h1 className="font-display text-3xl mb-6 text-rift-bg">My Page</h1>

      <div className="grid gap-4">
        {/* ===== BASIC INFO ===== */}
        <label>
          Name
          <input
            name="name"
            value={profile.name || ""}
            onChange={handleChange}
            className="w-full border rounded p-2 text-rift-bg"
          />
        </label>

        <label>
          Age
          <input
            type="number"
            name="age"
            value={profile.age || ""}
            onChange={handleChange}
            className="w-full border rounded p-2 text-rift-bg"
          />
        </label>

        <label>
          Gender
          <select
            name="gender"
            value={profile.gender || ""}
            onChange={handleChange}
            className="w-full border rounded p-2 text-rift-bg"
          >
            <option value="">Select</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
            <option value="rather not say">Rather not say</option>
          </select>
        </label>

        {/* ===== GAME INFO ===== */}
        <label>
          Preferred Lane
          <input
            name="preferred_lane"
            value={profile.preferred_lane || ""}
            onChange={handleChange}
            className="w-full border rounded p-2 text-rift-bg"
          />
        </label>

        <label>
          Preferred Champion (ID)
          <input
            type="number"
            name="preferred_champ_id"
            value={profile.preferred_champ_id || ""}
            onChange={handleChange}
            className="w-full border rounded p-2 text-rift-bg"
          />
        </label>

        <label>
          Rank
          <input
            name="rank"
            value={profile.rank || ""}
            onChange={handleChange}
            className="w-full border rounded p-2 text-rift-bg"
          />
        </label>

        <label>
          Level
          <input
            type="number"
            name="level"
            value={profile.level || ""}
            onChange={handleChange}
            className="w-full border rounded p-2 text-rift-bg"
          />
        </label>

        <label>
          League Tag
          <input
            name="league_tag"
            value={profile.league_tag || ""}
            onChange={handleChange}
            className="w-full border rounded p-2 text-rift-bg"
          />
        </label>

        <label>
          Wildrift Tag
          <input
            name="wildrift_tag"
            value={profile.wildrift_tag || ""}
            onChange={handleChange}
            className="w-full border rounded p-2 text-rift-bg"
          />
        </label>

        {/* ===== EXTRA ===== */}
        <label>
          Note
          <textarea
            name="note"
            value={profile.note || ""}
            onChange={handleChange}
            className="w-full border rounded p-2 text-rift-bg"
          />
        </label>

        <label>
          Background ID
          <input
            type="number"
            name="background_id"
            value={profile.background_id || ""}
            onChange={handleChange}
            className="w-full border rounded p-2 text-rift-bg"
          />
        </label>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-6 px-6 py-2 bg-rift-card text-rift-gold border border-rift-gold/50 rounded hover:bg-rift-bg"
      >
        {saving ? "Saving..." : "Save Profile"}
      </button>
    </div>
  );
}
