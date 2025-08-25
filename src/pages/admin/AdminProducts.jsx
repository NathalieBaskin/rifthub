import { useEffect, useState } from "react";

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    categories: "",
    sku: ""
  });
  const [image, setImage] = useState(null);

  async function fetchProducts() {
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:5000/api/admin/products", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setProducts(data);
  }

  useEffect(() => {
    fetchProducts();
  }, []);

async function handleAdd(e) {
  e.preventDefault();
  console.log("🚀 handleAdd triggered!");

  const token = localStorage.getItem("token");
  if (!token) {
    console.error("❌ No token found!");
    return;
  }

  const fd = new FormData();
  Object.entries(form).forEach(([k, v]) => {
    console.log(`append ${k}:`, v);
    fd.append(k, v);
  });
  if (image) {
    console.log("append image:", image.name);
    fd.append("image", image);
  }

  try {
    const res = await fetch("http://localhost:5000/api/admin/products", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd
    });

    console.log("Response status:", res.status);
    const data = await res.json();
    console.log("Response data:", data);

    if (data.success) {
      fetchProducts();
      setForm({ name: "", description: "", price: "", categories: "", sku: "" });
      setImage(null);
    } else {
      alert(data.error);
    }
  } catch (err) {
    console.error("❌ Fetch error:", err);
  }
}


  async function handleDelete(id) {
    const token = localStorage.getItem("token");
    await fetch(`http://localhost:5000/api/admin/products/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchProducts();
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">All Products</h2>
      <ul className="space-y-2 mb-6">
        {products.map((p) => (
          <li key={p.id} className="flex justify-between items-center border border-rift-gold/30 p-2 rounded">
            <span>{p.name} – {p.price} Gold</span>
            <button
              onClick={() => handleDelete(p.id)}
              className="text-red-500 hover:underline"
            >
              🗑 Delete
            </button>
          </li>
        ))}
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
