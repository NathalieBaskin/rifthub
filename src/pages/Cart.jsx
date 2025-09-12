import { useCart } from "../context/useCart.js";
import { Link } from "react-router-dom";

export default function Cart() {
  const { cart, removeFromCart, updateQuantity } = useCart();

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-display mb-6">Your Cart</h1>

      {cart.length === 0 ? (
        <p className="text-white">Your cart is empty.</p>
      ) : (
        <>
          <ul className="space-y-4">
            {cart.map((item) => (
              <li
                key={`${item.id}-${item.size}`}
                className="flex justify-between items-center border-b border-rift-gold/25 pb-2"
              >
                {/* vänster sida: bild + info */}
                <div className="flex items-center gap-4">
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-16 h-16 object-contain rounded"
                  />
                  <div>
                    <span className="font-semibold">{item.name}</span>
                    <div className="text-sm text-rift-gold">
                      Size: {item.size}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.size, item.quantity - 1)
                        }
                        className="px-2 py-1 bg-black/30 border border-rift-gold/40 rounded hover:bg-black/80 transition"
                        disabled={item.quantity <= 1}
                      >
                        -
                      </button>
                      <span className="px-2">{item.quantity}</span>
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.size, item.quantity + 1)
                        }
                        className="px-2 py-1 bg-black/30 border border-rift-gold/40 rounded hover:bg-black/80 transition"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* höger sida: pris + remove */}
                <div className="flex items-center gap-4">
                  <span className="text-white font-semibold">
                    {item.price * item.quantity} SEK
                  </span>
                  <button
                    onClick={() => removeFromCart(item.id, item.size)}
                    className="px-2 py-1 bg-black text-rift-gold rounded hover:bg-red-700 transition hover:text-white transition"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-6 text-right">
            <p className="text-lg font-semibold">
              Total: <span className="text-rift-gold">{total} SEK</span>
            </p>

            <Link
              to="/checkout"
              className="mt-4 inline-block px-4 py-2 bg-black/30 border border-rift-gold/40 rounded-md hover:bg-black/80 transition"
            >
              Go to Checkout →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
