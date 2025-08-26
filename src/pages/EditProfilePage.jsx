// src/pages/EditProfilePage.jsx
import { useEffect, useState } from "react";
import { getUserFromToken } from "../utils/auth.js";

export default function EditProfilePage() {
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    preferred_lane: "",
    preferred_champ_id: "",
    rank: "",
    level: "",
    avatar_url: ""
  });
  const [loading, setLoading] = useState(true);
  const user = getUserFromToken();

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch(`http://localhost:5000/api/profile/${user.id}`);
        const data = await res.json();
        // Initiera bara om fältet är tomt, annars låt användarens input vara kvar
        setFormData((prev) => ({
          ...prev,
          name: prev.name || data.name || "",
          age: prev.age || data.age || "",
          gender: prev.gender || data.gender || "",
          preferred_lane: prev.preferred_lane || data.preferred_lane || "",
          preferred_champ_id: prev.preferred_champ_id || data.preferred_champ_id || "",
          rank: prev.rank || data.rank || "",
          level: prev.level || data.level || "",
          avatar_url: prev.avatar_url || data.avatar_url || ""
        }));
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        setLoading(false);
      }
    }
    if (user) fetchProfile();
  }, [user]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formDataUpload = new FormData();
    formDataUpload.append("avatar", file);

    try {
      const res = await fetch(
        `http://localhost:5000/api/profile/${user.id}/avatar`,
        { method: "POST", body: formDataUpload }
      );
      const data = await res.json();
      if (data.success) {
        setFormData((prev) => ({ ...prev, avatar_url: data.avatarUrl }));
      }
    } catch (err) {
      console.error("Upload failed", err);
    }
  };

  const handleSave = async () => {
    try {
      await fetch(`http://localhost:5000/api/profile/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      alert("Profile saved!");
    } catch (err) {
      console.error("Failed to save profile", err);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="relative max-w-5xl mx-auto mt-10 p-6">
      <div
        className="relative flex flex-col items-center p-12"
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
              formData.avatar_url
                ? formData.avatar_url.startsWith("http")
                  ? formData.avatar_url
                  : `http://localhost:5000${formData.avatar_url}`
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

        {/* Formulär */}
        <div className="mt-44 text-left w-full max-w-lg">
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

          <label className="block mb-2">
            Preferred Lane
            <select
              name="preferred_lane"
              value={formData.preferred_lane}
              onChange={handleChange}
              className="w-full border rounded p-2 text-rift-bg"
            >
              <option value="">Select</option>
              <option value="top">Top</option>
              <option value="jungle">Jungle</option>
              <option value="mid">Mid</option>
              <option value="adc">ADC</option>
              <option value="support">Support</option>
            </select>
          </label>

          <label className="block mb-2">
            Preferred Champion
            <input
              name="preferred_champ_id"
              value={formData.preferred_champ_id}
              onChange={handleChange}
              className="w-full border rounded p-2 text-rift-bg"
            />
          </label>

          <label className="block mb-2">
            Rank
            <input
              name="rank"
              value={formData.rank}
              onChange={handleChange}
              className="w-full border rounded p-2 text-rift-bg"
            />
          </label>

          <label className="block mb-2">
            Level
            <input
              type="number"
              name="level"
              value={formData.level}
              onChange={handleChange}
              className="w-full border rounded p-2 text-rift-bg"
            />
          </label>

          <label className="block mb-2">
            Avatar
            <input type="file" accept="image/*" onChange={handleAvatarUpload} />
          </label>

          <div className="flex gap-3 mt-4">
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-rift-card text-rift-gold border border-rift-gold/50 rounded"
            >
              Save Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
