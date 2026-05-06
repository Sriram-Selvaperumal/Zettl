import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Copy,
  Check,
  Crown,
  Users,
  Zap,
  Plus,
  Share2,
  LogOut,
  UserMinus,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCircleDetail, useRemoveMember } from "@/hooks/useCircles";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";

export default function CirclePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const { data: circle, isLoading, error } = useCircleDetail(id!);
  const removeMember = useRemoveMember();
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyCode = () => {
    if (!circle) return;
    navigator.clipboard.writeText(circle.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRemove = (userId: string, isSelf: boolean) => {
    if (!circle) return;
    const confirmMsg = isSelf 
      ? "Are you sure you want to leave this circle?" 
      : "Are you sure you want to remove this member?";
    if (confirm(confirmMsg)) {
      removeMember.mutate({ circleId: circle.id, userId }, {
        onSuccess: () => {
          if (isSelf) navigate("/dashboard", { replace: true });
        }
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-zettl-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !circle) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Circle not found or you are not a member.</p>
          <Button onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  const myMember = circle.members.find((m) => m.user_id === currentUser?.id);

  return (
    <div className="min-h-screen bg-background">
      {/* Ambient blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-zettl-600/10 rounded-full blur-3xl" />
      </div>

      {/* Navbar */}
      <header className="border-b border-border/50 backdrop-blur-md sticky top-0 z-50 bg-background/80">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard")}
            className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-zettl-500 to-purple-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg gradient-text">Zettl</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Circle header */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-foreground">{circle.name}</h1>
                {myMember?.role === "admin" && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                    <Crown className="w-3 h-3" /> Admin
                  </span>
                )}
              </div>
              {circle.description && (
                <p className="text-muted-foreground text-sm">{circle.description}</p>
              )}
            </div>
          </div>

          {/* Invite section */}
          <div className="flex items-center gap-3 mt-4 p-3 rounded-xl bg-muted/50 border border-border">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-0.5">Invite Code</p>
              <p className="font-mono font-semibold text-sm tracking-widest text-foreground">
                {circle.invite_code}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                id="copy-invite-link"
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/join/${circle.invite_code}`);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2000);
                }}
                className="shrink-0 bg-primary/10 hover:bg-primary/20 border-primary/20 text-primary hover:text-primary"
              >
                {copiedLink ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Share2 className="w-4 h-4" />
                )}
                <span className="ml-1.5 text-xs">{copiedLink ? "Link Copied!" : "Share Link"}</span>
              </Button>
              <Button
                id="copy-invite-code"
                variant="outline"
                size="sm"
                onClick={handleCopyCode}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                <span className="ml-1.5 text-xs">{copied ? "Copied!" : "Copy Code"}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Members */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-zettl-400" />
            <h2 className="font-semibold text-foreground">
              Members ({circle.members.length})
            </h2>
          </div>
          <div className="space-y-3">
            {circle.members.map((member) => (
              <div
                key={member.user_id}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zettl-500 to-purple-600 flex items-center justify-center text-white font-semibold shrink-0">
                  {member.name[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm text-foreground truncate">
                      {member.name}
                      {member.user_id === currentUser?.id && (
                        <span className="text-muted-foreground font-normal"> (you)</span>
                      )}
                    </p>
                    {member.role === "admin" && (
                      <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                </div>
                <span
                  className={cn(
                    "text-xs px-2 py-0.5 rounded-full shrink-0",
                    member.role === "admin"
                      ? "bg-amber-500/10 text-amber-400"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {member.role}
                </span>

                {/* Leave / Remove Buttons */}
                {member.user_id === currentUser?.id ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 ml-2"
                    title="Leave Circle"
                    onClick={() => handleRemove(member.user_id, true)}
                    disabled={removeMember.isPending}
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                ) : myMember?.role === "admin" ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 ml-2"
                    title="Remove Member"
                    onClick={() => handleRemove(member.user_id, false)}
                    disabled={removeMember.isPending}
                  >
                    <UserMinus className="w-4 h-4" />
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        {/* Charges section — Phase 3 placeholder */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Charges</h2>
            <Button id="add-charge-btn" size="sm" disabled>
              <Plus className="w-4 h-4 mr-1.5" />
              Add Charge
              <span className="ml-2 text-xs opacity-60">(Phase 3)</span>
            </Button>
          </div>
          <div className="text-center py-10">
            <p className="text-muted-foreground text-sm">
              No charges yet. Charges coming in Phase 3!
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
