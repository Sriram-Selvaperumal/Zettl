import api from "./api";
import type { TokenResponse, User } from "@/types";

export const authService = {
  async sendOtp(email: string): Promise<void> {
    await api.post("/auth/request-otp", { email });
  },

  async register(name: string, email: string, password: string, otp: string): Promise<User> {
    const { data } = await api.post<User>("/auth/register", {
      name,
      email,
      password,
      otp,
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

  async updateProfile(data: { name?: string; mobile?: string; upi_id?: string }): Promise<User> {
    const { data: user } = await api.patch<User>("/auth/profile", data);
    return user;
  },

  async uploadAvatar(file: File): Promise<User> {
    const form = new FormData();
    form.append("file", file);
    const { data: user } = await api.post<User>("/auth/avatar", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return user;
  },
};
