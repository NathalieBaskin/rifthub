// src/pages/SettingsPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserFromToken } from "../utils/auth.js";

export default function SettingsPage() {
  const user = getUserFromToken();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    newUsername: "",
    newEmail: "",
    newPassword: "",
    currentPassword: "",
    confirmDelete: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!form.currentPassword) {
      alert("Enter your current password to save changes.");
      return;
    }

    try {
      // Skicka bara med det som användaren ändrat
      const body = {
        userId: user.id,
        currentPassword: form.currentPassword,
        newUsername: form.newUsername || undefined,
        newEmail: form.newEmail || undefined,
        newPassword: form.newPassword || undefined
      };

      const res = await fetch("http://localhost:5000/api/auth/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");

      if (data.token) localStorage.setItem("token", data.token);

      alert("Account updated successfully!");
      navigate(`/profile/${user.id}`);
    } catch (err) {
      alert(err.message);
    }
  };



  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded shadow text-black">
      <h1 className="text-2xl font-bold mb-6">Account Settings</h1>

      {/* Username */}
      <div className="mb-6">
        <h2 className="font-semibold mb-2">Change Username</h2>
        <input
          type="text"
          name="newUsername"
          value={form.newUsername}
          onChange={handleChange}
          className="w-full border rounded p-2"
          placeholder="New username"
        />
      </div>

      {/* Email */}
      <div className="mb-6">
        <h2 className="font-semibold mb-2">Change Email</h2>
        <input
          type="email"
          name="newEmail"
          value={form.newEmail}
          onChange={handleChange}
          className="w-full border rounded p-2"
          placeholder="New email"
        />
      </div>

      {/* Password */}
      <div className="mb-6">
        <h2 className="font-semibold mb-2">Change Password</h2>
        <input
          type="password"
          name="newPassword"
          value={form.newPassword}
          onChange={handleChange}
          className="w-full border rounded p-2"
          placeholder="New password"
        />
      </div>

      {/* Confirm with current password */}
      <div className="mb-6">
        <h2 className="font-semibold mb-2">Confirm with Current Password</h2>
        <input
          type="password"
          name="currentPassword"
          value={form.currentPassword}
          onChange={handleChange}
          className="w-full border rounded p-2"
          placeholder="Current password"
        />
      </div>

      {/* Save + Delete */}
      <div className="flex justify-between items-center mt-6">
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-rift-gold text-rift-bg rounded"
        >
          Save Changes
        </button>
    <button
  onClick={() => navigate("/account/delete")}
  className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700"
>
  Delete My Account
</button>

      </div>
    </div>
  );
}
