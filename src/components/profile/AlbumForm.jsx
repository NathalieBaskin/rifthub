import { useState } from "react";

export default function AlbumForm({ onClose, onCreate, me }) {
  const [title, setTitle] = useState("");
  const [files, setFiles] = useState([]);
  const [coverIndex, setCoverIndex] = useState(0);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !me) return;

    const formData = new FormData();
    formData.append("userId", me.id);
    formData.append("title", title);
    formData.append("coverIndex", coverIndex);
    files.forEach((f) => formData.append("images", f));

    await onCreate(formData);
    setTitle("");
    setFiles([]);
    setCoverIndex(0);
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white text-black rounded-lg shadow-lg p-6 w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4">Nytt album</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="Albumtitel"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border p-2 rounded"
            required
          />

          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setFiles(Array.from(e.target.files))}
            className="w-full"
          />

          {files.length > 0 && (
            <div className="flex gap-2 flex-wrap mt-2">
              {files.map((f, i) => (
                <div key={i} className="relative">
                  <img
                    src={URL.createObjectURL(f)}
                    alt="preview"
                    className={`w-20 h-20 object-cover rounded ${
                      i === coverIndex ? "ring-4 ring-rift-gold" : ""
                    }`}
                    onClick={() => setCoverIndex(i)}
                  />
                  {i === coverIndex && (
                    <span className="absolute bottom-1 left-1 bg-black text-white text-xs px-1 rounded">
                      Cover
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              className="px-4 py-1 bg-gray-300 rounded"
              onClick={onClose}
            >
              Avbryt
            </button>
            <button
              type="submit"
              className="px-4 py-1 bg-rift-card text-rift-gold rounded"
            >
              Skapa
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
