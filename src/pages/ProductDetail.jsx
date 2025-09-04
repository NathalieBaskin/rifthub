// src/pages/ProductDetail.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useCart } from "../context/useCart.js";
import { HiOutlineHeart, HiHeart } from "react-icons/hi2";
import { useFavorites } from "../hooks/useFavorites";
import ProductCard from "../components/ProductCard";

// Swiper imports
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

export default function ProductDetail() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { favorites, toggleFavorite } = useFavorites();

  const [product, setProduct] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [selectedSize, setSelectedSize] = useState("");

  useEffect(() => {
    async function fetchData() {
      const res = await fetch(`http://localhost:5000/api/products/${id}`);
      const data = await res.json();
      setProduct(data);

      const simRes = await fetch(
        `http://localhost:5000/api/products/${id}/similar`
      );
      const simData = await simRes.json();
      setSimilar(simData);
    }
    fetchData();
  }, [id]);

  if (!product) return <p className="p-6">Loading...</p>;

  const isFavorite = favorites.some((p) => Number(p.id) === Number(product.id));

  return (
    <div className="max-w-5xl mx-auto p-6 text-white">
      {/* Produkt-detaljer */}
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
            onClick={() => toggleFavorite(product)}
            className="absolute bottom-2 right-2 bg-white rounded-full p-2 shadow"
          >
            {isFavorite ? (
              <HiHeart className="text-rift-gold text-xl" />
            ) : (
              <HiOutlineHeart className="text-gray-600 text-xl" />
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

      {/* Liknande produkter */}
      <div>
        <h2 className="text-2xl font-display text-rift-gold mb-4">
          Similar Products
        </h2>

        {similar.length === 0 ? (
          <p>No similar products found.</p>
        ) : (
   <Swiper
  modules={[Navigation]}
  navigation
  spaceBetween={16}
  slidesPerView={3}
  className="
    [&_.swiper-button-next]:!text-rift-gold 
    [&_.swiper-button-prev]:!text-rift-gold
    [&_.swiper-button-next]:!w-10 [&_.swiper-button-prev]:!w-10
    [&_.swiper-button-next]:!h-10 [&_.swiper-button-prev]:!h-10
    [&_.swiper-button-next]:hover:!text-black
    [&_.swiper-button-prev]:hover:!text-black
  "
>
  {similar.map((p) => (
    <SwiperSlide key={p.id}>
      <ProductCard product={p} />
    </SwiperSlide>
  ))}
</Swiper>

        )}
      </div>
      
    </div>
  );
}
