// src/pages/AccountDelete.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserFromToken } from "../utils/auth.js";

export default function AccountDelete() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const user = getUserFromToken();

  const handleDelete = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/auth/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,              // ✅ backend vill ha userId
          currentPassword: password     // ✅ backend vill ha currentPassword
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Delete failed");
        setLoading(false);
        return;
      }

      // ✅ Konto raderat → logga ut användaren
      localStorage.removeItem("token");
      setSuccess("Your account has been deleted.");
      setTimeout(() => {
        navigate("/");
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error(err);
      setError("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-rift-bg text-white">
      <div className="w-full max-w-md bg-rift-card p-6 rounded-xl shadow-lg space-y-6">
        <h2 className="text-2xl font-display text-rift-gold text-center mb-4">
          Delete Account
        </h2>

        {error && (
          <p className="bg-red-500/20 text-red-400 p-2 rounded text-center">
            {error}
          </p>
        )}
        {success && (
          <p className="bg-green-500/20 text-green-400 p-2 rounded text-center">
            {success}
          </p>
        )}

        <p className="text-sm text-center text-gray-300 mb-4">
          ⚠️ This action is permanent. You must confirm by entering your{" "}
          <span className="text-rift-gold">password</span>.
        </p>

        <form onSubmit={handleDelete} className="space-y-3">
          <div>
            <label className="block text-sm mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-black/30 border border-rift-gold/40 focus:outline-none focus:ring-2 focus:ring-rift-gold"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 transition disabled:opacity-50"
          >
            {loading ? "Deleting..." : "Delete Account"}
          </button>
        </form>

        <button
          onClick={() => navigate(-1)}
          className="w-full mt-3 py-2 bg-gray-600 text-white font-semibold rounded-md hover:bg-gray-700 transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
