import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import path, { dirname } from "path";
import multer from "multer";
import fs from "fs";
import { fileURLToPath } from "url";
import db from "./db.js";

// === fixa __dirname för ESM ===
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// ✅ se till att uploads-mappen alltid finns
const uploadDir = path.join(__dirname, "public", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("📂 Skapade mappen:", uploadDir);
}

// gör uploads-mappen publik
app.use("/uploads", express.static(uploadDir));

// hemlig nyckel för JWT
const JWT_SECRET = "supersecretkey";

// ===============================
// MULTER (för filuppladdning)
// ===============================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// ===============================
// REGISTER (skapa användare)
// ===============================
app.post("/api/auth/register", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  db.get(
    "SELECT * FROM users WHERE username = ? OR email = ?",
    [username, email],
    async (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (row) {
        return res
          .status(400)
          .json({ error: "Username or email already exists" });
      }

      try {
        const hash = await bcrypt.hash(password, 10);

        db.run(
          "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
          [username, email, hash],
          function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({
              message: "User created",
              userId: this.lastID,
            });
          }
        );
      } catch (err) {
        console.error("Password hashing failed:", err);
        res.status(500).json({ error: "Password hashing failed" });
      }
    }
  );
});

// ===============================
// LOGIN (logga in användare)
// ===============================
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: "All fields are required" });

  db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, username: user.username, is_admin: user.is_admin },
      JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({ token });
  });
});

// ===============================
// Produkter & Orders (oförändrat)
// ===============================
app.get("/api/products", (req, res) => {
  db.all("SELECT * FROM products", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get("/api/products/:id", (req, res) => {
  db.get("SELECT * FROM products WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  });
});

app.post("/api/orders", (req, res) => {
  const { userId, firstName, lastName, email, address, payment, items } =
    req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: "Cart is empty" });
  }

  db.run(
    `INSERT INTO orders 
      (user_id, first_name, last_name, address, email, payment_method, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [userId || null, firstName, lastName, address, email, payment],
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

      res.json({ success: true, orderId });
    }
  );
});

// ===============================
// PROFILE (My Page)
// ===============================
app.get("/api/profile/:id", (req, res) => {
  const { id } = req.params;

  db.get(
    `SELECT id, username, email FROM users WHERE id = ?`,
    [id],
    (err, user) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!user) return res.status(404).json({ error: "User not found" });

      db.get(
        `SELECT name, age, gender, preferred_lane, preferred_champ_id,
                rank, level, league_tag, wildrift_tag, note, background_id,
                avatar_url
         FROM user_profiles
         WHERE user_id = ?`,
        [id],
        (err, profile) => {
          if (err) return res.status(500).json({ error: err.message });

          res.json({
            id: user.id,
            username: user.username,
            email: user.email,
            name: profile?.name || "",
            age: profile?.age || "",
            gender: profile?.gender || "",
            preferred_lane: profile?.preferred_lane || "",
            preferred_champ_id: profile?.preferred_champ_id || "",
            rank: profile?.rank || "",
            level: profile?.level || "",
            league_tag: profile?.league_tag || "",
            wildrift_tag: profile?.wildrift_tag || "",
            note: profile?.note || "",
            background_id: profile?.background_id || "",
            avatar_url: profile?.avatar_url || "",
          });
        }
      );
    }
  );
});

app.put("/api/profile/:id", (req, res) => {
  const { id } = req.params;
  const {
    name,
    age,
    gender,
    preferred_lane,
    preferred_champ_id,
    rank,
    level,
    league_tag,
    wildrift_tag,
    note,
    background_id,
    avatar_url,
  } = req.body;

  db.run(
    `INSERT INTO user_profiles 
       (user_id, name, age, gender, preferred_lane, preferred_champ_id, rank, level, league_tag, wildrift_tag, note, background_id, avatar_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       name = excluded.name,
       age = excluded.age,
       gender = excluded.gender,
       preferred_lane = excluded.preferred_lane,
       preferred_champ_id = excluded.preferred_champ_id,
       rank = excluded.rank,
       level = excluded.level,
       league_tag = excluded.league_tag,
       wildrift_tag = excluded.wildrift_tag,
       note = excluded.note,
       background_id = excluded.background_id,
       avatar_url = excluded.avatar_url`,
    [
      id,
      name,
      age,
      gender,
      preferred_lane,
      preferred_champ_id,
      rank,
      level,
      league_tag,
      wildrift_tag,
      note,
      background_id,
      avatar_url,
    ],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

// ✅ Upload profilbild (via multer)
app.post("/api/profile/:id/avatar", upload.single("avatar"), (req, res) => {
  const { id } = req.params;

  console.log("➡️ Upload route hit!");
  console.log("req.file:", req.file);

  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const avatarUrl = `/uploads/${req.file.filename}`;
  console.log("✅ Avatar sparad:", avatarUrl);

  db.run(
    `INSERT INTO user_profiles (user_id, avatar_url)
     VALUES (?, ?)
     ON CONFLICT(user_id) DO UPDATE SET avatar_url = excluded.avatar_url`,
    [id, avatarUrl],
    function (err) {
      if (err) {
        console.error("❌ DB-fel:", err.message);
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true, avatarUrl });
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
