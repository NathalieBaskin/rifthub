// src/pages/LegendsBazaar.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";

import { useCart } from "../context/useCart.js";
import { useFavorites } from "../hooks/useFavorites.js";

const API_URL = "http://localhost:5000";

export default function LegendsBazaar() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { favorites, toggleFavorite } = useFavorites();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // per-produkt valt storleksval
  const [selectedSizes, setSelectedSizes] = useState({});
  // per-produkt liten pop-animation när man lägger till favorit
  const [pop, setPop] = useState({}); // { [productId]: true/false }

  // kategori-filter
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_URL}/api/products`);
        if (!res.ok) throw new Error("Failed to fetch products");
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSizeChange = (productId, size) => {
    setSelectedSizes((prev) => ({ ...prev, [productId]: size }));
  };

  // Hjälp: är en produkt favorit?
  const isFav = (id) =>
    Array.isArray(favorites) &&
    favorites.some((p) => Number(p.id) === Number(id));

  // Toggle favorit med liten pop-animation när man lägger till
  const onToggleFavorite = async (e, product) => {
    e.stopPropagation();
    const added = await toggleFavorite(product); // sköter LS + ev. backend
    if (added) {
      setPop((prev) => ({ ...prev, [product.id]: true }));
      setTimeout(
        () => setPop((prev) => ({ ...prev, [product.id]: false })),
        240
      );
    }
  };

  // 🔹 Filtrera produkter på kategori
  const filteredProducts =
    selectedCategory === "all"
      ? products
    : products.filter((p) => p.categories === selectedCategory);


  // 🔹 Hämta alla kategorier från produkterna
  const categories = ["all", ...new Set(products.map((p) => p.categories))];


  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6 text-center text-rift-gold">
        <h1 className="text-3xl font-display mb-4">Legends Bazaar</h1>
        <p className="text-lg">Loading products…</p>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="max-w-6xl mx-auto p-6 text-center text-rift-gold">
        <h1 className="text-3xl font-display mb-4">Legends Bazaar</h1>
        <p className="text-lg">
          No products available right now. Check back later!
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 text-white">
      <h1 className="text-3xl font-display text-rift-gold mb-6">
        Legends Bazaar
      </h1>

      {/* 🔹 Kategori-dropdown */}
      <div className="mb-6">
        <select
          className="px-3 py-2 rounded border text-sm bg-white/90 text-black"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
    {categories
  .filter((cat) => cat) // tar bort undefined/null
  .map((cat) => (
    <option key={cat} value={cat}>
      {cat === "all"
        ? "All categories"
        : cat.charAt(0).toUpperCase() + cat.slice(1)}
    </option>
  ))}

        </select>
      </div>

      {/* 🔹 Grid med produkter */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredProducts.map((p) => {
          const selectedSize = selectedSizes[p.id] || "";
          const favorite = isFav(p.id);
          const go = () => navigate(`/shop/product/${p.id}`);

          return (
            <div
              key={p.id}
              className="card-fantasy p-4 flex flex-col items-center text-center relative"
            >
              {/* Bild + NEW + hjärta */}
              <div
                className="relative w-32 h-32 mb-4 cursor-pointer"
                onClick={go}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && go()}
              >
                <img
                  src={p.image_url}
                  alt={p.name}
                  className="w-full h-full object-contain rounded-md"
                />
                {p.isNew && (
                  <span className="absolute top-1 left-1 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded">
                    NEW
                  </span>
                )}

                <button
                  onClick={(e) => onToggleFavorite(e, p)}
                  className={`absolute bottom-1 right-1 transition-transform ${
                    pop[p.id] ? "scale-125" : "active:scale-90"
                  }`}
                  aria-label={
                    favorite ? "Remove from favorites" : "Add to favorites"
                  }
                  title={favorite ? "Remove from favorites" : "Add to favorites"}
                >
                  {favorite ? (
                    <AiFillHeart className="text-rift-gold text-lg drop-shadow" />
                  ) : (
                    <AiOutlineHeart className="text-white text-lg" />
                  )}
                </button>
              </div>

              {/* Namn + pris (klickbara) */}
              <h2
                className="text-lg font-bold cursor-pointer"
                onClick={go}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && go()}
              >
                {p.name}
              </h2>
              <p className="mt-2 text-rift-gold font-semibold">{p.price} SEK</p>

              {/* Storlek */}
              <select
                value={selectedSize}
                onChange={(e) => handleSizeChange(p.id, e.target.value)}
                className="mt-2 border rounded p-1 text-sm text-black"
              >
                <option value="">Select size</option>
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
              </select>

              {/* Lägg i kundvagn */}
              <button
                onClick={() => {
                  if (!selectedSize) {
                    alert("Please select a size before adding to cart");
                    return;
                  }
                  addToCart({ ...p, size: selectedSize });
                }}
                className="mt-4 px-4 py-2 bg-rift-card border border-rift-gold/40 rounded-md hover:bg-rift-card/80 transition"
              >
                Add to Cart
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
