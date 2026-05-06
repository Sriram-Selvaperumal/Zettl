import api from "./api";
import type { Circle, CircleDetail, CirclePreview } from "@/types";

export const circleService = {
  async createCircle(name: string, description: string): Promise<Circle> {
    const { data } = await api.post<Circle>("/circles/", { name, description });
    return data;
  },

  async getMyCircles(): Promise<Circle[]> {
    const { data } = await api.get<Circle[]>("/circles/");
    return data;
  },

  async joinCircle(invite_code: string): Promise<Circle> {
    const { data } = await api.post<Circle>("/circles/join", { invite_code });
    return data;
  },

  async getCircleDetail(circleId: string): Promise<CircleDetail> {
    const { data } = await api.get<CircleDetail>(`/circles/${circleId}`);
    return data;
  },

  async getCirclePreview(invite_code: string): Promise<CirclePreview> {
    const { data } = await api.get<CirclePreview>(`/circles/invite/${invite_code}`);
    return data;
  },

  async removeMember(circleId: string, userId: string): Promise<void> {
    await api.delete(`/circles/${circleId}/members/${userId}`);
  },
};
