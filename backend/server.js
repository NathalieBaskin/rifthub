import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "./db.js"; // 👈 central databasanslutning

const app = express();
app.use(cors());
app.use(express.json());

// hemlig nyckel för JWT (lägg helst i .env i framtiden)
const JWT_SECRET = "supersecretkey";

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
// Skapa en order (gäst eller user_id)
// ===============================
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
// MY PAGE (Profil)
// ===============================

// Hämta en profil (returnerar alltid user, även om profil saknas)
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
                rank, level, league_tag, wildrift_tag, note, background_id
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
          });
        }
      );
    }
  );
});

// Uppdatera eller skapa profil
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
  } = req.body;

  db.run(
    `INSERT INTO user_profiles 
       (user_id, name, age, gender, preferred_lane, preferred_champ_id, rank, level, league_tag, wildrift_tag, note, background_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
       background_id = excluded.background_id`,
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
    ],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
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
