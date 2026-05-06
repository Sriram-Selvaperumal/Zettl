import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { circleService } from "@/services/circleService";

// ─── useMyCircles ─────────────────────────────────────────────────────────────

export function useMyCircles() {
  return useQuery({
    queryKey: ["circles"],
    queryFn: circleService.getMyCircles,
    staleTime: 60 * 1000, // 1 minute
  });
}

// ─── useCircleDetail ──────────────────────────────────────────────────────────

export function useCircleDetail(circleId: string) {
  return useQuery({
    queryKey: ["circle", circleId],
    queryFn: () => circleService.getCircleDetail(circleId),
    enabled: !!circleId,
  });
}

// ─── useCreateCircle ──────────────────────────────────────────────────────────

export function useCreateCircle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, description }: { name: string; description: string }) =>
      circleService.createCircle(name, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["circles"] });
    },
  });
}

// ─── useJoinCircle ────────────────────────────────────────────────────────────

export function useJoinCircle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invite_code: string) => circleService.joinCircle(invite_code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["circles"] });
    },
  });
}

// ─── useCirclePreview ─────────────────────────────────────────────────────────

export function useCirclePreview(invite_code: string) {
  return useQuery({
    queryKey: ["circlePreview", invite_code],
    queryFn: () => circleService.getCirclePreview(invite_code),
    enabled: !!invite_code,
    retry: false, // Don't retry if invite code is invalid
  });
}

// ─── useRemoveMember ──────────────────────────────────────────────────────────

export function useRemoveMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ circleId, userId }: { circleId: string; userId: string }) =>
      circleService.removeMember(circleId, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["circle", variables.circleId] });
      queryClient.invalidateQueries({ queryKey: ["circles"] });
    },
  });
}
