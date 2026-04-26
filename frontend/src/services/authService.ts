import api from "./api";
import type { TokenResponse, User } from "@/types";

export const authService = {
  async register(name: string, email: string, password: string): Promise<User> {
    const { data } = await api.post<User>("/auth/register", {
      name,
      email,
      password,
    });
    return data;
  },

  async login(
    email: string,
    password: string
  ): Promise<{ token: TokenResponse; user: User }> {
    const { data: token } = await api.post<TokenResponse>("/auth/login", {
      email,
      password,
    });
    const { data: user } = await api.get<User>("/auth/me", {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });
    return { token, user };
  },

  async getMe(): Promise<User> {
    const { data } = await api.get<User>("/auth/me");
    return data;
  },

  async logout(): Promise<void> {
    await api.post("/auth/logout");
  },

  async refresh(): Promise<TokenResponse> {
    const { data } = await api.post<TokenResponse>("/auth/refresh");
    return data;
  },
};
