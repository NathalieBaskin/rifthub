// src/utils/auth.js
export function getUserFromToken() {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload; // { id, username, is_admin, iat, exp }
  } catch (err) {
    console.error("Invalid token:", err);
    return null;
  }
}
