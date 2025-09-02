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
// ===============================
// REGISTER (skapa användare)
// ===============================
app.post("/api/auth/register", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const emailLower = email.toLowerCase(); // 👈 alltid lowercase

  db.get(
    "SELECT * FROM users WHERE username = ? OR email = ?",
    [username, emailLower],
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
          [username, emailLower, hash],
          function (err) {
            if (err) return res.status(500).json({ error: err.message });

            // 🔹 Skapa token direkt så användaren blir inloggad
            const token = jwt.sign(
              {
                id: this.lastID,
                username,
                is_admin: 0,
              },
              JWT_SECRET,
              { expiresIn: "48h" }
            );

            res.status(201).json({
              message: "User created",
              userId: this.lastID,
              token,
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
  const { identifier, password } = req.body; // 👈 email eller username

  if (!identifier || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  // bestäm om det är email (innehåller @) eller username
  const isEmail = identifier.includes("@");

  const query = isEmail
    ? "SELECT * FROM users WHERE LOWER(email) = ?"
    : "SELECT * FROM users WHERE LOWER(username) = ?"; // 👈 lowercase även på username

  const value = identifier.toLowerCase();

  db.get(query, [value], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, username: user.username, is_admin: user.is_admin },
      JWT_SECRET,
      { expiresIn: "48h" }
    );

    res.json({ token });
  });
});
// ===============================
// UPDATE ACCOUNT (username, email, password)
// ===============================
app.put("/api/auth/update", (req, res) => {
  const { userId, currentPassword, newUsername, newEmail, newPassword } = req.body;

  if (!userId || !currentPassword) {
    return res.status(400).json({ error: "Missing userId or current password" });
  }

  db.get("SELECT * FROM users WHERE id = ?", [userId], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(404).json({ error: "User not found" });

    // ✅ Verifiera nuvarande lösen
    const match = await bcrypt.compare(currentPassword, user.password_hash);
    if (!match) {
      return res.status(400).json({ error: "Incorrect current password" });
    }

    // ✅ Bygg dynamiskt vilka fält som ska uppdateras
    const updates = [];
    const params = [];

    if (newUsername) {
      updates.push("username = ?");
      params.push(newUsername);
    }
    if (newEmail) {
      updates.push("email = ?");
      params.push(newEmail.toLowerCase());
    }
    if (newPassword) {
      const hash = await bcrypt.hash(newPassword, 10);
      updates.push("password_hash = ?");
      params.push(hash);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No changes provided" });
    }

    params.push(userId);

    db.run(
      `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
      params,
      function (err2) {
        if (err2) return res.status(500).json({ error: err2.message });

        // Ny token med ev. nytt username/email
        const updatedUser = {
          id: user.id,
          username: newUsername || user.username,
          is_admin: user.is_admin
        };

        const token = jwt.sign(updatedUser, JWT_SECRET, { expiresIn: "48h" });

        res.json({ success: true, token });
      }
    );
  });
});

// ===============================
// DELETE ACCOUNT
// ===============================
app.delete("/api/auth/delete", (req, res) => {
  const { userId, currentPassword } = req.body;

  if (!userId || !currentPassword) {
    return res.status(400).json({ error: "Missing userId or password" });
  }

  db.get("SELECT * FROM users WHERE id = ?", [userId], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(404).json({ error: "User not found" });

    const match = await bcrypt.compare(currentPassword, user.password_hash);
    if (!match) return res.status(400).json({ error: "Incorrect password" });

    db.run("DELETE FROM users WHERE id = ?", [userId], function (err2) {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({ success: true, message: "Account deleted" });
    });
  });
});


// ===============================
// Produkter & Orders
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
          avatar_url, game, socials
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
      game: profile?.game || "",
      socials: profile?.socials ? JSON.parse(profile.socials) : {}
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
    game,
    socials
  } = req.body;

db.run(
  `INSERT INTO user_profiles 
     (user_id, name, age, gender, preferred_lane, preferred_champ_id, rank, level, league_tag, wildrift_tag, note, background_id, avatar_url, game, socials)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
     avatar_url = excluded.avatar_url,
     game = excluded.game,
     socials = excluded.socials`,
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
    game,
    JSON.stringify(socials || {})
  ],
  function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  }
);

});


// ✅ Upload profilbild
app.post("/api/profile/:id/avatar", upload.single("avatar"), (req, res) => {
  const { id } = req.params;

  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const avatarUrl = `/uploads/${req.file.filename}`;

  db.run(
    `INSERT INTO user_profiles (user_id, avatar_url)
     VALUES (?, ?)
     ON CONFLICT(user_id) DO UPDATE SET avatar_url = excluded.avatar_url`,
    [id, avatarUrl],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true, avatarUrl });
    }
  );
});

// ===============================
// Middleware: kräver admin
// ===============================
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
    console.error("JWT verify failed:", err.message);
    return res.status(401).json({ error: "Invalid token" });
  }
}

// ===============================
// ADMIN: Products CRUD
// ===============================
app.get("/api/admin/products", requireAdmin, (req, res) => {
  db.all("SELECT * FROM products", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post(
  "/api/admin/products",
  requireAdmin,
  upload.single("image"),
  (req, res) => {
    const { name, description, price, categories, sku } = req.body;
    const imageUrl = req.file
      ? `http://localhost:5000/uploads/${req.file.filename}`
      : null;

    const skuRegex = /^[A-Z]{3}\d{3}$/;
    if (!skuRegex.test(sku)) {
      return res.status(400).json({ error: "Invalid SKU format (ABC123)" });
    }

    db.run(
      "INSERT INTO products (name, description, price, image_url, categories, sku, created_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)",
      [name, description, price, imageUrl, categories, sku],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, id: this.lastID });
      }
    );
  }
);

