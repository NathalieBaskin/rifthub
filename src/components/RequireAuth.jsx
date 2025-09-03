// src/components/RequireAuth.jsx
import { Navigate, useLocation } from "react-router-dom";
import { getUserFromToken } from "../utils/auth.js";

export default function RequireAuth({ children }) {
  const user = getUserFromToken();
  const loc = useLocation();
  if (!user) {
    return <Navigate to="/auth" replace state={{ from: loc.pathname }} />;
  }
  return children;
}
