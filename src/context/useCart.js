import { useContext } from "react";
import CartContext from "./CartContext.jsx"; // 👈 default import

export function useCart() {
  return useContext(CartContext);
}
