// src/pages/AdminProducts.jsx
import { useEffect, useState } from "react";

const API_URL = "http://localhost:5000";

const ALL_CATEGORIES = [
  "Hoodie",
  "Tshirt",
  "Accessories",
  "Jackets",
  "Figures",
  "Games",
  "Jersey",
  "Sweater",
];

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    id: null,
    name: "",
    description: "",
    price: "",
    categories: [],
    sku: "",
    created_at: new Date().toISOString().split("T")[0], // yyyy-MM-dd
    image_url: null,
  });
  const [image, setImage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  async function fetchProducts() {
    const token = localStorage.getItem("token");
    if (!token) return;

    const res = await fetch(`${API_URL}/api/admin/products`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) return;
    const data = await res.json();
    setProducts(data.products || []);
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  function handleCategoryChange(cat) {
    setForm((prev) => {
      const exists = prev.categories.includes(cat);
      return {
        ...prev,
        categories: exists
          ? prev.categories.filter((c) => c !== cat)
          : [...prev.categories, cat],
      };
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return;

    if (!form.name.trim() || !form.price || !form.sku.trim()) {
      alert("Name, price and SKU are required");
      return;
    }
    const skuRegex = /^[A-Z]{3}\d{3}$/;
    if (!skuRegex.test(form.sku)) {
      alert("SKU must be in format ABC123");
      return;
    }

    const fd = new FormData();
    fd.append("name", form.name);
    fd.append("description", form.description);
    fd.append("price", String(form.price));
    fd.append("categories", form.categories.join(","));
    fd.append("sku", form.sku);

    const isoDate = new Date(form.created_at).toISOString();
    fd.append("created_at", isoDate);

    if (image) fd.append("image", image);

    const method = isEditing ? "PUT" : "POST";
    const url = isEditing
      ? `${API_URL}/api/admin/products/${form.id}`
      : `${API_URL}/api/admin/products`;

    const res = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });

    let data;
    try {
      data = await res.json();
    } catch {
      alert("Server returned non-JSON. Check backend route/URL.");
      return;
    }

    if (res.ok && data.success) {
      fetchProducts();
      resetForm();
    } else {
      alert(data.error || "Failed to save product");
    }
  }

  function resetForm() {
    setForm({
      id: null,
      name: "",
      description: "",
      price: "",
      categories: [],
      sku: "",
      created_at: new Date().toISOString().split("T")[0],
      image_url: null,
    });
    setImage(null);
    setIsEditing(false);
  }

  function startEdit(p) {
    setForm({
      id: p.id,
      name: p.name || "",
      description: p.description || "",
      price: p.price || "",
      categories: p.categories ? p.categories.split(",").map((c) => c.trim()) : [],
      sku: p.sku || "",
      created_at: p.created_at
        ? new Date(p.created_at).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      image_url: p.image_url || null,
    });
    setImage(null);
    setIsEditing(true);
  }

  async function handleDelete(id) {
    const token = localStorage.getItem("token");
    if (!token) return;

    if (!confirm("Are you sure you want to delete this product?")) return;

    const res = await fetch(`${API_URL}/api/admin/products/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) fetchProducts();
  }

  return (
    <div className="p-6 text-white">
      <h2 className="text-xl font-bold mb-4">All Products</h2>
      <ul className="space-y-3 mb-6">
        {products.length > 0 ? (
          products.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between border border-rift-gold/30 p-2 rounded"
            >
              <div className="flex items-center gap-4">
                {p.image_url && (
                  <img
                    src={p.image_url}
                    alt={p.name}
                    className="w-16 h-16 object-contain rounded"
                  />
                )}
                <div>
                  <span className="font-semibold text-white">{p.name}</span>{" "}
                  – <span className="text-rift-gold">{p.price} SEK</span>
                  <div className="text-sm text-white">
                    SKU: {p.sku} | Categories: {p.categories}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => startEdit(p)}
                  className="px-3 py-1 bg-white text-black rounded hover:bg-black hover:text-white transition"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  🗑 Delete
                </button>
              </div>
            </li>
          ))
        ) : (
          <li className="text-rift-gold/70">No products found.</li>
        )}
      </ul>

      <h2 className="text-xl font-bold mb-4 text-white">
        {isEditing ? "Edit Product" : "Add New Product"}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="border p-2 w-full text-black"
          required
        />
        <textarea
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="border p-2 w-full text-black"
        />
        <input
          placeholder="Price"
          type="number"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          className="border p-2 w-full text-black"
          required
        />

        {/* Categories */}
        <div>
          <p className="font-semibold mb-2 text-white">Categories:</p>
          <div className="grid grid-cols-2 gap-2 text-white">
            {ALL_CATEGORIES.map((cat) => (
              <label key={cat} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.categories.includes(cat)}
                  onChange={() => handleCategoryChange(cat)}
                />
                {cat}
              </label>
            ))}
          </div>
        </div>

        <input
          placeholder="SKU (ABC123)"
          value={form.sku}
          onChange={(e) =>
            setForm({ ...form, sku: e.target.value.toUpperCase() })
          }
          className="border p-2 w-full text-black"
          required
        />

        {/* Release date */}
        <div>
          <label className="font-semibold block mb-1 text-white">Release Date:</label>
          <input
            type="date"
            value={form.created_at}
            onChange={(e) => setForm({ ...form, created_at: e.target.value })}
            className="border p-2 text-black"
          />
        </div>

        {/* Image */}
        <div>
          <label className="font-semibold block mb-1 text-white">Image:</label>
          {image ? (
            <img
              src={URL.createObjectURL(image)}
              alt="Preview"
              className="w-32 h-32 object-contain mb-2"
            />
          ) : (
            form.image_url && (
              <img
                src={form.image_url}
                alt="Current"
                className="w-32 h-32 object-contain mb-2"
              />
            )
          )}
          <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} />
        </div>

        <button
          type="submit"
          className="px-4 py-2 bg-rift-card text-rift-gold border border-rift-gold/40 rounded hover:bg-rift-card/80"
        >
          {isEditing ? "💾 Save Changes" : "➕ Add Product"}
        </button>
        {isEditing && (
          <button
            type="button"
            onClick={resetForm}
            className="ml-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Cancel
          </button>
        )}
      </form>
    </div>
  );
}
