// src/pages/AuthPage.jsx
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function AuthPage() {
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  // 🔹 Hämta query-parametrar (t.ex. ?redirect=/summoners-hall&open=new)
  const queryParams = new URLSearchParams(location.search);
  const redirect = queryParams.get("redirect") || "/";
  const open = queryParams.get("open") || null;

  // ===== LOGIN =====
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginUsername, password: loginPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      localStorage.setItem("token", data.token);

      // 🔹  tillbaka till redirect (ex: /summoners-hall?open=new)
      navigate(redirect + (open ? `?open=${open}` : ""));
    } catch (err) {
      console.error(err);
      setError("Server error");
    }
  };

  // ===== REGISTER =====
  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: regUsername,
          email: regEmail,
          password: regPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      // 🔹 Spara token direkt så att man är inloggad efter registrering
      if (data.token) {
        localStorage.setItem("token", data.token);
        navigate(redirect + (open ? `?open=${open}` : ""));
      } else {
        setSuccess("Account created successfully! You can now log in.");
        setRegUsername("");
        setRegEmail("");
        setRegPassword("");
      }
    } catch (err) {
      console.error(err);
      setError("Server error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center text-black">
      <div className="w-full max-w-md bg-white p-6 rounded-xl shadow-lg space-y-6">
        <h2 className="text-2xl font-display text-rift-gold text-center mb-2">
          Login
        </h2>

        {error && (
          <p className="bg-red-500/20 text-red-600 p-2 rounded mb-3 text-center">
            {error}
          </p>
        )}
        {success && (
          <p className="bg-green-500/20 text-green-600 p-2 rounded mb-3 text-center">
            {success}
          </p>
        )}

        {/* LOGIN FORM */}
        <form onSubmit={handleLogin} className="space-y-3">
          <div>
            <label className="block text-sm mb-1">Username or Email</label>
            <input
              type="text"
              value={loginUsername}
              onChange={(e) => setLoginUsername(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-white text-black border border-rift-gold/40 focus:outline-none focus:ring-2 focus:ring-rift-gold"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Password</label>
            <input
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-white text-rift-bg border border-rift-gold/40 focus:outline-none focus:ring-gold"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-rift-gold text-rift-bg font-semibold rounded-md hover:brightness-105 transition"
          >
            Login
          </button>
        </form>

        <div className="border-t border-rift-gold/30 my-4"></div>

        {/* REGISTER FORM */}
        <h3 className="text-xl font-display text-rift-gold text-center mb-2">
          Not a member yet? Register
        </h3>

        <form onSubmit={handleRegister} className="space-y-3">
          <div>
            <label className="block text-sm mb-1">Username</label>
            <input
              type="text"
              value={regUsername}
              onChange={(e) => setRegUsername(e.target.value)}
              className="w-full px-3 py-2 rounded"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              type="email"
              value={regEmail}
              onChange={(e) => setRegEmail(e.target.value)}
              className="w-full border p-2 rounded"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Password</label>
            <input
              type="password"
              value={regPassword}
              onChange={(e) => setRegPassword(e.target.value)}
              className="w-full border p-2 rounded"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-rift-card text-rift-bg font-semibold rounded-md hover:brightness-105 transition"
          >
            Register
          </button>
        </form>
      </div>
    </div>
  );
}