app.put("/api/admin/products/:id", requireAdmin, (req, res) => {
  const { name, description, price, categories, sku } = req.body;

  db.run(
    "UPDATE products SET name=?, description=?, price=?, categories=?, sku=? WHERE id=?",
    [name, description, price, categories, sku, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

app.delete("/api/admin/products/:id", requireAdmin, (req, res) => {
  db.run("DELETE FROM products WHERE id=?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// ===============================
// ADMIN: Champions CRUD
// ===============================
const champsDir = path.join(__dirname, "public", "champs");
if (!fs.existsSync(champsDir)) {
  fs.mkdirSync(champsDir, { recursive: true });
  console.log("📂 Skapade champions-mappen:", champsDir);
}
app.use("/champs", express.static(champsDir));

app.get("/api/admin/champions", requireAdmin, (req, res) => {
  fs.readdir(champsDir, (err, files) => {
    if (err) return res.status(500).json({ error: err.message });

    const champs = files
      .filter((f) => /\.(png|jpg|jpeg|webp)$/i.test(f))
      .map((f) => ({
        name: path.parse(f).name, // filnamn utan .png/.jpg
        file: `/champs/${f}`,     // URL till bilden
      }));

    res.json(champs);
  });
});

const champStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, champsDir),
  filename: (req, file, cb) => cb(null, file.originalname), // behåll originalnamn (t.ex. Zeri.png)
});
const champUpload = multer({ storage: champStorage });

app.post(
  "/api/admin/champions",
  requireAdmin,
  champUpload.single("champ"),
  (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    res.json({
      success: true,
      name: path.parse(req.file.originalname).name,
      file: `/champs/${req.file.filename}`,
    });
  }
);
// ✅ Public champions list (no admin required)
app.get("/api/champions", (req, res) => {
  fs.readdir(champsDir, (err, files) => {
    if (err) return res.status(500).json({ error: err.message });

    const champs = files
      .filter((f) => /\.(png|jpg|jpeg|webp)$/i.test(f))
      .map((f) => ({
        name: path.parse(f).name,
        file: `/champs/${f}`,
      }));

    res.json(champs);
  });
});



// ===============================
// FRIENDS (Friends system)
// ===============================

// 🔍 Sök användare
app.get("/api/users/search", (req, res) => {
  const q = `%${req.query.q}%`;
  db.all(
    `SELECT u.id, u.username, p.avatar_url
     FROM users u
     LEFT JOIN user_profiles p ON u.id = p.user_id
     WHERE u.username LIKE ?`,
    [q],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// ➕ Lägg till vän (ömsesidigt)
app.post("/api/friends", (req, res) => {
  const { userId, friendId } = req.body;
  if (!userId || !friendId) {
    return res.status(400).json({ error: "Missing userId or friendId" });
  }

  db.serialize(() => {
    db.run(
      "INSERT OR IGNORE INTO friends (user_id, friend_id) VALUES (?, ?)",
      [userId, friendId]
    );
    db.run(
      "INSERT OR IGNORE INTO friends (user_id, friend_id) VALUES (?, ?)",
      [friendId, userId]
    );
  });

  res.json({ success: true });
});

// 📜 Hämta vänner för en användare
app.get("/api/friends/:userId", (req, res) => {
  db.all(
    `SELECT u.id, u.username, p.avatar_url
     FROM friends f
     JOIN users u ON f.friend_id = u.id
     LEFT JOIN user_profiles p ON u.id = p.user_id
     WHERE f.user_id = ?`,
    [req.params.userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// ❌ Ta bort vän (ömsesidigt)
app.delete("/api/friends/:userId/:friendId", (req, res) => {
  const { userId, friendId } = req.params;

  db.serialize(() => {
    db.run("DELETE FROM friends WHERE user_id=? AND friend_id=?", [userId, friendId]);
    db.run("DELETE FROM friends WHERE user_id=? AND friend_id=?", [friendId, userId]);
  });

  res.json({ success: true });
});
// ===============================
// CHAT (Messages)
// ===============================

// 📜 Hämta alla meddelanden mellan två användare
app.get("/api/messages/:friendId", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });

  let me;
  try {
    me = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }

  const { friendId } = req.params;

  db.all(
    `SELECT m.*, u.username as sender_name
     FROM messages m
     JOIN users u ON m.sender_id = u.id
     WHERE (m.sender_id = ? AND m.receiver_id = ?)
        OR (m.sender_id = ? AND m.receiver_id = ?)
     ORDER BY m.created_at ASC`,
    [me.id, friendId, friendId, me.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });

      // markera som lästa
      db.run(
        "UPDATE messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ?",
        [friendId, me.id]
      );

      res.json(rows);
    }
  );
});

// ✉️ Skicka nytt meddelande
app.post("/api/messages", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });

  let me;
  try {
    me = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }

  const { receiverId, content } = req.body;
  if (!receiverId || !content) {
    return res.status(400).json({ error: "Missing receiverId or content" });
  }

  db.run(
    "INSERT INTO messages (sender_id, receiver_id, content, created_at, is_read) VALUES (?, ?, ?, CURRENT_TIMESTAMP, 0)",
    [me.id, receiverId, content],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID });
    }
  );
});

// 🔔 Hämta antal olästa meddelanden för användaren
app.get("/api/unread-count/:userId", (req, res) => {
  db.get(
    `SELECT COUNT(*) as count FROM messages 
     WHERE receiver_id = ? AND is_read = 0`,
    [req.params.userId],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ count: row.count });
    }
  );
});

