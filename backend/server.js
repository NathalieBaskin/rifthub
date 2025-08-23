import express from "express";
import cors from "cors";
import sqlite3 from "sqlite3";

// öppna databasen
const db = new sqlite3.Database("../rifthub.db");

const app = express();
app.use(cors());
app.use(express.json());

// ===============================
// Hämta alla produkter
// ===============================
app.get("/api/products", (req, res) => {
  db.all("SELECT * FROM products", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ===============================
// Hämta en produkt via ID
// ===============================
app.get("/api/products/:id", (req, res) => {
  db.get("SELECT * FROM products WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  });
});

// ===============================
// Skapa en order
// ===============================
app.post("/api/orders", (req, res) => {
  const { firstName, lastName, email, address, payment, items } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: "Cart is empty" });
  }

  db.run(
  `INSERT INTO orders 
    (user_id, first_name, last_name, address, email, payment_method, created_at) 
    VALUES (NULL, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
  [firstName, lastName, address, email, payment],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });

      const orderId = this.lastID;

      const stmt = db.prepare(
        "INSERT INTO order_items (order_id, product_id, quantity) VALUES (?, ?, ?)"
      );

      items.forEach((item) => {
        stmt.run(orderId, item.id, item.quantity);
      });

      stmt.finalize();

      // Skicka svar med orderId
      res.json({ success: true, orderId });
    }
  );
});

// ===============================
// Starta servern
// ===============================
const PORT = 5000;
app.listen(PORT, () =>
  console.log(`✅ Backend running on http://localhost:${PORT}`)
);
