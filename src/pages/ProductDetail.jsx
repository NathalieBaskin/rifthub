import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCart } from "../context/useCart.js";
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [favorites, setFavorites] = useState(
    () => JSON.parse(localStorage.getItem("favorites") || "[]")
  );
  const [selectedSize, setSelectedSize] = useState("");

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
    async function fetchProduct() {
      const res = await fetch(`http://localhost:5000/api/products/${id}`);
      const data = await res.json();
      setProduct(data);
    }
    async function fetchSimilar() {
      const res = await fetch(`http://localhost:5000/api/products/${id}/similar`);
      const data = await res.json();
      setSimilar(data);
    }

    fetchProduct();
    fetchSimilar();
  }, [id]);

  if (!product) return <p className="p-6">Loading...</p>;

  const isFavorite = favorites.includes(product.id);

  return (
    <div className="max-w-5xl mx-auto p-6 text-black">
      <div className="flex flex-col md:flex-row gap-8 mb-10">
        <div className="relative w-full md:w-1/2 flex justify-center">
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-auto max-h-[500px] object-contain rounded-xl shadow"
          />
          {product.isNew && (
            <span className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
              NEW
            </span>
          )}
          <button
            onClick={() => toggleFavorite(product.id)}
            className="absolute bottom-2 right-2 bg-white rounded-full p-2 shadow"
          >
            {isFavorite ? (
              <AiFillHeart className="text-red-500 text-xl" />
            ) : (
              <AiOutlineHeart className="text-black text-xl" />
            )}
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
          <p className="mb-4">{product.description}</p>
          <p className="text-2xl text-rift-gold font-semibold mb-6">
            {product.price} SEK
          </p>

          <label className="mb-2 font-semibold">Select Size:</label>
          <select
            value={selectedSize}
            onChange={(e) => setSelectedSize(e.target.value)}
            className="mb-4 border rounded p-2 w-32 text-black"
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
              addToCart({ ...product, size: selectedSize });
            }}
            className="px-6 py-3 bg-rift-card border border-rift-gold/40 rounded-md hover:bg-rift-card/80 transition"
          >
            🛒 Add to Cart
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-display text-rift-gold mb-4">
          Similar Products
        </h2>

        {similar.length === 0 ? (
          <p>No similar products found.</p>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {similar.map((p) => {
              const simFav = favorites.includes(p.id);
              return (
                <div
                  key={p.id}
                  onClick={() => navigate(`/shop/product/${p.id}`)}
                  className="min-w-[200px] bg-white rounded-xl shadow cursor-pointer hover:shadow-lg transition relative text-black"
                >
                  <img
                    src={p.image_url}
                    alt={p.name}
                    className="w-full h-40 object-cover rounded-t-xl"
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
                    className="absolute bottom-2 right-2 bg-white rounded-full p-1 shadow"
                  >
                    {simFav ? (
                      <AiFillHeart className="text-red-500 text-lg" />
                    ) : (
                      <AiOutlineHeart className="text-black text-lg" />
                    )}
                  </button>
                  <div className="p-3 text-center">
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-sm text-rift-gold">{p.price} SEK</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
