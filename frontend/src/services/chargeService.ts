import api from "./api";
import type { Charge, SplitEntry } from "@/types";

export const chargeService = {
  createCharge: async (circleId: string, formData: FormData): Promise<Charge> => {
    const { data } = await api.post(`/circles/${circleId}/charges`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return data;
  },

  getCharges: async (circleId: string): Promise<Charge[]> => {
    const { data } = await api.get(`/circles/${circleId}/charges`);
    return data;
  },

  getChargeDetail: async (chargeId: string): Promise<Charge> => {
    const { data } = await api.get(`/charges/${chargeId}`);
    return data;
  },

  getMySplit: async (chargeId: string): Promise<SplitEntry> => {
    const { data } = await api.get(`/charges/${chargeId}/my-split`);
    return data;
  },
};
