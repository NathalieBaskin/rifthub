// src/pages/FavoritesPage.jsx
import { useFavorites } from "../hooks/useFavorites";
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";
import { useNavigate } from "react-router-dom";

export default function FavoritesPage() {
  const { favorites, toggleFavorite } = useFavorites();
  const navigate = useNavigate();

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
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-white mb-6">Your Favorites</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {favorites.map((p) => (
          <div
            key={p.id}
            className="card-fantasy p-4 flex flex-col items-center text-center relative"
          >
            {/* Bild */}
            <div
              className="relative w-32 h-32 mb-4 cursor-pointer"
              onClick={() => navigate(`/shop/product/${p.id}`)}
            >
              <img
                src={p.image_url}
                alt={p.name}
                className="w-full h-full object-contain rounded-md"
              />

              {/* Hjärtikon */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(p); // tar bort om den redan finns
                }}
                className="absolute bottom-1 right-1"
              >
                <AiFillHeart className="text-rift-gold text-lg drop-shadow" />
              </button>
            </div>

            {/* Namn + pris */}
            <h2
              className="text-lg font-bold cursor-pointer"
              onClick={() => navigate(`/shop/product/${p.id}`)}
            >
              {p.name}
            </h2>
            <p className="mt-2 text-rift-gold font-semibold">{p.price} SEK</p>
          </div>
        ))}
      </div>
    </div>
  );
}