// 📩 Hämta senaste meddelandet per vän
app.get("/api/last-messages/:userId", (req, res) => {
  db.all(
    `
    SELECT m.*, u.username as sender_name, f.friend_id as friendId
    FROM friends f
    JOIN messages m 
      ON (m.sender_id = f.friend_id AND m.receiver_id = f.user_id)
      OR (m.sender_id = f.user_id AND m.receiver_id = f.friend_id)
    JOIN users u ON u.id = m.sender_id
    WHERE f.user_id = ?
    GROUP BY f.friend_id
    HAVING MAX(m.created_at)
    ORDER BY MAX(m.created_at) DESC
    `,
    [req.params.userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// === Roles folder ===
const rolesDir = path.join(__dirname, "public", "role");
if (!fs.existsSync(rolesDir)) {
  fs.mkdirSync(rolesDir, { recursive: true });
  console.log("📂 Skapade role-mappen:", rolesDir);
}
app.use("/role", express.static(rolesDir));

app.get("/api/roles", (req, res) => {
  fs.readdir(rolesDir, (err, files) => {
    if (err) return res.status(500).json({ error: err.message });

    const roles = files
      .filter((f) => /\.(png|jpg|jpeg|webp)$/i.test(f))
      .map((f) => ({
        name: path.parse(f).name, // t.ex. "Top"
        file: `/role/${f}`,
      }));

    res.json(roles);
  });
});
// === Rank folder ===
const ranksDir = path.join(__dirname, "public", "rank");
if (!fs.existsSync(ranksDir)) {
  fs.mkdirSync(ranksDir, { recursive: true });
  console.log("📂 Skapade rank-mappen:", ranksDir);
}
app.use("/rank", express.static(ranksDir));

// === Images folder ===
const imagesDir = path.join(__dirname, "public", "images");
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
  console.log("📂 Skapade images-mappen:", imagesDir);
}
app.use("/images", express.static(imagesDir));

// === Social media icons folder ===
const socialsDir = path.join(__dirname, "public", "socials");
if (!fs.existsSync(socialsDir)) {
  fs.mkdirSync(socialsDir, { recursive: true });
  console.log("📂 Skapade socials-mappen:", socialsDir);
}
app.use("/socials", express.static(socialsDir));




// ===============================
// THREADS (Forum + Comments + Likes)
// ===============================

// --- självläkning: se till att tabeller/kolumner finns ---
db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS threads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      topic_id INTEGER NOT NULL,
      thumb TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  );

  db.run(
    `CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      thread_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      parent_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(thread_id) REFERENCES threads(id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`
  );

  db.run(
    `CREATE TABLE IF NOT EXISTS thread_likes (
      thread_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      UNIQUE(thread_id, user_id)
    )`
  );

  db.run(
    `CREATE TABLE IF NOT EXISTS comment_likes (
      comment_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      UNIQUE(comment_id, user_id)
    )`
  );




  // Försök lägga till parent_id – om den redan finns ignoreras felet
  db.run(`ALTER TABLE comments ADD COLUMN parent_id INTEGER`, (err) => {
    if (err && !String(err.message).includes("duplicate column name")) {
      console.warn("Could not add parent_id to comments:", err.message);
    }
  });
});

// 📜 Hämta alla trådar (inkl likes + kommentarer + liked_by_me)
app.get("/api/threads", (req, res) => {
  const userId = Number(req.query.userId) || null;

  const likedCol = userId
    ? `CASE WHEN EXISTS (
         SELECT 1 FROM thread_likes tl
         WHERE tl.thread_id = t.id AND tl.user_id = ?
       ) THEN 1 ELSE 0 END AS liked_by_me`
    : `0 AS liked_by_me`;

  const params = [];
  if (userId) params.push(userId);

  const sql = `
    SELECT
      t.id, t.title, t.content, t.created_at,
      u.username AS author, t.topic_id, t.user_id,
      IFNULL(t.thumb, '') AS thumb,
      (SELECT COUNT(*) FROM thread_likes tl WHERE tl.thread_id = t.id) AS like_count,
      (SELECT COUNT(*) FROM comments c WHERE c.thread_id = t.id) AS comment_count,
      ${likedCol}
    FROM threads t
    JOIN users u ON u.id = t.user_id
    ORDER BY t.created_at DESC
  `;

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ✍️ Skapa ny tråd (bilden syns enbart i listan)
app.post("/api/threads", upload.single("thumb"), (req, res) => {
  const { userId, title, content, topic_id } = req.body;
  if (!userId || !title || !content || !topic_id) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const thumbUrl = req.file ? `/uploads/${req.file.filename}` : "";

  db.run(
    `INSERT INTO threads (user_id, title, content, topic_id, created_at, thumb)
     VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?)`,
    [userId, title, content, Number(topic_id), thumbUrl],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });

      db.get(
        `SELECT t.id, t.title, t.content, t.created_at,
                u.username AS author, t.topic_id, t.user_id,
                IFNULL(t.thumb, '') AS thumb,
                0 AS like_count, 0 AS comment_count, 0 AS liked_by_me
         FROM threads t
         JOIN users u ON u.id = t.user_id
         WHERE t.id = ?`,
        [this.lastID],
        (err2, row) => {
          if (err2) return res.status(500).json({ error: err2.message });
          res.json(row);
        }
      );
    }
  );
});

// ✏️ Uppdatera en tråd (endast ägaren)
app.put("/api/threads/:id", upload.single("thumb"), (req, res) => {
  const threadId = Number(req.params.id);
  const { title, content, userId, removeThumb } = req.body;
  const file = req.file;

  if (!userId || !title || !content) {
    return res.status(400).json({ error: "Missing fields" });
  }

  db.get("SELECT * FROM threads WHERE id = ?", [threadId], (err, thr) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!thr) return res.status(404).json({ error: "Thread not found" });
    if (thr.user_id !== Number(userId)) {
      return res.status(403).json({ error: "Not allowed" });
    }

    // 👇 bestäm vilken thumb som ska sparas
    let newThumb = thr.thumb;
    if (removeThumb === "1") {
      newThumb = null;
    } else if (file) {
      newThumb = `/uploads/${file.filename}`;
    }

    db.run(
      "UPDATE threads SET title = ?, content = ?, thumb = ? WHERE id = ?",
      [title, content, newThumb, threadId],
      function (err2) {
        if (err2) return res.status(500).json({ error: err2.message });
        res.json({ success: true, thumb: newThumb });
      }
    );
  });
});

