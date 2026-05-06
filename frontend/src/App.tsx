import { BrowserRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ProtectedRoute, PublicOnlyRoute } from "@/components/app/RouteGuards";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import CirclePage from "@/pages/CirclePage";
import NewCharge from "@/pages/NewCharge";
import ChargeDetail from "@/pages/ChargeDetail";
import ProfilePage from "@/pages/Profile";
import JoinCirclePage from "@/pages/JoinCirclePage";
import { Navigate } from "react-router-dom";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30 * 1000, // 30 seconds
    },
  },
});

function AppRoutes() {
  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Public only (redirect to dashboard if logged in) */}
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/circle/:id" element={<CirclePage />} />
        <Route path="/circle/:id/charge/new" element={<NewCharge />} />
        <Route path="/charge/:id" element={<ChargeDetail />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/join/:inviteCode" element={<JoinCirclePage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
