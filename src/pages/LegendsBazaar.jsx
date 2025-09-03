import { useEffect, useState } from "react";
import { useCart } from "../context/useCart.js";
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";
import { useNavigate } from "react-router-dom";

export default function LegendsBazaar() {
  const [products, setProducts] = useState([]);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [favorites, setFavorites] = useState(
    () => JSON.parse(localStorage.getItem("favorites") || "[]")
  );

  const [selectedSizes, setSelectedSizes] = useState({});

  const toggleFavorite = (id) => {
    let updated;
    if (favorites.includes(id)) {
      updated = favorites.filter((fid) => fid !== id);
    } else {
      updated = [...favorites, id];
    }
    setFavorites(updated);
    localStorage.setItem("favorites", JSON.stringify(updated));
  };

  useEffect(() => {
    fetch("http://localhost:5000/api/products")
      .then((res) => res.json())
      .then((data) => setProducts(data));
  }, []);

  const handleSizeChange = (productId, size) => {
    setSelectedSizes((prev) => ({ ...prev, [productId]: size }));
  };

  return (
    <div className="max-w-6xl mx-auto p-6 text-black">
      <h1 className="text-3xl font-display text-rift-gold mb-6">
        Legends Bazaar
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {products.map((p) => {
          const isFavorite = favorites.includes(p.id);
          const selectedSize = selectedSizes[p.id] || "";

          return (
            <div
              key={p.id}
              className="card-fantasy p-4 flex flex-col items-center text-center relative"
            >
              <div
                className="relative w-32 h-32 mb-4 cursor-pointer"
                onClick={() => navigate(`/shop/product/${p.id}`)}
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
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(p.id);
                  }}
                  className="absolute bottom-1 right-1 bg-white rounded-full p-1 shadow"
                >
                  {isFavorite ? (
                    <AiFillHeart className="text-red-500 text-lg" />
                  ) : (
                    <AiOutlineHeart className="text-black text-lg" />
                  )}
                </button>
              </div>

              <h2
                className="text-lg font-bold cursor-pointer"
                onClick={() => navigate(`/shop/product/${p.id}`)}
              >
                {p.name}
              </h2>

              <p className="mt-2 text-rift-gold font-semibold">{p.price} SEK</p>

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
                🛒 Add to Cart
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
