// src/main.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import { FavoritesProvider } from "./context/FavoritesContext.jsx";
import { getUserFromToken } from "./utils/auth.js";

const root = createRoot(document.getElementById("root"));
const user = getUserFromToken();

root.render(
  <React.StrictMode>
    <FavoritesProvider me={user}>
      <BrowserRouter>
        <CartProvider>
          <App />
        </CartProvider>
      </BrowserRouter>
    </FavoritesProvider>
  </React.StrictMode>
);
