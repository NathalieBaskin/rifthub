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

app.post("/api/admin/products", requireAdmin, upload.single("image"), (req, res) => {
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
});

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
app.put("/api/threads/:id", (req, res) => {
  const { title, content, userId } = req.body;
  const threadId = Number(req.params.id);

  if (!userId || !title || !content) {
    return res.status(400).json({ error: "Missing fields" });
  }

  db.get("SELECT user_id FROM threads WHERE id = ?", [threadId], (err, thr) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!thr) return res.status(404).json({ error: "Thread not found" });
    if (thr.user_id !== Number(userId)) {
      return res.status(403).json({ error: "Not allowed" });
    }

    db.run(
      "UPDATE threads SET title = ?, content = ? WHERE id = ?",
      [title, content, threadId],
      function (err2) {
        if (err2) return res.status(500).json({ error: err2.message });
        res.json({ success: true });
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
// Starta servern
// ===============================
const PORT = 5000;
app.listen(PORT, () =>
  console.log(`✅ Backend running on http://localhost:${PORT}`)
);
