import { useEffect, useState } from "react";
import { getUserFromToken } from "../utils/auth.js";
import { Link } from "react-router-dom";

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);   // Visningsläge
  const [formData, setFormData] = useState(null); // Editläge
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const user = getUserFromToken();

  // ✅ Hämta profil en gång vid mount
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch(`http://localhost:5000/api/profile/${user.id}`);
        const data = await res.json();

        // Sätt både visning och formulär
        setProfile(data);
        setFormData({ ...data });
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        setLoading(false);
      }
    }
    if (user) fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);  // 👈 körs bara en gång

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSave = async () => {
    try {
      await fetch(`http://localhost:5000/api/profile/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      setProfile(formData); // Uppdatera visning
      setEditing(false);
    } catch (err) {
      console.error("Failed to save profile", err);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!profile || !formData) return <div className="p-6">No profile found</div>;

  return (
    <div className="max-w-5xl mx-auto parchment-wrapper mt-10 p-6">
      <h1 className="font-display text-3xl mb-6 text-rift-gold">Rift Profile</h1>

      <div className="grid grid-cols-12 gap-6">
        {/* === Vänster: profilbild === */}
        <div className="col-span-3">
          <div className="border-4 border-rift-gold rounded-xl overflow-hidden">
            <img
              src="/images/default-avatar.png"
              alt="Profile avatar"
              className="w-full h-48 object-cover"
            />
          </div>
        </div>

        {/* === Mitten: profilinfo === */}
        <div className="col-span-6 bg-rift-card/60 rounded-lg p-4 border border-rift-gold/40">
          {!editing ? (
            <>
              <p><b>Name:</b> {profile.name || "—"}</p>
              <p><b>Age:</b> {profile.age || "—"}</p>
              <p><b>Gender:</b> {profile.gender || "—"}</p>
              <p><b>Preferred Lane:</b> {profile.preferred_lane || "—"}</p>
              <p><b>Preferred Champ:</b> {profile.preferred_champ_id || "—"}</p>
              <p><b>Rank:</b> {profile.rank || "—"}</p>
              <p><b>Level:</b> {profile.level || "—"}</p>

              <button
                onClick={() => setEditing(true)}
                className="mt-4 px-6 py-2 bg-rift-bg text-rift-gold border border-rift-gold/50 rounded"
              >
                Edit Profile
              </button>
            </>
          ) : (
            <>
              <label className="block mb-2">
                Name
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full border rounded p-2 text-rift-bg"
                />
              </label>

              <label className="block mb-2">
                Age
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  className="w-full border rounded p-2 text-rift-bg"
                />
              </label>

              <label className="block mb-2">
                Gender
                <select
                  name="gender"
                  value={formData.gender}
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

              {/* Lägg till fler inputs för lane, champ, rank, level osv */}

              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleSave}
                  className="px-6 py-2 bg-rift-card text-rift-gold border border-rift-gold/50 rounded"
                >
                  Save Profile
                </button>
                <button
                  onClick={() => {
                    setFormData({ ...profile }); // återställ
                    setEditing(false);
                  }}
                  className="px-6 py-2 bg-gray-600 text-white rounded"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>

        {/* === Höger: Allies (Friends list) === */}
        <div className="col-span-3 bg-rift-card/60 rounded-lg p-4 border border-rift-gold/40">
          <h2 className="font-display text-xl mb-2">Allies</h2>
          <ul className="space-y-2">
            <li className="text-rift-gold">Friend 1</li>
            <li className="text-rift-gold">Friend 2</li>
            <li className="text-rift-gold">Friend 3</li>
          </ul>
        </div>
      </div>

      {/* === Nedre knappar === */}
      <div className="mt-6 flex gap-6 justify-center">
        <Link to="/profile/posts" className="btn-rift">Posts</Link>
        <Link to="/profile/gallery" className="btn-rift">Gallery</Link>
        <Link to="/profile/matches" className="btn-rift">Match History</Link>
      </div>
    </div>
  );
}
