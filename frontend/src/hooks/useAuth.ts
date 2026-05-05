import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { authService } from "@/services/authService";
import { useAuthStore } from "@/store/authStore";

// ─── useLogin ─────────────────────────────────────────────────────────────────

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authService.login(email, password),
    onSuccess: ({ token, user }) => {
      setAuth(user, token.access_token);
      navigate("/dashboard");
    },
  });
}

// ─── useRegister ──────────────────────────────────────────────────────────────

export function useRegister() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({
      name,
      username,
      email,
      password,
      otp,
    }: {
      name: string;
      username: string;
      email: string;
      password: string;
      otp: string;
    }) => authService.register(name, username, email, password, otp),
    onSuccess: () => {
      navigate("/login");
    },
  });
}

export function useSendOtp() {
  return useMutation({
    mutationFn: (email: string) => authService.sendOtp(email),
  });
}

// ─── useLogout ────────────────────────────────────────────────────────────────

export function useLogout() {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSettled: () => {
      clearAuth();
      queryClient.clear();
      navigate("/login");
    },
  });
}

// ─── useMe ────────────────────────────────────────────────────────────────────

export function useMe() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: ["me"],
    queryFn: authService.getMe,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
