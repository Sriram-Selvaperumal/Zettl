import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { chargeService } from "@/services/chargeService";


export function useCreateCharge(circleId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => chargeService.createCharge(circleId, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["charges", circleId] });
      queryClient.invalidateQueries({ queryKey: ["circle", circleId] });
    },
  });
}

export function useCharges(circleId: string) {
  return useQuery({
    queryKey: ["charges", circleId],
    queryFn: () => chargeService.getCharges(circleId),
    enabled: !!circleId,
  });
}

export function useChargeDetail(chargeId: string) {
  return useQuery({
    queryKey: ["charge", chargeId],
    queryFn: () => chargeService.getChargeDetail(chargeId),
    enabled: !!chargeId,
  });
}

export function useMySplit(chargeId: string) {
  return useQuery({
    queryKey: ["charge", chargeId, "my-split"],
    queryFn: () => chargeService.getMySplit(chargeId),
    enabled: !!chargeId,
  });
}
