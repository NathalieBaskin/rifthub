import { useEffect, useState } from "react";

const API_URL = "http://localhost:5000";

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    categories: "",
    sku: "",
  });
  const [image, setImage] = useState(null);

  async function fetchProducts() {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("❌ No token found, cannot fetch products");
      setProducts([]);
      return;
    }

    const res = await fetch(`${API_URL}/api/admin/products`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } else {
      console.error("❌ Failed to load products", await res.text());
      setProducts([]); // undvik krasch
    }
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("❌ No token found!");
      return;
    }

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (image) {
      fd.append("image", image);
    }

    try {
      const res = await fetch(`${API_URL}/api/admin/products`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        fetchProducts();
        setForm({ name: "", description: "", price: "", categories: "", sku: "" });
        setImage(null);
      } else {
        alert(data.error || "Failed to add product");
      }
    } catch (err) {
      console.error("❌ Fetch error:", err);
    }
  }

  async function handleDelete(id) {
    const token = localStorage.getItem("token");
    if (!token) return;

    await fetch(`${API_URL}/api/admin/products/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchProducts();
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">All Products</h2>
      <ul className="space-y-2 mb-6">
        {Array.isArray(products) && products.length > 0 ? (
          products.map((p) => (
            <li
              key={p.id}
              className="flex justify-between items-center border border-rift-gold/30 p-2 rounded"
            >
              <span>
                {p.name} – {p.price} SEK
              </span>
              <button
                onClick={() => handleDelete(p.id)}
                className="text-red-500 hover:underline"
              >
                🗑 Delete
              </button>
            </li>
          ))
        ) : (
          <li className="text-rift-gold/70">No products found.</li>
        )}
      </ul>

      <h2 className="text-xl font-bold mb-4">Add New Product</h2>
      <form onSubmit={handleAdd} className="space-y-3">
        <input
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="border p-2 w-full"
          required
        />
        <textarea
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="border p-2 w-full"
        />
        <input
          placeholder="Price"
          type="number"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          className="border p-2 w-full"
          required
        />
        <input
          placeholder="Categories (comma separated)"
          value={form.categories}
          onChange={(e) => setForm({ ...form, categories: e.target.value })}
          className="border p-2 w-full"
        />
        <input
          placeholder="SKU (ABC123)"
          value={form.sku}
          onChange={(e) => setForm({ ...form, sku: e.target.value })}
          className="border p-2 w-full"
          required
        />
        <input type="file" onChange={(e) => setImage(e.target.files[0])} />
        <button
          type="submit"
          className="px-4 py-2 bg-rift-card text-rift-gold border border-rift-gold/40 rounded hover:bg-rift-card/80"
        >
          ➕ Add Product
        </button>
      </form>
    </div>
  );
}
