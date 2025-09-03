import { createContext, useEffect, useState } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    const stored = sessionStorage.getItem("cart");
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    sessionStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  // ➕ Lägg till produkt (storlek måste skickas in i product.size)
  function addToCart(product) {
    if (!product.size) {
      console.error("❌ No size provided for product:", product);
      return cart; // hindra att man råkar lägga till utan storlek
    }

    setCart((prev) => {
      const existing = prev.find(
        (p) => p.id === product.id && p.size === product.size
      );

      if (existing) {
        return prev.map((p) =>
          p.id === product.id && p.size === product.size
            ? { ...p, quantity: p.quantity + 1 }
            : p
        );
      }

      return [...prev, { ...product, quantity: 1 }];
    });
  }

  // 🔼 Uppdatera antal
  function updateQuantity(productId, size, quantity) {
    setCart((prev) =>
      prev
        .map((p) =>
          p.id === productId && p.size === size ? { ...p, quantity } : p
        )
        .filter((p) => p.quantity > 0)
    );
  }

  // ❌ Ta bort HELT (oberoende av quantity)
  function removeFromCart(productId, size) {
    setCart((prev) =>
      prev.filter((p) => !(p.id === productId && p.size === size))
    );
  }

  // 🗑️ Töm allt
  function clearCart() {
    setCart([]);
  }

  const count = cart.reduce((sum, p) => sum + p.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        count,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export default CartContext;