// 🗑️ Ta bort en tråd (endast ägaren) + allt som hör till
app.delete("/api/threads/:id", (req, res) => {
  const threadId = Number(req.params.id);
  const { userId } = req.body;

  if (!userId) return res.status(400).json({ error: "Missing userId" });

  db.get("SELECT user_id FROM threads WHERE id = ?", [threadId], (err, thr) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!thr) return res.status(404).json({ error: "Thread not found" });
    if (thr.user_id !== Number(userId)) {
      return res.status(403).json({ error: "Not allowed" });
    }

    db.serialize(() => {
      db.run("DELETE FROM thread_likes WHERE thread_id = ?", [threadId]);
      db.run(
        "DELETE FROM comment_likes WHERE comment_id IN (SELECT id FROM comments WHERE thread_id = ?)",
        [threadId]
      );
      db.run("DELETE FROM comments WHERE thread_id = ?", [threadId]);
      db.run("DELETE FROM threads WHERE id = ?", [threadId], function (err2) {
        if (err2) return res.status(500).json({ error: err2.message });
        res.json({ success: true });
      });
    });
  });
});
// ✏️ Uppdatera en tråd (endast ägaren, inkl ev. ny bild)
app.put("/api/threads/:id", upload.single("thumb"), (req, res) => {
  const threadId = Number(req.params.id);
  const { userId, title, content } = req.body;

  if (!userId || !title || !content) {
    return res.status(400).json({ error: "Missing fields" });
  }

  db.get("SELECT * FROM threads WHERE id = ?", [threadId], (err, thr) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!thr) return res.status(404).json({ error: "Thread not found" });
    if (thr.user_id !== Number(userId)) {
      return res.status(403).json({ error: "Not allowed" });
    }

    let thumb = thr.thumb;
    if (req.file) {
      thumb = `/uploads/${req.file.filename}`;
    }

    db.run(
      "UPDATE threads SET title = ?, content = ?, thumb = ? WHERE id = ?",
      [title, content, thumb, threadId],
      function (err2) {
        if (err2) return res.status(500).json({ error: err2.message });

        db.get(
          `SELECT t.id, t.title, t.content, t.created_at,
                  u.username AS author, t.topic_id, t.user_id,
                  IFNULL(t.thumb, '') AS thumb
           FROM threads t
           JOIN users u ON u.id = t.user_id
           WHERE t.id = ?`,
          [threadId],
          (err3, row) => {
            if (err3) return res.status(500).json({ error: err3.message });
            res.json(row);
          }
        );
      }
    );
  });
});

// ✏️ Uppdatera en kommentar (endast ägaren)
app.put("/api/comments/:id", (req, res) => {
  const commentId = Number(req.params.id);
  const { userId, content } = req.body;

  if (!userId || !content) {
    return res.status(400).json({ error: "Missing fields" });
  }

  db.get("SELECT * FROM comments WHERE id = ?", [commentId], (err, com) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!com) return res.status(404).json({ error: "Comment not found" });
    if (com.user_id !== Number(userId)) {
      return res.status(403).json({ error: "Not allowed" });
    }

    db.run(
      "UPDATE comments SET content = ? WHERE id = ?",
      [content, commentId],
      function (err2) {
        if (err2) return res.status(500).json({ error: err2.message });

        db.get(
          `SELECT c.id, c.thread_id, c.user_id, c.content, c.created_at, c.parent_id,
                  u.username, up.avatar_url
           FROM comments c
           JOIN users u ON u.id = c.user_id
           LEFT JOIN user_profiles up ON up.user_id = u.id
           WHERE c.id = ?`,
          [commentId],
          (err3, row) => {
            if (err3) return res.status(500).json({ error: err3.message });
            res.json(row);
          }
        );
      }
    );
  });
});

// ===============================
// THREAD LIKES (toggle)
// ===============================
app.post("/api/threads/:id/like", (req, res) => {
  const { userId } = req.body;
  const threadId = Number(req.params.id);

  if (!userId) return res.status(400).json({ error: "Missing userId" });

  db.get(
    "SELECT 1 FROM thread_likes WHERE thread_id = ? AND user_id = ?",
    [threadId, Number(userId)],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });

      const finish = (liked) => {
        db.get(
          "SELECT COUNT(*) AS like_count FROM thread_likes WHERE thread_id = ?",
          [threadId],
          (err2, r) => {
            if (err2) return res.status(500).json({ error: err2.message });
            res.json({ threadId, like_count: r.like_count, liked });
          }
        );
      };

      if (row) {
        db.run(
          "DELETE FROM thread_likes WHERE thread_id = ? AND user_id = ?",
          [threadId, Number(userId)],
          (err2) => {
            if (err2) return res.status(500).json({ error: err2.message });
            finish(false);
          }
        );
      } else {
        db.run(
          "INSERT INTO thread_likes (thread_id, user_id) VALUES (?, ?)",
          [threadId, Number(userId)],
          (err2) => {
            if (err2) return res.status(500).json({ error: err2.message });
            finish(true);
          }
        );
      }
    }
  );
});

// 📜 Hämta kommentarer (inkl. likes och avatar)
app.get("/api/threads/:threadId/comments", (req, res) => {
  const threadId = Number(req.params.threadId);
  const userId = Number(req.query.userId) || null;

  const likedCol = userId
    ? `CASE WHEN EXISTS (
         SELECT 1 FROM comment_likes cl
         WHERE cl.comment_id = c.id AND cl.user_id = ?
       ) THEN 1 ELSE 0 END AS liked_by_me`
    : `0 AS liked_by_me`;

  const sql = `
    SELECT
      c.id, c.thread_id, c.user_id, c.content, c.created_at, c.parent_id,
      u.username, up.avatar_url,
      (SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id = c.id) AS like_count,
      ${likedCol}
    FROM comments c
    JOIN users u ON u.id = c.user_id
    LEFT JOIN user_profiles up ON up.user_id = u.id
    WHERE c.thread_id = ?
    ORDER BY c.created_at ASC
  `;

  const params = userId ? [userId, threadId] : [threadId];

  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error("❌ DB select error:", err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows || []);
  });
});

