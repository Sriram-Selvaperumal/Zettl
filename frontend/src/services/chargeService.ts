import api from "./api";
import type { Charge } from "@/types";

export interface CreateChargePayload {
  title: string;
  description: string;
  total_amount: number;
  split_type: "equal" | "custom";
  proof: {
    type: "image" | "upi";
    url?: string | null;
    upi_ref?: string | null;
  };
  involved_user_ids?: string[];
  custom_splits?: Record<string, number>;
}

export const chargeService = {
  async createCharge(circleId: string, payload: CreateChargePayload): Promise<Charge> {
    const { data } = await api.post<Charge>(`/circles/${circleId}/charges`, payload);
    return data;
  },

  async getCircleCharges(circleId: string): Promise<Charge[]> {
    const { data } = await api.get<Charge[]>(`/circles/${circleId}/charges`);
    return data;
  },

  async getChargeDetail(chargeId: string): Promise<Charge> {
    const { data } = await api.get<Charge>(`/charges/${chargeId}`);
    return data;
  },
};
