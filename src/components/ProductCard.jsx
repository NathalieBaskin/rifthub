import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";
import { useNavigate } from "react-router-dom";

export default function ProductCard({ product, favorites, toggleFavorite }) {
  const navigate = useNavigate();
  const isFavorite = favorites.includes(product.id);

  return (
    <div className="relative bg-white rounded-2xl shadow hover:shadow-lg transition p-2">
      {/* Produktbild */}
      <div className="relative">
        <img
          src={product.image_url}
          alt={product.name}
          className="rounded-xl cursor-pointer w-full h-56 object-cover"
          onClick={() => navigate(`/bazaar/product/${product.id}`)}
        />

        {/* New badge */}
        {product.isNew && (
          <span className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
            NEW
          </span>
        )}

        {/* Favorit-ikon */}
        <button
          onClick={(e) => {
            e.stopPropagation(); // förhindra klick på kortet
            toggleFavorite(product.id);
          }}
          className="absolute bottom-2 right-2 bg-white rounded-full p-2 shadow"
        >
          {isFavorite ? (
            <AiFillHeart className="text-red-500 text-xl" />
          ) : (
            <AiOutlineHeart className="text-black text-xl" />
          )}
        </button>
      </div>

      {/* Info */}
      <div className="mt-3 text-center">
        <p className="font-semibold">{product.name}</p>
        <p className="text-black">{product.price} kr</p>
      </div>
    </div>
  );
}