// ✍️ Skapa kommentar eller reply
app.post("/api/threads/:threadId/comments", (req, res) => {
  const threadId = Number(req.params.threadId);
  const { userId, content, parent_id } = req.body;

  if (!userId || !content) {
    return res.status(400).json({ error: "Missing fields" });
  }

  console.log("👉 Inserting comment", { threadId, userId, content, parent_id });

  db.run(
    `INSERT INTO comments (thread_id, user_id, content, parent_id, created_at)
     VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [threadId, Number(userId), content, parent_id || null],
    function (err) {
      if (err) {
        console.error("❌ DB insert error:", err.message);
        return res.status(500).json({ error: err.message });
      }

      db.get(
        `SELECT
            c.id, c.thread_id, c.user_id, c.content, c.created_at, c.parent_id,
            u.username, up.avatar_url,
            0 AS like_count, 0 AS liked_by_me
         FROM comments c
         JOIN users u ON u.id = c.user_id
         LEFT JOIN user_profiles up ON up.user_id = u.id
         WHERE c.id = ?`,
        [this.lastID],
        (err2, row) => {
          if (err2) {
            console.error("❌ DB select error:", err2.message);
            return res.status(500).json({ error: err2.message });
          }
          res.status(201).json(row);
        }
      );
    }
  );
});


// ❤️ Like/unlike kommentar
app.post("/api/comments/:id/like", (req, res) => {
  const { userId } = req.body;
  const commentId = Number(req.params.id);

  if (!userId) return res.status(400).json({ error: "Missing userId" });

  db.get(
    "SELECT 1 FROM comment_likes WHERE comment_id = ? AND user_id = ?",
    [commentId, Number(userId)],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });

      const finish = (liked) => {
        db.get(
          "SELECT COUNT(*) AS like_count FROM comment_likes WHERE comment_id = ?",
          [commentId],
          (err2, r) => {
            if (err2) return res.status(500).json({ error: err2.message });
            res.json({ commentId, like_count: r.like_count, liked });
          }
        );
      };

      if (row) {
        // Redan gillat → ta bort
        db.run(
          "DELETE FROM comment_likes WHERE comment_id = ? AND user_id = ?",
          [commentId, Number(userId)],
          (err2) => {
            if (err2) return res.status(500).json({ error: err2.message });
            finish(false);
          }
        );
      } else {
        // Gilla
        db.run(
          "INSERT INTO comment_likes (comment_id, user_id) VALUES (?, ?)",
          [commentId, Number(userId)],
          (err2) => {
            if (err2) return res.status(500).json({ error: err2.message });
            finish(true);
          }
        );
      }
    }
  );
});

// ❌ Ta bort kommentar (endast ägare)
app.delete("/api/comments/:id", (req, res) => {
  const commentId = Number(req.params.id);
  const { userId } = req.body;

  if (!userId) return res.status(400).json({ error: "Missing userId" });

  db.get("SELECT user_id FROM comments WHERE id = ?", [commentId], (err, com) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!com) return res.status(404).json({ error: "Comment not found" });
    if (com.user_id !== Number(userId)) {
      return res.status(403).json({ error: "Not allowed" });
    }

    db.serialize(() => {
      db.run("DELETE FROM comment_likes WHERE comment_id = ?", [commentId]);
      db.run("DELETE FROM comments WHERE id = ?", [commentId], function (err2) {
        if (err2) return res.status(500).json({ error: err2.message });
        res.json({ success: true });
      });
    });
  });
});
// ===============================
// USER POSTS (profilflik "Posts")
// ===============================

// 🗄️ Se till att tabellerna finns
db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS user_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      image TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`
  );

  db.run(
    `CREATE TABLE IF NOT EXISTS user_post_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      parent_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(post_id) REFERENCES user_posts(id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`
  );

  db.run(
    `CREATE TABLE IF NOT EXISTS user_post_likes (
      post_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      UNIQUE(post_id, user_id)
    )`
  );

  db.run(
    `CREATE TABLE IF NOT EXISTS user_post_comment_likes (
      comment_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      UNIQUE(comment_id, user_id)
    )`
  );
});

/// 📜 Hämta alla posts för en användare
app.get("/api/user-posts/:userId", (req, res) => {
  const userId = Number(req.params.userId);
  const meId = req.query.meId ? Number(req.query.meId) : null;

  let sql;
  let params;

  if (meId) {
    sql = `
      SELECT up.id, up.content, up.image, up.created_at,
             u.username AS author, u.id AS user_id,
             (SELECT COUNT(*) FROM user_post_likes WHERE post_id = up.id) AS like_count,
             (SELECT COUNT(*) FROM user_post_comments WHERE post_id = up.id) AS comment_count,
             CASE WHEN EXISTS (
               SELECT 1 FROM user_post_likes upl
               WHERE upl.post_id = up.id AND upl.user_id = ?
             ) THEN 1 ELSE 0 END AS liked_by_me
      FROM user_posts up
      JOIN users u ON u.id = up.user_id
      WHERE up.user_id = ?
      ORDER BY up.created_at DESC
    `;
    params = [meId, userId];
  } else {
    sql = `
      SELECT up.id, up.content, up.image, up.created_at,
             u.username AS author, u.id AS user_id,
             (SELECT COUNT(*) FROM user_post_likes WHERE post_id = up.id) AS like_count,
             (SELECT COUNT(*) FROM user_post_comments WHERE post_id = up.id) AS comment_count,
             0 AS liked_by_me
      FROM user_posts up
      JOIN users u ON u.id = up.user_id
      WHERE up.user_id = ?
      ORDER BY up.created_at DESC
    `;
    params = [userId];
  }

  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error("❌ Error in /api/user-posts:", err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows || []);
  });
});


// ✍️ Skapa nytt inlägg
app.post("/api/user-posts", upload.single("image"), (req, res) => {
  const { userId, content } = req.body;
  if (!userId || !content) return res.status(400).json({ error: "Missing fields" });

  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

  db.run(
    `INSERT INTO user_posts (user_id, content, image)
     VALUES (?, ?, ?)`,
    [userId, content, imageUrl],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });

      res.status(201).json({
        id: this.lastID,
        userId,
        content,
        image: imageUrl,
        created_at: new Date().toISOString(),
      });
    }
  );
});
// 🗑️ Ta bort en post (endast ägaren)
app.delete("/api/user-posts/:id", express.json(), (req, res) => {
  const postId = Number(req.params.id);
  const userId = Number(req.body.userId); // ✅ vi tar från body (så som din frontend skickar)

  console.log("DELETE /api/user-posts", { postId, userId, body: req.body });

  if (!userId) {
    return res.status(400).json({ error: "Missing userId" });
  }

  db.get("SELECT user_id FROM user_posts WHERE id = ?", [postId], (err, post) => {
    if (err) {
      console.error("❌ DB error:", err.message);
      return res.status(500).json({ error: err.message });
    }
    if (!post) return res.status(404).json({ error: "Post not found" });
    if (post.user_id !== userId) {
      return res.status(403).json({ error: "Not allowed" });
    }

    db.serialize(() => {
      db.run("DELETE FROM user_post_likes WHERE post_id = ?", [postId]);
      db.run("DELETE FROM user_post_comments WHERE post_id = ?", [postId]);
      db.run("DELETE FROM user_posts WHERE id = ?", [postId], function (err2) {
        if (err2) {
          console.error("❌ DB delete error:", err2.message);
          return res.status(500).json({ error: err2.message });
        }
        res.json({ success: true });
      });
    });
  });
});


