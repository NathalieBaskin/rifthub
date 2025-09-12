// src/pages/FavoritesPage.jsx
import { useFavorites } from "../hooks/useFavorites";
import { AiFillHeart } from "react-icons/ai";
import { FiShoppingCart } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useCart } from "../context/useCart.js";

export default function FavoritesPage() {
  const { favorites, toggleFavorite } = useFavorites();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [pop, setPop] = useState({});
  const [sizeModalProduct, setSizeModalProduct] = useState(null);

  if (!favorites || favorites.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10 text-center text-white">
        <h1 className="text-2xl font-bold mb-2">Your Favorites</h1>
        <p>No favorites yet. Go add some from the Bazaar!</p>
        <div className="mt-4">
          <a
            href="/shop"
            className="inline-block px-4 py-2 border border-rift-gold/40 rounded bg-rift-gold text-black hover:bg-black hover:text-rift-gold transition"
          >
            Browse Legends Bazaar
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 text-white">
      <h1 className="text-2xl font-bold text-rift-gold mb-6">Your Favorites</h1>

      {/* Grid med favoritprodukter */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {favorites.map((p) => {
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

              {/* Hjärtat */}
<button
  onClick={(e) => {
    e.stopPropagation(); // hindra navigation
    toggleFavorite(p);
    setPop((prev) => ({ ...prev, [p.id]: true }));
    setTimeout(
      () => setPop((prev) => ({ ...prev, [p.id]: false })),
      240
    );
  }}
  className={`absolute top-2 right-2 w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/40 transition transition-transform ${
    pop[p.id] ? "scale-125" : "active:scale-90"
  }`}
  aria-label="Remove from favorites"
  title="Remove from favorites"
>
  <AiFillHeart className="text-rift-gold text-2xl drop-shadow" />
</button>


                {/* Cart-symbolen */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSizeModalProduct(p);
                  }}
                  className="absolute bottom-2 right-2 p-2 rounded-md hover:bg-black/80 transition"
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

      {/* Size-modal */}
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
