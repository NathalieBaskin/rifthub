import express from "express";
import cors from "cors";
import sqlite3 from "sqlite3";

// öppna databasen
const db = new sqlite3.Database("../rifthub.db");

const app = express();
app.use(cors());
app.use(express.json());

// Hämta alla produkter
app.get("/api/products", (req, res) => {
  db.all("SELECT * FROM products", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Hämta en produkt via ID
app.get("/api/products/:id", (req, res) => {
  db.get("SELECT * FROM products WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  });
});

// Starta servern
const PORT = 5000;
app.listen(PORT, () => console.log(`✅ Backend running on http://localhost:${PORT}`));
