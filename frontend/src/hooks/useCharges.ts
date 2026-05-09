import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { chargeService, type CreateChargePayload } from "@/services/chargeService";

export function useCircleCharges(circleId: string) {
  return useQuery({
    queryKey: ["charges", "circle", circleId],
    queryFn: () => chargeService.getCircleCharges(circleId),
    enabled: !!circleId,
  });
}

export function useChargeDetail(chargeId: string) {
  return useQuery({
    queryKey: ["charges", chargeId],
    queryFn: () => chargeService.getChargeDetail(chargeId),
    enabled: !!chargeId,
  });
}

export function useCreateCharge(circleId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateChargePayload) => chargeService.createCharge(circleId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["charges", "circle", circleId] });
      queryClient.invalidateQueries({ queryKey: ["circle", circleId] }); // Maybe invalidate net balances later
    },
  });
}
