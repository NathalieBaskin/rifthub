import { useCart } from "../context/useCart.js";

import { Link } from "react-router-dom";

export default function Cart() {
  const { cart, removeFromCart } = useCart();

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-display mb-6">Your Cart</h1>

      {cart.length === 0 ? (
        <p className="text-gray-400">Your cart is empty.</p>
      ) : (
        <>
          <ul className="space-y-4">
            {cart.map((item) => (
              <li
                key={item.id}
                className="flex justify-between items-center border-b border-rift-gold/25 pb-2"
              >
                <div>
                  <span className="font-semibold">{item.name}</span>{" "}
                  <span className="text-sm text-gray-400">
                    (x{item.quantity})
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-rift-gold">
                    {item.price * item.quantity} SEK
                  </span>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition"
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
              className="mt-4 inline-block px-4 py-2 bg-rift-card border border-rift-gold/40 rounded-md hover:bg-rift-card/80 transition"
            >
              Go to Checkout →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
