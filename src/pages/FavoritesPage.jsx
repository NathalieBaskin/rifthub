// src/pages/FavoritesPage.jsx
import { useFavorites } from "../hooks/useFavorites";
import ProductCard from "../components/ProductCard";

export default function FavoritesPage() {
  const { favorites } = useFavorites();

  if (!favorites || favorites.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10 text-center text-rift-gold">
        <h1 className="text-2xl font-bold mb-2">Your Favorites</h1>
        <p>No favorites yet. Go add some from the Bazaar!</p>
        <div className="mt-4">
          <a
            href="/shop"
            className="inline-block px-4 py-2 border border-rift-gold/40 rounded bg-rift-card text-rift-gold hover:bg-rift-card/80"
          >
            Browse Legends Bazaar
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-rift-gold mb-6">Your Favorites</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {favorites.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
