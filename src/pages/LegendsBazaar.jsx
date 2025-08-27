import { useEffect, useState } from "react";
import { useCart } from "../context/useCart.js";


export default function LegendsBazaar() {
  const [products, setProducts] = useState([]);
  const { addToCart } = useCart();

  useEffect(() => {
    fetch("http://localhost:5000/api/products")
      .then((res) => res.json())
      .then((data) => setProducts(data));
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-display text-rift-gold mb-6">
        Legends Bazaar
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {products.map((p) => (
          <div
            key={p.id}
            className="card-fantasy p-4 flex flex-col items-center text-center"
          >
            <img
              src={p.image_url}
              alt={p.name}
              className="w-32 h-32 object-contain mb-4"
            />
            <h2 className="text-lg font-bold">{p.name}</h2>
            <p className="text-sm text-gray-400">{p.description}</p>
            <p className="mt-2 text-rift-gold font-semibold">{p.price} SEK</p>

            <button
              onClick={() => addToCart(p)}
              className="mt-4 px-4 py-2 bg-rift-card border border-rift-gold/40 rounded-md hover:bg-rift-card/80 transition"
            >
              🛒 Add to Cart
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
