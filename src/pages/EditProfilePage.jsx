import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserFromToken } from "../utils/auth.js";

export default function EditProfilePage() {
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    preferred_lane: "",
    preferred_champ_id: "",
    game: "",
    rank: "",
    level: "",
    lp: "",               // NEW
    league_tag: "",       // NEW
    wildrift_tag: "",     // NEW
    note: "",             // NEW
    avatar_url: "",
    socials: {
      facebook: "",
      instagram: "",
      twitch: "",
      youtube: "",
      discord: ""
    }
  });

  const [loading, setLoading] = useState(true);
  const [champs, setChamps] = useState([]);
  const [search, setSearch] = useState("");
  const [showChampModal, setShowChampModal] = useState(false);

  const user = getUserFromToken();
  const navigate = useNavigate();

  /* ===== Fetch Profile ===== */
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch(`http://localhost:5000/api/profile/${user.id}`);
        const data = await res.json();

        setFormData({
          name: data.name || "",
          age: data.age || "",
          gender: data.gender || "",
          preferred_lane: data.preferred_lane || "",
          preferred_champ_id: data.preferred_champ_id || "",
          game: data.game || "",
          rank: data.rank || "",
          level: data.level ?? "",
          lp: data.lp ?? "",                           // NEW
          league_tag: data.league_tag ?? "",           // NEW
          wildrift_tag: data.wildrift_tag ?? "",       // NEW
          note: data.note ?? "",                       // NEW
          avatar_url: data.avatar_url || "",
          socials: data.socials
            ? typeof data.socials === "string"
              ? JSON.parse(data.socials)
              : data.socials
            : {
                facebook: "",
                instagram: "",
                twitch: "",
                youtube: "",
                discord: ""
              }
        });
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        setLoading(false);
      }
    }

    if (user) fetchProfile();
  }, [user?.id]);

  /* ===== Fetch Champs (public endpoint) ===== */
  useEffect(() => {
    async function fetchChamps() {
      try {
        const res = await fetch("http://localhost:5000/api/champions");
        const data = await res.json();
        setChamps(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load champs", err);
      }
    }
    fetchChamps();
  }, []);

  /* ===== Handlers ===== */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSocialChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      socials: { ...prev.socials, [name]: value }
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
        setFormData((prev) => ({
          ...prev,
          avatar_url: `${data.avatarUrl}?t=${Date.now()}`
        }));
      }
    } catch (err) {
      console.error("Upload failed", err);
    }
  };

  const handleSave = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/profile/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        console.error("Failed to save profile", await res.text());
        return;
      }

      navigate(`/profile/${user.id}`);
    } catch (err) {
      console.error("Failed to save profile", err);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  const filteredChamps = champs.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectedChamp = champs.find(
    (c) => c.name === formData.preferred_champ_id
  );

  const rankOptions = [
    "unranked",
    "iron",
    "bronze",
    "silver",
    "gold",
    "platinum",
    "emerald",
    "diamond",
    "master",
    "grandmaster",
    "challenger"
  ];

  const roleOptions = ["top", "jungle", "mid", "bot", "support"];

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white text-black rounded shadow">
      <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>

      {/* Avatar */}
      <div className="mb-6">
        <label className="block font-semibold mb-2">Avatar</label>
        <div className="flex items-center gap-4">
          <img
            src={
              formData.avatar_url
                ? formData.avatar_url.startsWith("http")
                  ? formData.avatar_url
                  : `http://localhost:5000${formData.avatar_url}?t=${Date.now()}`
                : "/images/default-avatar.png"
            }
            alt="Profile avatar"
            className="w-24 h-24 rounded-full object-cover border"
          />
          <input type="file" accept="image/*" onChange={handleAvatarUpload} />
        </div>
      </div>

      {/* Name */}
      <label className="block mb-4">
        Name
        <input
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full border rounded p-2"
        />
      </label>

      {/* Age */}
      <label className="block mb-4">
        Age
        <input
          type="number"
          name="age"
          value={formData.age}
          onChange={handleChange}
          className="w-full border rounded p-2"
        />
      </label>

      {/* Gender */}
      <label className="block mb-4">
        Gender
        <select
          name="gender"
          value={formData.gender}
          onChange={handleChange}
          className="w-full border rounded p-2"
        >
          <option value="">Select</option>
          <option value="female">Female</option>
          <option value="male">Male</option>
          <option value="other">Other</option>
          <option value="rather not say">Rather not say</option>
        </select>
      </label>

      {/* Game */}
      <div className="mb-6">
        <span className="block mb-2 font-semibold">Game</span>
        <div className="flex gap-4">
          <label>
            <input
              type="checkbox"
              checked={formData.game === "league"}
              onChange={() =>
                setFormData((prev) => ({ ...prev, game: "league" }))
              }
            />{" "}
            League of Legends
          </label>
          <label>
            <input
              type="checkbox"
              checked={formData.game === "wildrift"}
              onChange={() =>
                setFormData((prev) => ({ ...prev, game: "wildrift" }))
              }
            />{" "}
            Wild Rift
          </label>
        </div>
      </div>

      {/* Role */}
      <div className="mb-6">
        <span className="block mb-2 font-semibold">Preferred Role</span>
        <div className="flex gap-3 flex-wrap">
          {roleOptions.map((role) => (
            <label key={role}>
              <input
                type="checkbox"
                checked={formData.preferred_lane === role}
                onChange={() =>
                  setFormData((prev) => ({ ...prev, preferred_lane: role }))
                }
              />{" "}
              {role}
            </label>
          ))}
        </div>
      </div>

      {/* Champ */}
      <label className="block mb-6">
        Preferred Champion
        <div className="flex items-center gap-3">
          <input
            name="preferred_champ_id"
            value={formData.preferred_champ_id}
            readOnly
            className="w-full border rounded p-2 bg-gray-100 cursor-pointer"
            onClick={() => setShowChampModal(true)}
          />
          <button
            type="button"
            onClick={() => setShowChampModal(true)}
            className="px-3 py-2 bg-gray-800 text-white rounded"
          >
            Choose
          </button>
          {selectedChamp && (
            <img
              src={`http://localhost:5000${selectedChamp.file}`}
              alt={selectedChamp.name}
              className="w-12 h-12 rounded border"
            />
          )}
        </div>
      </label>

      {/* Rank */}
      <div className="mb-6">
        <span className="block mb-2 font-semibold">Rank</span>
        <div className="flex gap-3 flex-wrap">
          {rankOptions.map((r) => (
            <label key={r} className="capitalize">
              <input
                type="checkbox"
                checked={formData.rank === r}
                onChange={() => setFormData((prev) => ({ ...prev, rank: r }))}
              />{" "}
              {r}
            </label>
          ))}
        </div>
      </div>

      {/* Level */}
      <label className="block mb-6">
        Level
        <input
          type="number"
          name="level"
          value={formData.level}
          onChange={handleChange}
          className="w-full border rounded p-2"
        />
      </label>

      {/* LP */}
      <label className="block mb-6">
        LP (League Points)
        <input
          type="number"
          name="lp"
          value={formData.lp}
          onChange={handleChange}
          className="w-full border rounded p-2"
          placeholder="League Points"
        />
      </label>

      {/* Tags */}
      <label className="block mb-4">
        League Tag
        <input
          name="league_tag"
          value={formData.league_tag}
          onChange={handleChange}
          className="w-full border rounded p-2"
          placeholder=""
        />
      </label>

      <label className="block mb-6">
        Wild Rift Tag
        <input
          name="wildrift_tag"
          value={formData.wildrift_tag}
          onChange={handleChange}
          className="w-full border rounded p-2"
          placeholder=""
        />
      </label>

      {/* Note */}
      <label className="block mb-6">
        Note
        <textarea
          name="note"
          value={formData.note}
          onChange={handleChange}
          className="w-full border rounded p-2"
          rows={4}
          placeholder="Note"
        />
      </label>

      {/* Social Media Links */}
      <div className="mb-6">
        <h3 className="font-semibold mb-2">Social Media Links</h3>
        {["facebook", "instagram", "twitch", "youtube", "discord"].map((key) => (
          <label key={key} className="block mb-2 capitalize">
            {key}
            <input
              type="url"
              name={key}
              value={formData.socials?.[key] || ""}
              onChange={handleSocialChange}
              className="w-full border rounded p-2"
              placeholder={`Enter your ${key} link`}
            />
          </label>
        ))}
      </div>

      {/* Save */}
      <div className="flex gap-3 mt-4">
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Save Profile
        </button>
      </div>

      {/* Champ Modal */}
      {showChampModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-3xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-bold">Choose Preferred Champion</h2>
              <button onClick={() => setShowChampModal(false)}>❌</button>
            </div>

            <input
              type="text"
              placeholder="Search champion..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border rounded p-2 mb-4"
            />

            <div className="grid grid-cols-4 gap-4">
              {filteredChamps.map((champ) => (
                <div
                  key={champ.name}
                  className="flex flex-col items-center cursor-pointer hover:scale-105 transition"
                  onClick={() => {
                    setFormData((prev) => ({
                      ...prev,
                      preferred_champ_id: champ.name
                    }));
                    setShowChampModal(false);
                  }}
                >
                  <img
                    src={`http://localhost:5000${champ.file}`}
                    alt={champ.name}
                    className="w-20 h-20 object-cover rounded border"
                  />
                  <span className="text-sm mt-1">{champ.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
