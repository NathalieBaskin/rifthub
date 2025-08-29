// backend/routes/auth.js
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

const router = express.Router();
const JWT_SECRET = "supersecretkey"; // byt till process.env.JWT_SECRET i riktig app

// öppna databas
const dbPromise = open({
  filename: "./rifthub.db",
  driver: sqlite3.Database,
});

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const db = await dbPromise;

    // kontrollera unikt användarnamn + email
    const existing = await db.get(
      "SELECT * FROM users WHERE username = ? OR email = ?",
      [username, email]
    );
    if (existing) {
      return res.status(400).json({ error: "Username or email already exists" });
    }

    // hash lösenord
    const hash = await bcrypt.hash(password, 10);

    // spara användare
    const result = await db.run(
      "INSERT INTO users (username, email, password_hash) VALUES (?,?,?)",
      [username, email, hash]
    );

    res.status(201).json({ message: "User created", userId: result.lastID });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const db = await dbPromise;

    const user = await db.get("SELECT * FROM users WHERE email = ?", [email]);
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // skapa JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, is_admin: user.is_admin },
      JWT_SECRET,
      { expiresIn: "48h" }
    );

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
