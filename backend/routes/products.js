import express from "express";
import db from "../db.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import jwt from "jsonwebtoken";
import { fileURLToPath } from "url";

const JWT_SECRET = "supersecretkey";

// === ESM __dirname ===
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// === Uploads-mapp ===
const uploadDir = path.join(__dirname, "..", "public", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// === Multer ===
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) =>
    cb(null, Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(file.originalname)),
});
const upload = multer({ storage });

// === Admin-middleware ===
function requireAdmin(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.is_admin) return res.status(403).json({ error: "Not authorized" });
    req.user = decoded;
    next();
  } catch (err) {
    console.error("JWT verify failed:", err.message);
    return res.status(401).json({ error: "Invalid token" });
  }
}

// === Helpers ===
function toYYYYMMDD(input) {
  if (!input) return new Date().toISOString().slice(0, 10);
  const d = new Date(input);
  if (isNaN(d)) return new Date().toISOString().slice(0, 10);
  return d.toISOString().slice(0, 10); // yyyy-MM-dd
}

function withIsNew(row) {
  const now = new Date();
  const created = new Date(row.created_at);
  const diffDays = (now - created) / (1000 * 60 * 60 * 24);
  return { ...row, isNew: diffDays <= 7 };
}

/* ================================
   PUBLIC ROUTER  (/api/products)
================================ */
const productsPublicRouter = express.Router();

// Viktigt: mer specifika routes före ":id"
productsPublicRouter.get("/news/latest", (_req, res) => {
  db.all("SELECT * FROM products", [], (err, rows) => {
    if (err) return res.status(500).json({ error: "Database error" });
    const latest = rows.map(withIsNew).filter(p => p.isNew);
    res.json(latest);
  });
});

// Hämta alla produkter (publikt)
productsPublicRouter.get("/", (_req, res) => {
  const nowIso = new Date().toISOString(); // ok även om created_at är yyyy-MM-dd
  db.all("SELECT * FROM products WHERE created_at <= ?", [nowIso], (err, rows) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json(rows.map(withIsNew));
  });
});

// Hämta en produkt
productsPublicRouter.get("/:id", (req, res) => {
  db.get("SELECT * FROM products WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (!row) return res.status(404).json({ error: "Product not found" });
    res.json(withIsNew(row));
  });
});

// Liknande produkter
productsPublicRouter.get("/:id/similar", (req, res) => {
  db.get("SELECT categories FROM products WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (!row) return res.status(404).json({ error: "Product not found" });

    const firstCat = row.categories?.split(",")[0]?.trim() || "";
    db.all(
      "SELECT * FROM products WHERE categories LIKE ? AND id != ? LIMIT 10",
      [`%${firstCat}%`, req.params.id],
      (err2, rows) => {
        if (err2) return res.status(500).json({ error: "Database error" });
        res.json(rows.map(withIsNew));
      }
    );
  });
});

/* ================================
   ADMIN ROUTER  (/api/admin/products)
================================ */
const productsAdminRouter = express.Router();

// Hämta alla (admin) – returnera { success, products }
productsAdminRouter.get("/", requireAdmin, (_req, res) => {
  db.all("SELECT * FROM products ORDER BY id DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, products: rows });
  });
});

// Skapa produkt
productsAdminRouter.post("/", requireAdmin, upload.single("image"), (req, res) => {
  const { name, description = "", price, categories = "", sku, created_at } = req.body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

  if (!name || !price || !sku) {
    return res.status(400).json({ success: false, error: "name, price, sku are required" });
  }
  const skuRegex = /^[A-Z]{3}\d{3}$/;
  if (!skuRegex.test(sku)) {
    return res.status(400).json({ success: false, error: "Invalid SKU format (ABC123)" });
  }

  const dateOnly = toYYYYMMDD(created_at);

  db.get("SELECT id FROM products WHERE sku = ?", [sku], (err, existing) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    if (existing) return res.status(400).json({ success: false, error: "SKU already exists" });

    db.run(
      `INSERT INTO products (name, description, price, image_url, categories, sku, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, description, Number(price), imageUrl, categories, sku, dateOnly],
      function (err2) {
        if (err2) return res.status(500).json({ success: false, error: err2.message });

        db.get("SELECT * FROM products WHERE id = ?", [this.lastID], (e3, row) => {
          if (e3) return res.status(500).json({ success: false, error: e3.message });
          res.json({ success: true, product: row });
        });
      }
    );
  });
});

// Uppdatera produkt
productsAdminRouter.put("/:id", requireAdmin, upload.single("image"), (req, res) => {
  const { id } = req.params;
  const { name, description = "", price, categories = "", sku, created_at } = req.body;

  if (!name || !price || !sku) {
    return res.status(400).json({ success: false, error: "name, price, sku are required" });
  }
  const skuRegex = /^[A-Z]{3}\d{3}$/;
  if (!skuRegex.test(sku)) {
    return res.status(400).json({ success: false, error: "Invalid SKU format (ABC123)" });
  }

  const dateOnly = toYYYYMMDD(created_at);
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

  db.get("SELECT id FROM products WHERE id = ?", [id], (err, exists) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    if (!exists) return res.status(404).json({ success: false, error: "Product not found" });

    db.get("SELECT id FROM products WHERE sku = ? AND id != ?", [sku, id], (e2, dup) => {
      if (e2) return res.status(500).json({ success: false, error: e2.message });
      if (dup) return res.status(400).json({ success: false, error: "SKU already exists" });

      const sql =
        `UPDATE products
         SET name=?, description=?, price=?, categories=?, sku=?, created_at=?` +
        (imageUrl ? `, image_url=?` : ``) +
        ` WHERE id=?`;

      const params = [
        name,
        description,
        Number(price),
        categories,
        sku,
        dateOnly,
      ];
      if (imageUrl) params.push(imageUrl);
      params.push(id);

      db.run(sql, params, function (e3) {
        if (e3) return res.status(500).json({ success: false, error: e3.message });

        db.get("SELECT * FROM products WHERE id = ?", [id], (e4, row) => {
          if (e4) return res.status(500).json({ success: false, error: e4.message });
          res.json({ success: true, product: row });
        });
      });
    });
  });
});

// Ta bort produkt
productsAdminRouter.delete("/:id", requireAdmin, (req, res) => {
  db.run("DELETE FROM products WHERE id=?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ success: false, error: err.message });
    if (this.changes === 0) return res.status(404).json({ success: false, error: "Not found" });
    res.json({ success: true });
  });
});

export { productsAdminRouter };
export default productsPublicRouter;
