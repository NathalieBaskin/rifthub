import { useState } from "react";
import AdminProducts from "./AdminProducts.jsx";
import AdminChampions from "./AdminChampions.jsx";

// Sen kan vi importera fler: AdminProfile, AdminChampions osv

export default function AdminDashboard() {
  const [tab, setTab] = useState("products"); // default tab

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-display text-rift-gold mb-6">Admin Dashboard</h1>

      {/* Tab-menyn */}
      <nav className="flex gap-4 mb-6 border-b border-rift-gold/30">
        <button
          onClick={() => setTab("profile")}
          className={`px-4 py-2 ${tab === "profile" ? "border-b-2 border-rift-gold text-rift-gold" : ""}`}
        >
          My Profile
        </button>
        <button
          onClick={() => setTab("products")}
          className={`px-4 py-2 ${tab === "products" ? "border-b-2 border-rift-gold text-rift-gold" : ""}`}
        >
          Legends Bazaar
        </button>
        <button
          onClick={() => setTab("champions")}
          className={`px-4 py-2 ${tab === "champions" ? "border-b-2 border-rift-gold text-rift-gold" : ""}`}
        >
          Champions
        </button>
        {/* fler tabs senare */}
      </nav>

      {/* Panelen */}
      <div>
        {tab === "profile" && <div>Här kommer admin kunna ändra sin egen profil (sen).</div>}
        {tab === "products" && <AdminProducts />}
        {tab === "champions" && <AdminChampions />}

      </div>
    </div>
  );
}
