import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useJoinCircle } from "@/hooks/useCircles";
import { Loader2, Zap, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function JoinCirclePage() {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate();
  const joinCircle = useJoinCircle();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    if (!inviteCode) {
      setStatus("error");
      return;
    }

    joinCircle.mutate(inviteCode, {
      onSuccess: (data) => {
        setStatus("success");
        setTimeout(() => {
          navigate(`/circle/${data.id}`, { replace: true });
        }, 1500);
      },
      onError: (err: any) => {
        // If already a member, backend returns 409 Conflict maybe?
        // Let's just check if it's already a member. If the error says already a member, we can't easily get the circleId from error.
        // Actually, let's just let the user go back to dashboard.
        setStatus("error");
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inviteCode]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-zettl-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl" />
      </div>

      <div className="glass-card rounded-2xl p-8 max-w-sm w-full text-center relative z-10 animate-fade-in shadow-2xl">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-zettl-500 to-purple-600 mb-6 shadow-xl">
          <Zap className="w-8 h-8 text-white" />
        </div>

        {status === "loading" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Joining Circle...</h2>
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">Using invite code: {inviteCode}</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Joined Successfully!</h2>
            <CheckCircle2 className="w-12 h-12 mx-auto text-green-400" />
            <p className="text-sm text-muted-foreground">Taking you to the circle...</p>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Failed to Join</h2>
            <XCircle className="w-12 h-12 mx-auto text-destructive" />
            <p className="text-sm text-muted-foreground">
              {(joinCircle.error as any)?.response?.data?.detail ?? "Invalid or expired invite code."}
            </p>
            <Button
              className="w-full mt-4"
              onClick={() => navigate("/dashboard", { replace: true })}
            >
              Back to Dashboard
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
