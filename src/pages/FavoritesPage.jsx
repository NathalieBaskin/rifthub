// src/pages/FavoritesPage.jsx
import { Link } from "react-router-dom";
import { useFavorites } from "../hooks/useFavorites";

export default function FavoritesPage() {
  const { favorites } = useFavorites();

  if (!favorites || favorites.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10 text-center text-rift-gold">
        <h1 className="text-2xl font-bold mb-2">Your Favorites</h1>
        <p>No favorites yet. Go add some from the Bazaar!</p>
        <div className="mt-4">
          <Link
            to="/shop"
            className="inline-block px-4 py-2 border border-rift-gold/40 rounded bg-rift-card text-rift-gold hover:bg-rift-card/80"
          >
            Browse Legends Bazaar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-rift-gold mb-6">Your Favorites</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {favorites.map((p) => (
          <Link
            key={p.id}
            to={`/shop/product/${p.id}`}
            className="border border-rift-gold/30 rounded-xl p-3 hover:bg-rift-card/40 transition"
          >
            {p.image_url && (
              <img
                src={p.image_url}
                alt={p.name}
                className="w-full h-40 object-cover rounded-lg"
              />
            )}
            <div className="mt-2 text-center">
              <div className="font-semibold text-white">{p.name}</div>
              <div className="text-sm text-rift-gold">{p.price} kr</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
