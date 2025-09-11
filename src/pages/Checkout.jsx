import { useCart } from "../context/useCart.js";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Checkout() {
  const { cart, clearCart } = useCart();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    address: "",
    zipcode: "",
    city: "",
    payment: "card",
  });
  const [confirmation, setConfirmation] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate ();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:5000/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, items: cart }),
      });

      const text = await res.text();
      console.log("Server response:", text);

      const data = JSON.parse(text);
      if (!res.ok) throw new Error(data.error || "Something went wrong");

      setConfirmation(data.orderId);
      clearCart();
    } catch (err) {
      console.error("Order error:", err.message);
      setError(err.message);
    }
  }

if (confirmation) {
  return (
    <div className="max-w-xl mx-auto p-6 text-center">
      <h1 className="text-2xl font-display mb-4">Order Confirmed 🎉</h1>
      <p className="mb-2">Thank you for your purchase, {form.firstName}!</p>
      <p className="text-black">
        A confirmation has been sent to {form.email}
      </p>
      <button
        onClick={() => navigate("/")}
        className="mt-6 px-4 py-2 bg-rift-card text-rift-gold border border-rift-gold/40 rounded-md hover:bg-rift-card/80 transition"
      >
        Go to Homepage
      </button>
    </div>
  );
}


  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-display mb-6">Checkout</h1>

      {cart.length === 0 ? (
        <p className="text-black">Your cart is empty.</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-2 bg-red-600 text-white rounded">{error}</div>
          )}

          {/* Orderöversikt */}
          <div className="border border-rift-gold/40 rounded p-3 mb-4">
            <h2 className="font-semibold mb-2">Order Summary</h2>
            <ul className="space-y-2">
              {cart.map((item) => (
                <li
                  key={`${item.id}-${item.size}`}
                  className="flex items-center gap-4 border-b border-rift-gold/20 pb-2"
                >
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-12 h-12 object-contain rounded"
                  />
                  <div className="flex-1">
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-black">
                      Size: {item.size} | Qty: {item.quantity}
                    </p>
                  </div>
                  <span className="text-white font-semibold">
                    {item.price * item.quantity} SEK
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Kunduppgifter */}
          <input
            name="firstName"
            placeholder="First Name"
            value={form.firstName}
            onChange={handleChange}
            required
            className="w-full border border-rift-gold/40 rounded px-3 py-2 text-black"
          />
          <input
            name="lastName"
            placeholder="Last Name"
            value={form.lastName}
            onChange={handleChange}
            required
            className="w-full border border-rift-gold/40 rounded px-3 py-2 text-black"
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full border border-rift-gold/40 rounded px-3 py-2 text-black"
          />

          <input
            name="address"
            placeholder="Address (street + number)"
            value={form.address}
            onChange={handleChange}
            required
            className="w-full border border-rift-gold/40 rounded px-3 py-2 text-black"
          />

          <div className="flex gap-4">
            <input
              name="zipcode"
              placeholder="Postnummer"
              value={form.zipcode}
              onChange={handleChange}
              required
              className="w-1/3 border border-rift-gold/40 rounded px-3 py-2 text-black"
            />
            <input
              name="city"
              placeholder="Ort"
              value={form.city}
              onChange={handleChange}
              required
              className="flex-1 border border-rift-gold/40 rounded px-3 py-2 text-black"
            />
          </div>

          {/* Payment */}
          <div className="space-y-2">
            <p className="font-semibold text-rift-gold">Payment Method</p>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="payment"
                value="card"
                checked={form.payment === "card"}
                onChange={handleChange}
              />
              Credit Card
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="payment"
                value="invoice"
                checked={form.payment === "invoice"}
                onChange={handleChange}
              />
              Invoice
            </label>
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-rift-card border border-rift-gold/40 rounded-md hover:bg-rift-card/80 transition"
          >
            Place Order
          </button>
        </form>
      )}
    </div>
    
  );
}
