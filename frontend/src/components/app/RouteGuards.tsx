import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

/**
 * Wraps routes that require authentication.
 * If no accessToken in memory → redirect to /login.
 */
export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

/**
 * Wraps routes that should NOT be accessible when authenticated
 * (login, register). Redirects to /dashboard if already logged in.
 */
export function PublicOnlyRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
