// src/pages/LegendsBazaar.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";
import { FiShoppingCart } from "react-icons/fi";

import { useCart } from "../context/useCart.js";
import { useFavorites } from "../hooks/useFavorites.js";

const API_URL = "http://localhost:5000";

export default function LegendsBazaar() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { favorites, toggleFavorite } = useFavorites();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [pop, setPop] = useState({});
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [sizeModalProduct, setSizeModalProduct] = useState(null);

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

  const isFav = (id) =>
    Array.isArray(favorites) &&
    favorites.some((p) => Number(p.id) === Number(id));

  const onToggleFavorite = async (e, product) => {
    e.stopPropagation();
    const added = await toggleFavorite(product);
    if (added) {
      setPop((prev) => ({ ...prev, [product.id]: true }));
      setTimeout(
        () => setPop((prev) => ({ ...prev, [product.id]: false })),
        240
      );
    }
  };

  // 🔹 Filtrera produkter på kategori + news
  const filteredProducts =
    selectedCategory === "all"
      ? products
      : selectedCategory === "news"
      ? products.filter((p) => p.isNew)
      : products.filter((p) => p.categories === selectedCategory);

  // 🔹 Hämta kategorier från produkterna + lägg till "news"
  const categories = ["all", "news", ...new Set(products.map((p) => p.categories))];

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
            .filter((cat) => cat)
            .map((cat) => (
              <option key={cat} value={cat}>
                {cat === "all"
                  ? "All categories"
                  : cat === "news"
                  ? "News"
                  : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
        </select>
      </div>

      {/* 🔹 Grid med produkter */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredProducts.map((p) => {
          const favorite = isFav(p.id);
          const go = () => navigate(`/shop/product/${p.id}`);

          return (
            <div
              key={p.id}
              className="relative flex flex-col bg-black/20 rounded-lg overflow-hidden hover:shadow-lg transition"
            >
              {/* Bild */}
              <div
                className="relative w-full h-64 md:h-72 flex items-center justify-center cursor-pointer"
                onClick={go}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && go()}
              >
                <img
                  src={p.image_url}
                  alt={p.name}
                  className="max-h-full max-w-full object-contain"
                />
                {p.isNew && (
                  <span className="absolute top-2 left-2 bg-black text-rift-gold text-xs font-bold px-2 py-0.5 rounded">
                    NEW
                  </span>
                )}

                {/* Hjärtat */}
                <button
                  onClick={(e) => onToggleFavorite(e, p)}
                  className={`absolute top-2 right-2 transition-transform ${
                    pop[p.id] ? "scale-125" : "active:scale-90"
                  }`}
                  aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
                  title={favorite ? "Remove from favorites" : "Add to favorites"}
                >
                  {favorite ? (
                    <AiFillHeart className="text-rift-gold text-2xl drop-shadow" />
                  ) : (
                    <AiOutlineHeart className="text-white text-2xl" />
                  )}
                </button>

                {/* Cart-symbolen */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSizeModalProduct(p);
                  }}
                  className="absolute bottom-2 right-2  p-2 rounded-md hover:bg-black/80 transition"
                  title="Add to Cart"
                >
                  <FiShoppingCart className="text-white text-lg" />
                </button>
              </div>

              {/* Namn + pris */}
              <div className="p-3 text-center">
                <h2
                  className="text-sm md:text-base font-semibold cursor-pointer truncate"
                  onClick={go}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && go()}
                >
                  {p.name}
                </h2>
                <p className="mt-1 text-rift-gold font-semibold">{p.price} SEK</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 🔹 Size-modal */}
      {sizeModalProduct && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white text-black p-6 rounded-lg shadow-lg w-80 relative">
           <button
  onClick={() => setSizeModalProduct(null)}
  className="absolute top-2 right-2 w-10 h-10 flex items-center justify-center 
             rounded-full hover:bg-rift-gold/30 text-black font-bold text-xl"
  title="Close"
>
  ✕
</button>


            <h3 className="text-lg font-bold mb-2">{sizeModalProduct.name}</h3>
            <p className="mb-4 text-rift-gold">{sizeModalProduct.price} SEK</p>

            <p className="font-semibold mb-2">Välj storlek</p>
            <div className="flex gap-2 flex-wrap mb-4">
              {["XS", "S", "M", "L", "XL"].map((size) => (
                <button
                  key={size}
                  onClick={() => {
                    addToCart({ ...sizeModalProduct, size });
                    setSizeModalProduct(null);
                  }}
                  className="px-3 py-1 border rounded hover:bg-gray-200"
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
