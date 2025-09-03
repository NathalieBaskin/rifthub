import express from "express";
import db from "../db.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import jwt from "jsonwebtoken";
import { fileURLToPath } from "url";

const router = express.Router();

// === JWT-secret (samma som i server.js) ===
const JWT_SECRET = "supersecretkey";

// === fixa __dirname för ESM ===
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// === Uploads-mapp ===
const uploadDir = path.join(__dirname, "..", "public", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(file.originalname)),
});
const upload = multer({ storage });

// === Admin-middleware ===
function requireAdmin(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.is_admin) {
      return res.status(403).json({ error: "Not authorized" });
    }
    req.user = decoded;
    next();
  } catch (err) {
    console.error("JWT verify failed:", err.message); // 👈 använder err
    return res.status(401).json({ error: "Invalid token" });
  }
}


// ===============================
// 📦 Publika routes
// ===============================

// Hämta alla produkter
router.get("/", (req, res) => {
  const now = new Date();
  db.all("SELECT * FROM products WHERE created_at <= ?", [now.toISOString()], (_err, rows) => {
    if (_err) return res.status(500).json({ error: "Database error" });

    const products = rows.map((p) => {
      const created = new Date(p.created_at);
      const diffDays = (now - created) / (1000 * 60 * 60 * 24);
      return { ...p, isNew: diffDays <= 7 };
    });
    res.json(products);
  });
});

// Hämta en produkt
router.get("/:id", (req, res) => {
  db.get("SELECT * FROM products WHERE id = ?", [req.params.id], (_err, row) => {
    if (_err) return res.status(500).json({ error: "Database error" });
    if (!row) return res.status(404).json({ error: "Product not found" });

    const now = new Date();
    const created = new Date(row.created_at);
    const diffDays = (now - created) / (1000 * 60 * 60 * 24);
    res.json({ ...row, isNew: diffDays <= 7 });
  });
});

// Liknande produkter
router.get("/:id/similar", (req, res) => {
  db.get("SELECT categories FROM products WHERE id = ?", [req.params.id], (_err, row) => {
    if (_err) return res.status(500).json({ error: "Database error" });
    if (!row) return res.status(404).json({ error: "Product not found" });

    const category = row.categories?.split(",")[0]?.trim() || "";
    db.all(
      "SELECT * FROM products WHERE categories LIKE ? AND id != ? LIMIT 10",
      [`%${category}%`, req.params.id],
      (_err2, rows) => {
        if (_err2) return res.status(500).json({ error: "Database error" });

        const now = new Date();
        const products = rows.map((p) => {
          const created = new Date(p.created_at);
          const diffDays = (now - created) / (1000 * 60 * 60 * 24);
          return { ...p, isNew: diffDays <= 7 };
        });
        res.json(products);
      }
    );
  });
});

// Nyheter – senaste 7 dagar
router.get("/news/latest", (req, res) => {
  db.all("SELECT * FROM products", [], (_err, rows) => {
    if (_err) return res.status(500).json({ error: "Database error" });

    const now = new Date();
    const latest = rows.filter((p) => {
      const created = new Date(p.created_at);
      const diffDays = (now - created) / (1000 * 60 * 60 * 24);
      return diffDays <= 7;
    });
    res.json(latest);
  });
});

// ===============================
// 🛠 Admin CRUD
// ===============================

// Hämta alla produkter (admin)
router.get("/admin/all", requireAdmin, (req, res) => {
  db.all("SELECT * FROM products", [], (_err, rows) => {
    if (_err) return res.status(500).json({ error: _err.message });
    res.json(rows);
  });
});

// Skapa produkt
router.post("/admin", requireAdmin, upload.single("image"), (req, res) => {
  const { name, description, price, categories, sku, created_at } = req.body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

  const skuRegex = /^[A-Z]{3}\d{3}$/;
  if (!skuRegex.test(sku)) {
    return res.status(400).json({ error: "Invalid SKU format (ABC123)" });
  }

  db.get("SELECT id FROM products WHERE sku = ?", [sku], (_err, existing) => {
    if (_err) return res.status(500).json({ error: _err.message });
    if (existing) return res.status(400).json({ error: "SKU already exists" });

    db.run(
      `INSERT INTO products (name, description, price, image_url, categories, sku, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, description, price, imageUrl, categories, sku, created_at || new Date().toISOString()],
      function (_err2) {
        if (_err2) return res.status(500).json({ error: _err2.message });
        res.json({ success: true, id: this.lastID });
      }
    );
  });
});

// Uppdatera produkt
router.put("/admin/:id", requireAdmin, upload.single("image"), (req, res) => {
  const { id } = req.params;
  const { name, description, price, categories, sku, created_at } = req.body;

  const skuRegex = /^[A-Z]{3}\d{3}$/;
  if (!skuRegex.test(sku)) {
    return res.status(400).json({ error: "Invalid SKU format (ABC123)" });
  }

  db.get("SELECT id FROM products WHERE sku = ? AND id != ?", [sku, id], (_err, existing) => {
    if (_err) return res.status(500).json({ error: _err.message });
    if (existing) return res.status(400).json({ error: "SKU already exists" });

    let imageUrl = null;
    if (req.file) imageUrl = `/uploads/${req.file.filename}`;

    const sql = `
      UPDATE products
      SET name=?, description=?, price=?, categories=?, sku=?, created_at=? ${imageUrl ? ", image_url=?" : ""}
      WHERE id=?`;

    const params = [
      name,
      description,
      price,
      categories,
      sku,
      created_at || new Date().toISOString(),
    ];
    if (imageUrl) params.push(imageUrl);
    params.push(id);

    db.run(sql, params, function (_err2) {
      if (_err2) return res.status(500).json({ error: _err2.message });
      res.json({ success: true });
    });
  });
});

// Ta bort produkt
router.delete("/admin/:id", requireAdmin, (req, res) => {
  db.run("DELETE FROM products WHERE id=?", [req.params.id], function (_err) {
    if (_err) return res.status(500).json({ error: _err.message });
    res.json({ success: true });
  });
});

export default router;
