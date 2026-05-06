import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useJoinCircle, useCirclePreview } from "@/hooks/useCircles";
import { Loader2, Zap, CheckCircle2, XCircle, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function JoinCirclePage() {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate();
  const joinCircle = useJoinCircle();
  
  const { data: preview, isLoading, error } = useCirclePreview(inviteCode || "");
  const [joinStatus, setJoinStatus] = useState<"idle" | "success" | "error">("idle");

  const handleJoin = () => {
    if (!inviteCode) return;
    joinCircle.mutate(inviteCode, {
      onSuccess: (data) => {
        setJoinStatus("success");
        setTimeout(() => {
          navigate(`/circle/${data.id}`, { replace: true });
        }, 1500);
      },
      onError: () => {
        setJoinStatus("error");
      },
    });
  };

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

        {isLoading && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Looking up Circle...</h2>
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          </div>
        )}

        {error && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Invalid Invite Link</h2>
            <XCircle className="w-12 h-12 mx-auto text-destructive" />
            <p className="text-sm text-muted-foreground">
              {(error as any)?.response?.data?.detail ?? "This invite code is invalid or has expired."}
            </p>
            <Button
              className="w-full mt-4"
              onClick={() => navigate("/dashboard", { replace: true })}
            >
              Back to Dashboard
            </Button>
          </div>
        )}

        {preview && joinStatus === "idle" && !joinCircle.isPending && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">{preview.name}</h2>
              {preview.description && (
                <p className="text-sm text-muted-foreground">{preview.description}</p>
              )}
            </div>
            
            <div className="flex items-center justify-center gap-4 text-sm font-medium">
              <span className="flex items-center gap-1.5 text-foreground bg-muted/50 px-3 py-1.5 rounded-full">
                <Users className="w-4 h-4 text-zettl-400" />
                {preview.member_count} member{preview.member_count !== 1 && "s"}
              </span>
            </div>
            
            <p className="text-xs text-muted-foreground">
              Created on {new Date(preview.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>

            <div className="pt-2 flex gap-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate("/dashboard", { replace: true })}
              >
                Cancel
              </Button>
              <Button className="w-full" onClick={handleJoin}>
                Join Circle <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {joinCircle.isPending && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Joining...</h2>
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          </div>
        )}

        {joinStatus === "success" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Joined Successfully!</h2>
            <CheckCircle2 className="w-12 h-12 mx-auto text-green-400" />
            <p className="text-sm text-muted-foreground">Taking you to the circle...</p>
          </div>
        )}

        {joinStatus === "error" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Failed to Join</h2>
            <XCircle className="w-12 h-12 mx-auto text-destructive" />
            <p className="text-sm text-muted-foreground">
              {(joinCircle.error as any)?.response?.data?.detail ?? "Could not join circle."}
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
