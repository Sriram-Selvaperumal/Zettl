import { useState, useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

/**
 * Wraps routes that require authentication.
 * If no accessToken in memory → redirect to /login.
 */
export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    sessionStorage.setItem("return_to", location.pathname);
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
  const [returnTo] = useState(() => sessionStorage.getItem("return_to"));

  useEffect(() => {
    if (isAuthenticated && returnTo) {
      sessionStorage.removeItem("return_to");
    }
  }, [isAuthenticated, returnTo]);

  if (isAuthenticated) {
    return <Navigate to={returnTo || "/dashboard"} replace />;
  }

  return <Outlet />;
}