// ❤️ Like/unlike post
app.post("/api/user-posts/:id/like", (req, res) => {
  const postId = Number(req.params.id);
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  db.get(
    "SELECT 1 FROM user_post_likes WHERE post_id = ? AND user_id = ?",
    [postId, userId],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });

      const finish = (liked) => {
        db.get(
          "SELECT COUNT(*) AS like_count FROM user_post_likes WHERE post_id = ?",
          [postId],
          (err2, r) => {
            if (err2) return res.status(500).json({ error: err2.message });
            res.json({ postId, like_count: r.like_count, liked });
          }
        );
      };

      if (row) {
        db.run(
          "DELETE FROM user_post_likes WHERE post_id = ? AND user_id = ?",
          [postId, userId],
          (err2) => {
            if (err2) return res.status(500).json({ error: err2.message });
            finish(false);
          }
        );
      } else {
        db.run(
          "INSERT INTO user_post_likes (post_id, user_id) VALUES (?, ?)",
          [postId, userId],
          (err2) => {
            if (err2) return res.status(500).json({ error: err2.message });
            finish(true);
          }
        );
      }
    }
  );
});

// 📜 Hämta kommentarer för en post
app.get("/api/user-posts/:postId/comments", (req, res) => {
  const postId = Number(req.params.postId);
  const meId = req.query.meId ? Number(req.query.meId) : null;

  const likedCol = meId
    ? `CASE WHEN EXISTS (
         SELECT 1 FROM user_post_comment_likes upl
         WHERE upl.comment_id = c.id AND upl.user_id = ?
       ) THEN 1 ELSE 0 END AS liked_by_me`
    : `0 AS liked_by_me`;

  const sql = `
    SELECT c.id, c.post_id, c.user_id, c.content, c.parent_id, c.created_at,
           u.username, up.avatar_url,
           (SELECT COUNT(*) FROM user_post_comment_likes WHERE comment_id = c.id) AS like_count,
           ${likedCol}
    FROM user_post_comments c
    JOIN users u ON u.id = c.user_id
    LEFT JOIN user_profiles up ON up.user_id = u.id
    WHERE c.post_id = ?
    ORDER BY c.created_at ASC
  `;

  const params = meId ? [meId, postId] : [postId];

  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error("❌ Error in /api/user-posts/:postId/comments:", err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows || []);
  });
});

// ✍️ Skapa kommentar (utan parent_id)
app.post("/api/user-posts/:postId/comments", (req, res) => {
  const postId = Number(req.params.postId);
  const { userId, content } = req.body;

  console.log("💬 POST kommentar:", { postId, userId, content });

  if (!userId || !content) {
    return res.status(400).json({ error: "Missing fields" });
  }

  db.run(
    `INSERT INTO user_post_comments (post_id, user_id, content)
     VALUES (?, ?, ?)`,
    [postId, Number(userId), content],
    function (err) {
      if (err) {
        console.error("❌ DB insert error:", err.message);
        return res.status(500).json({ error: err.message });
      }

      db.get(
        `SELECT c.id, c.post_id, c.user_id, c.content, c.created_at,
                u.username, up.avatar_url,
                0 AS like_count, 0 AS liked_by_me
         FROM user_post_comments c
         JOIN users u ON u.id = c.user_id
         LEFT JOIN user_profiles up ON up.user_id = u.id
         WHERE c.id = ?`,
        [this.lastID],
        (err2, row) => {
          if (err2) {
            console.error("❌ DB select error:", err2.message);
            return res.status(500).json({ error: err2.message });
          }
          console.log("✅ Kommentar skapad:", row);
          res.status(201).json(row);
        }
      );
    }
  );
});



// ❤️ Like/unlike kommentar
app.post("/api/user-post-comments/:id/like", (req, res) => {
  const commentId = Number(req.params.id);
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  db.get(
    "SELECT 1 FROM user_post_comment_likes WHERE comment_id = ? AND user_id = ?",
    [commentId, userId],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });

      const finish = (liked) => {
        db.get(
          "SELECT COUNT(*) AS like_count FROM user_post_comment_likes WHERE comment_id = ?",
          [commentId],
          (err2, r) => {
            if (err2) return res.status(500).json({ error: err2.message });
            res.json({ commentId, like_count: r.like_count, liked });
          }
        );
      };

      if (row) {
        db.run(
          "DELETE FROM user_post_comment_likes WHERE comment_id = ? AND user_id = ?",
          [commentId, userId],
          (err2) => {
            if (err2) return res.status(500).json({ error: err2.message });
            finish(false);
          }
        );
      } else {
        db.run(
          "INSERT INTO user_post_comment_likes (comment_id, user_id) VALUES (?, ?)",
          [commentId, userId],
          (err2) => {
            if (err2) return res.status(500).json({ error: err2.message });
            finish(true);
          }
        );
      }
    }
  );
});

