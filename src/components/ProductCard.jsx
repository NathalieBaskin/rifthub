// src/components/ProductCard.jsx
import { useNavigate } from "react-router-dom";
import { useFavorites } from "../hooks/useFavorites";
import { useState } from "react";
import { HiOutlineHeart, HiHeart } from "react-icons/hi2";

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const { favorites, toggleFavorite } = useFavorites();
  const isFavorite = favorites?.some((p) => Number(p.id) === Number(product.id));
  const [pop, setPop] = useState(false);

  async function onHeart(e) {
    e.stopPropagation();
    const added = await toggleFavorite(product); // sköter LS + ev. backend
    if (added) {
      setPop(true);
      setTimeout(() => setPop(false), 220);
    }
  }

  const go = () => navigate(`/shop/product/${product.id}`);

  return (
    <div
      className="relative bg-white rounded-2xl shadow hover:shadow-lg transition p-2"
      onClick={go}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && go()}
    >
      <div className="relative">
        <img src={product.image_url} alt={product.name} className="rounded-xl w-full h-56 object-cover" />
        {product.isNew && (
          <span className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
            NEW
          </span>
        )}
        <button
          onClick={onHeart}
          className={`absolute bottom-2 right-2 bg-white rounded-full p-2 shadow transition-transform ${pop ? "scale-125" : "active:scale-90"}`}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          title={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          {isFavorite ? (
            <HiHeart className="h-6 w-6 text-rift-gold" />
          ) : (
            <HiOutlineHeart className="h-6 w-6 text-rift-gold opacity-70" />
          )}
        </button>
      </div>

      <div className="mt-3 text-center">
        <p className="font-semibold text-black">{product.name}</p>
        <p className="text-black">{product.price} kr</p>
      </div>
    </div>
  );
}
