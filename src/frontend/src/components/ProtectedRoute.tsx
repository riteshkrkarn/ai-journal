import { Navigate } from "react-router-dom";
import { hasAuth } from "../utils/auth";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return hasAuth() ? <>{children}</> : <Navigate to="/login" replace />;
}
