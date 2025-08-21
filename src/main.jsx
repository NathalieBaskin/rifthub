// src/main.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

// ✅ Importera din App-komponent
import App from "./App";

// ✅ Koppla React till din index.html -> <div id="root"></div>
const root = createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
