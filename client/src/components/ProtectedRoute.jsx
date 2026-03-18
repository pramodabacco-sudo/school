// src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { getAuth } from "../auth/storage";

export default function ProtectedRoute({ children, allowedTypes }) {
  const auth = getAuth();

  if (!auth) return <Navigate to="/" replace />;

  if (allowedTypes && !allowedTypes.includes(auth.accountType)) {
    return <Navigate to="/" replace />;
  }

  return children;
}