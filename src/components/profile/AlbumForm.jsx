import { useState, useRef } from "react";

export default function AlbumForm({ onClose, onCreate, me }) {
  const [title, setTitle] = useState("");
  const [coverFile, setCoverFile] = useState(null); // cover image
  const [files, setFiles] = useState([]); // album images
  const fileInputRef = useRef(null); // hidden file input for "Add more"

  // remove cover image
  function removeCover() {
    setCoverFile(null);
  }

  // remove single album image
  function removeFile(index) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  // add more album images (append instead of overwrite)
  function addMoreFiles(newFiles) {
    setFiles((prev) => [...prev, ...newFiles]);
  }

  // trigger hidden file input
  function triggerAddMore() {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !me || !coverFile) return;

    const formData = new FormData();
    formData.append("userId", me.id);
    formData.append("title", title);

    // add createdAt so frontend/backend can show proper date
    formData.append("createdAt", new Date().toISOString());

    // Cover goes in as the first image
    formData.append("images", coverFile);

    // Rest of album images
    files.forEach((f) => formData.append("images", f));

    // coverIndex = 0 (since coverFile is first)
    formData.append("coverIndex", 0);

    await onCreate(formData);

    // reset
    setTitle("");
    setCoverFile(null);
    setFiles([]);
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
        <h2 className="text-xl font-bold mb-4">Create new album</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Title */}
          <input
            type="text"
            placeholder="Album title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border p-2 rounded"
            required
          />

          {/* Cover image */}
          <div>
            <label className="block text-sm font-semibold mb-1">
              Cover image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setCoverFile(e.target.files[0] || null)}
              className="w-full"
              required
            />
            {coverFile && (
              <div className="mt-2 relative inline-block">
                <img
                  src={URL.createObjectURL(coverFile)}
                  alt="Cover preview"
                  className="w-32 h-32 object-cover rounded ring-4 ring-rift-gold"
                />
                <button
                  type="button"
                  onClick={removeCover}
                  className="absolute top-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded hover:bg-red-600"
                >
                  ❌
                </button>
              </div>
            )}
          </div>

          {/* Album images */}
          <div>
            <label className="block text-sm font-semibold mb-1">
              Album images
            </label>

            {/* Hidden input used by Add more */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) {
                  addMoreFiles(Array.from(e.target.files));
                  e.target.value = ""; // reset so you can pick same file again if needed
                }
              }}
            />

            <button
              type="button"
              onClick={triggerAddMore}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
            >
              Add more
            </button>

            {files.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-2">
                {files.map((f, i) => (
                  <div key={i} className="relative">
                    <img
                      src={URL.createObjectURL(f)}
                      alt={`preview-${i}`}
                      className="w-20 h-20 object-cover rounded"
                    />
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="absolute top-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded hover:bg-red-600"
                    >
                      ❌
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              className="px-4 py-1 bg-gray-300 rounded"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1 bg-rift-card text-rift-gold rounded"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