// ===============================
// ALBUMS (Gallery system)
// ===============================

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS albums (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      cover TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS album_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      album_id INTEGER NOT NULL,
      media_url TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(album_id) REFERENCES albums(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS album_likes (
      album_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      UNIQUE(album_id, user_id),
      FOREIGN KEY(album_id) REFERENCES albums(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS album_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      album_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(album_id) REFERENCES albums(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
});

// 📜 Hämta alla album för en användare
app.get("/api/albums/user/:userId", (req, res) => {
  const userId = Number(req.params.userId);
  const meId = req.query.meId ? Number(req.query.meId) : null;

  const likedCol = meId
    ? `CASE WHEN EXISTS (
         SELECT 1
         FROM album_likes
         WHERE album_id = a.id AND user_id = ${meId}
       ) THEN 1 ELSE 0 END AS liked_by_me`
    : `0 AS liked_by_me`;

  const sql = `
    SELECT 
      a.id, 
      a.title, 
      a.cover, 
      a.created_at,
      u.username AS author, 
      u.id AS user_id,
      (SELECT COUNT(*) FROM album_likes WHERE album_id = a.id) AS like_count,
      (SELECT COUNT(*) FROM album_comments WHERE album_id = a.id) AS comment_count,
      ${likedCol}
    FROM albums a
    JOIN users u ON u.id = a.user_id
    WHERE a.user_id = ?
    ORDER BY a.created_at DESC
  `;

  db.all(sql, [userId], (err, rows) => {
    if (err) {
      console.error("❌ Error in /api/albums/user/:userId:", err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows || []);
  });
});

// ✍️ Skapa nytt album (med bilder)
app.post("/api/albums", upload.array("images", 10), (req, res) => {
  const { userId, title, coverIndex } = req.body;
  if (!userId || !title) return res.status(400).json({ error: "Missing fields" });

  const files = req.files || [];
  if (files.length === 0) return res.status(400).json({ error: "No images uploaded" });

  // coverIndex bestämmer vilken bild som blir cover (default = första bilden)
  const coverFile = files[coverIndex ? Number(coverIndex) : 0];
  const coverUrl = coverFile ? `/uploads/${coverFile.filename}` : null;

  db.run(
    `INSERT INTO albums (user_id, title, cover) VALUES (?, ?, ?)`,
    [userId, title, coverUrl],
    function (err) {
      if (err) {
        console.error("❌ Error inserting album:", err.message);
        return res.status(500).json({ error: err.message });
      }

      const albumId = this.lastID;

      const stmt = db.prepare(
        "INSERT INTO album_items (album_id, media_url) VALUES (?, ?)"
      );
      files.forEach((file) => {
        stmt.run(albumId, `/uploads/${file.filename}`);
      });
      stmt.finalize();

      res.status(201).json({ success: true, id: albumId, cover: coverUrl });
    }
  );
});

// 📜 Hämta ett specifikt album (med bilder, kommentarer, likes)
app.get("/api/albums/:id", (req, res) => {
  const albumId = Number(req.params.id);
  const meId = req.query.meId ? Number(req.query.meId) : null;

  db.get(
    `SELECT 
        a.id,
        a.title,
        a.cover,
        a.created_at,
        u.username AS author,
        u.id AS user_id,
        (SELECT COUNT(*) FROM album_likes WHERE album_id = a.id) AS like_count,
        (SELECT COUNT(*) FROM album_comments WHERE album_id = a.id) AS comment_count,
        ${meId ? `CASE WHEN EXISTS (
            SELECT 1
            FROM album_likes
            WHERE album_id = a.id AND user_id = ?
        ) THEN 1 ELSE 0 END` : `0`} AS liked_by_me
     FROM albums a
     JOIN users u ON u.id = a.user_id
     WHERE a.id = ?`,
    [meId || -1, albumId],
    (err, album) => {
      if (err) {
        console.error("❌ Error in /api/albums/:id:", err.message);
        return res.status(500).json({ error: err.message });
      }
      if (!album) return res.status(404).json({ error: "Album not found" });

      db.all(
        `SELECT ai.id, ai.media_url, ai.created_at
         FROM album_items ai
         WHERE ai.album_id = ?
         ORDER BY ai.created_at ASC`,
        [albumId],
        (err2, images) => {
          if (err2) return res.status(500).json({ error: err2.message });

          db.all(
            `SELECT ac.id, ac.album_id, ac.user_id, ac.content, ac.created_at,
                    u.username, up.avatar_url
             FROM album_comments ac
             JOIN users u ON u.id = ac.user_id
             LEFT JOIN user_profiles up ON up.user_id = u.id
             WHERE ac.album_id = ?
             ORDER BY ac.created_at ASC`,
            [albumId],
            (err3, comments) => {
              if (err3) return res.status(500).json({ error: err3.message });
              res.json({ ...album, images, comments });
            }
          );
        }
      );
    }
  );
});

// ❤️ Like/unlike album
app.post("/api/albums/:id/like", (req, res) => {
  const albumId = Number(req.params.id);
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  db.get(
    "SELECT 1 FROM album_likes WHERE album_id = ? AND user_id = ?",
    [albumId, userId],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });

      const finish = (liked) => {
        db.get(
          "SELECT COUNT(*) AS count FROM album_likes WHERE album_id = ?",
          [albumId],
          (err2, r) => {
            if (err2) return res.status(500).json({ error: err2.message });
            res.json({ albumId, like_count: r.count, liked });
          }
        );
      };

      if (row) {
        db.run(
          "DELETE FROM album_likes WHERE album_id = ? AND user_id = ?",
          [albumId, userId],
          (err2) => {
            if (err2) return res.status(500).json({ error: err2.message });
            finish(false);
          }
        );
      } else {
        db.run(
          "INSERT INTO album_likes (album_id, user_id) VALUES (?, ?)",
          [albumId, userId],
          (err2) => {
            if (err2) return res.status(500).json({ error: err2.message });
            finish(true);
          }
        );
      }
    }
  );
});

// ✍️ Skapa kommentar
app.post("/api/albums/:id/comments", (req, res) => {
  const albumId = Number(req.params.id);
  const { userId, content } = req.body;
  if (!userId || !content) return res.status(400).json({ error: "Missing fields" });

  db.run(
    `INSERT INTO album_comments (album_id, user_id, content)
     VALUES (?, ?, ?)`,

    [albumId, userId, content],
    function (err) {
      if (err) {
        console.error("❌ Error in /api/albums/:id/comments:", err.message);
        return res.status(500).json({ error: err.message });
      }

      db.get(
        `SELECT ac.id, ac.album_id, ac.user_id, ac.content, ac.created_at,
                u.username, up.avatar_url
         FROM album_comments ac
         JOIN users u ON u.id = ac.user_id
         LEFT JOIN user_profiles up ON up.user_id = u.id
         WHERE ac.id = ?`,
        [this.lastID],
        (err2, row) => {
          if (err2) return res.status(500).json({ error: err2.message });
          res.status(201).json(row);
        }
      );
    }
  );
});
// ===============================
// ALBUM ITEMS (bilder i album)
// ===============================

// se till att tabellerna finns
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS album_item_likes (
      item_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      UNIQUE(item_id, user_id),
      FOREIGN KEY(item_id) REFERENCES album_items(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS album_item_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(item_id) REFERENCES album_items(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
});

// 📜 Hämta en specifik bild (inkl likes & kommentarer)
app.get("/api/album-items/:id", (req, res) => {
  const itemId = Number(req.params.id);
  const meId = req.query.meId ? Number(req.query.meId) : null;

  db.get(
    `SELECT ai.id, ai.media_url, ai.created_at,
            (SELECT COUNT(*) FROM album_item_likes WHERE item_id = ai.id) AS like_count,
            ${
              meId
                ? `CASE WHEN EXISTS (
                     SELECT 1 FROM album_item_likes 
                     WHERE item_id = ai.id AND user_id = ?
                   ) THEN 1 ELSE 0 END`
                : `0`
            } AS liked_by_me
     FROM album_items ai
     WHERE ai.id = ?`,
    [meId || -1, itemId],
    (err, item) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!item) return res.status(404).json({ error: "Image not found" });

      db.all(
        `SELECT c.id, c.item_id, c.user_id, c.content, c.created_at,
                u.username, up.avatar_url
         FROM album_item_comments c
         JOIN users u ON u.id = c.user_id
         LEFT JOIN user_profiles up ON up.user_id = u.id
         WHERE c.item_id = ?
         ORDER BY c.created_at ASC`,
        [itemId],
        (err2, comments) => {
          if (err2) return res.status(500).json({ error: err2.message });
          res.json({ ...item, comments });
        }
      );
    }
  );
});

