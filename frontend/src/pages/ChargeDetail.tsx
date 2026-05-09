import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Receipt, CheckCircle2, Clock, User, Link as LinkIcon, AlertCircle } from "lucide-react";
import { useChargeDetail } from "@/hooks/useCharges";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/utils/formatCurrency";
import { cn } from "@/lib/utils";

export default function ChargeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);

  const { data: charge, isLoading, error } = useChargeDetail(id!);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-zettl-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !charge) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Charge not found.</p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  const amIInvolved = charge.splits.some(s => s.user_id === currentUser?.id);
  const mySplit = charge.splits.find(s => s.user_id === currentUser?.id);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Navbar */}
      <header className="border-b border-border/50 backdrop-blur-md sticky top-0 z-50 bg-background/80">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-3">
          <button
            onClick={() => navigate(`/circle/${charge.circle_id}`)}
            className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" />
            <span className="font-bold text-lg text-foreground">Charge Detail</span>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-8 space-y-6">
        
        {/* Header summary */}
        <div className="glass-card rounded-2xl p-6 text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">{charge.title}</h1>
          <p className="text-3xl font-black gradient-text py-2">
            {formatCurrency(charge.total_amount)}
          </p>
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
            <User className="w-4 h-4" />
            Paid by <span className="font-semibold text-foreground">{charge.payer_name}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            {new Date(charge.created_at).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          
          {charge.description && (
            <div className="mt-6 p-4 rounded-xl bg-muted/30 border border-border/50 text-left">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{charge.description}</p>
            </div>
          )}
        </div>

        {/* Proof of Payment */}
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold text-foreground text-sm uppercase tracking-wider">Proof of Payment</h2>
          {charge.proof.type === "upi" ? (
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border">
              <div className="flex items-center gap-3 text-muted-foreground">
                <LinkIcon className="w-5 h-5" />
                <span className="text-sm">UPI Ref:</span>
              </div>
              <span className="font-mono font-medium text-foreground">{charge.proof.upi_ref}</span>
            </div>
          ) : (
            <div className="rounded-xl overflow-hidden border border-border/50 bg-muted/20">
              {charge.proof.url ? (
                <img src={charge.proof.url} alt="Receipt proof" className="w-full object-cover max-h-64" />
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No image provided</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Split Breakdown */}
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-foreground text-sm uppercase tracking-wider">Split Breakdown</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium uppercase tracking-widest">
              {charge.split_type}
            </span>
          </div>
          
          <div className="bg-muted/20 border border-border/50 rounded-2xl divide-y divide-border/50 overflow-hidden">
            {charge.splits.map(split => {
              const isMe = split.user_id === currentUser?.id;
              
              return (
                <div key={split.user_id} className={cn(
                  "p-4 flex items-center justify-between",
                  isMe && "bg-primary/5"
                )}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-zettl-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium shrink-0">
                      {split.user_name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {split.user_name} {isMe && <span className="text-muted-foreground font-normal">(you)</span>}
                      </p>
                      {split.status === "cleared" ? (
                        <p className="text-xs text-green-500 flex items-center gap-1 mt-0.5">
                          <CheckCircle2 className="w-3 h-3" /> Cleared
                        </p>
                      ) : (
                        <p className="text-xs text-amber-500 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" /> Pending
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">
                      {formatCurrency(split.amount_due)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {amIInvolved && mySplit?.status === "pending" && mySplit.user_id !== charge.payer_id && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>You owe <strong>{formatCurrency(mySplit.amount_due)}</strong> to <strong>{charge.payer_name}</strong> for this charge.</p>
          </div>
        )}
      </main>
    </div>
  );
}
