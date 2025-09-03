// backend/db.js
import sqlite3 from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";


// Gör så att path alltid pekar rätt, även om du kör från annan mapp
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, "../rifthub.db");

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("❌ Error opening database:", err.message);
  } else {
    console.log("✅ Connected to SQLite database:", dbPath);
  }
});

export default db;