// ❤️ Like/unlike en bild
app.post("/api/album-items/:id/like", (req, res) => {
  const itemId = Number(req.params.id);
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  db.get(
    "SELECT 1 FROM album_item_likes WHERE item_id = ? AND user_id = ?",
    [itemId, userId],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });

      const finish = (liked) => {
        db.get(
          "SELECT COUNT(*) AS count FROM album_item_likes WHERE item_id = ?",
          [itemId],
          (err2, r) => {
            if (err2) return res.status(500).json({ error: err2.message });
            res.json({ itemId, like_count: r.count, liked });
          }
        );
      };

      if (row) {
        db.run(
          "DELETE FROM album_item_likes WHERE item_id = ? AND user_id = ?",
          [itemId, userId],
          (err2) => {
            if (err2) return res.status(500).json({ error: err2.message });
            finish(false);
          }
        );
      } else {
        db.run(
          "INSERT INTO album_item_likes (item_id, user_id) VALUES (?, ?)",
          [itemId, userId],
          (err2) => {
            if (err2) return res.status(500).json({ error: err2.message });
            finish(true);
          }
        );
      }
    }
  );
});

// ✍️ Kommentera en bild
app.post("/api/album-items/:id/comments", (req, res) => {
  const itemId = Number(req.params.id);
  const { userId, content } = req.body;
  if (!userId || !content)
    return res.status(400).json({ error: "Missing fields" });

  db.run(
    `INSERT INTO album_item_comments (item_id, user_id, content)
     VALUES (?, ?, ?)`,
    [itemId, userId, content],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });

      db.get(
        `SELECT c.id, c.item_id, c.user_id, c.content, c.created_at,
                u.username, up.avatar_url
         FROM album_item_comments c
         JOIN users u ON u.id = c.user_id
         LEFT JOIN user_profiles up ON up.user_id = u.id
         WHERE c.id = ?`,
        [this.lastID],
        (err2, row) => {
          if (err2) return res.status(500).json({ error: err2.message });
          res.status(201).json(row);
        }
      );
    }
  );
});
// ✏️ Uppdatera album (titel + ev ny cover)
app.put("/api/albums/:id", upload.single("cover"), (req, res) => {
  const albumId = Number(req.params.id);
  const { userId, title, removeCover } = req.body;

  if (!userId || !title) {
    return res.status(400).json({ error: "Missing fields" });
  }

  db.get("SELECT * FROM albums WHERE id = ?", [albumId], (err, album) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!album) return res.status(404).json({ error: "Album not found" });
    if (album.user_id !== Number(userId)) {
      return res.status(403).json({ error: "Not allowed" });
    }

    let newCover = album.cover;
    if (removeCover === "1") {
      newCover = null;
    } else if (req.file) {
      newCover = `/uploads/${req.file.filename}`;
    }

    db.run(
      "UPDATE albums SET title = ?, cover = ? WHERE id = ?",
      [title, newCover, albumId],
      function (err2) {
        if (err2) return res.status(500).json({ error: err2.message });
        res.json({ success: true, id: albumId, title, cover: newCover });
      }
    );
  });
});

// ❌ Ta bort album (inkl. bilder/comments via CASCADE)
app.delete("/api/albums/:id", (req, res) => {
  const albumId = Number(req.params.id);
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  db.get("SELECT user_id FROM albums WHERE id = ?", [albumId], (err, album) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!album) return res.status(404).json({ error: "Album not found" });
    if (album.user_id !== Number(userId)) {
      return res.status(403).json({ error: "Not allowed" });
    }

    db.run("DELETE FROM albums WHERE id = ?", [albumId], function (err2) {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({ success: true });
    });
  });
});

// ➕ Lägg till nya bilder i ett album
app.post("/api/albums/:id/images", upload.array("images", 10), (req, res) => {
  const albumId = Number(req.params.id);
  const { userId } = req.body;

  if (!userId) return res.status(400).json({ error: "Missing userId" });
  const files = req.files || [];
  if (files.length === 0) return res.status(400).json({ error: "No files uploaded" });

  db.get("SELECT * FROM albums WHERE id = ?", [albumId], (err, album) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!album) return res.status(404).json({ error: "Album not found" });
    if (album.user_id !== Number(userId)) {
      return res.status(403).json({ error: "Not allowed" });
    }

    const stmt = db.prepare("INSERT INTO album_items (album_id, media_url) VALUES (?, ?)");
    files.forEach((file) => {
      stmt.run(albumId, `/uploads/${file.filename}`);
    });
    stmt.finalize();

    res.json({ success: true });
  });
});

// ❌ Ta bort en bild från ett album
app.delete("/api/album-items/:id", (req, res) => {
  const itemId = Number(req.params.id);
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  db.get("SELECT album_id FROM album_items WHERE id = ?", [itemId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Image not found" });

    db.get("SELECT user_id FROM albums WHERE id = ?", [row.album_id], (err2, album) => {
      if (err2) return res.status(500).json({ error: err2.message });
      if (!album) return res.status(404).json({ error: "Album not found" });
      if (album.user_id !== Number(userId)) {
        return res.status(403).json({ error: "Not allowed" });
      }

      db.run("DELETE FROM album_items WHERE id = ?", [itemId], function (err3) {
        if (err3) return res.status(500).json({ error: err3.message });
        res.json({ success: true });
      });
    });
  });
});


// ===============================
// Starta servern
// ===============================
const PORT = 5000;
app.listen(PORT, () =>
  console.log(`✅ Backend running on http://localhost:${PORT}`)
);
