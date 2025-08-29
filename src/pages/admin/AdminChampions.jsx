import { useEffect, useState } from "react";

const API_URL = "http://localhost:5000";

export default function AdminChampions() {
  const [champs, setChamps] = useState([]);
  const [file, setFile] = useState(null);

  async function loadChamps() {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/api/admin/champions`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setChamps(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    loadChamps();
  }, []);

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) return;

    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("champ", file);

    const res = await fetch(`${API_URL}/api/admin/champions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (res.ok) {
      await loadChamps();
      setFile(null);
    } else {
      console.error("❌ Upload failed", await res.text());
    }
  }

  return (
    <div>
      <h2 className="text-xl font-display text-rift-gold mb-4">Champions</h2>

      <form onSubmit={handleUpload} className="mb-6 flex gap-2 items-center">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files[0])}
          className="border p-2"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-rift-card text-rift-gold rounded"
        >
          Upload Champion
        </button>
      </form>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
        {champs.map((c) => (
          <div key={c.file} className="flex flex-col items-center">
            <img
              src={`${API_URL}${c.file}`}
              alt={c.name}
              className="w-16 h-16 object-cover rounded-md"
            />
            <span className="text-xs mt-1">{c.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
