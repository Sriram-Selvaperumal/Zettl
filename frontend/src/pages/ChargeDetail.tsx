import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, QrCode, Receipt, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChargeDetail } from "@/hooks/useCharges";
import { useAuthStore } from "@/store/authStore";
import { formatCurrency } from "@/utils/formatCurrency";

export default function ChargeDetail() {
  const { id: chargeId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);

  const { data: charge, isLoading, error } = useChargeDetail(chargeId!);

  if (isLoading) {
    return <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></div>;
  }

  if (error || !charge) {
    return (
      <div className="p-8 text-center">
        <p className="text-destructive">Failed to load charge details.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  const isPayer = charge.payer_id === currentUser?.id;
  const mySplit = charge.splits.find(s => s.user_id === currentUser?.id);

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Expense Detail</h1>
        </div>
      </div>

      <div className="bg-card border border-border/50 rounded-2xl p-6 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-foreground">{formatCurrency(charge.total_amount)}</h2>
          <p className="text-lg font-medium">{charge.title}</p>
          <p className="text-sm text-muted-foreground">
            Paid by <span className="text-foreground font-medium">{isPayer ? "You" : charge.payer_name}</span> on {new Date(charge.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </p>
          {charge.description && (
            <p className="text-sm bg-muted/30 p-3 rounded-lg mt-4 text-left border border-border/50">
              {charge.description}
            </p>
          )}
        </div>

        {/* Proof Section */}
        <div className="pt-4 border-t border-border/50">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Receipt className="w-4 h-4" /> Proof of Payment
          </h3>
          {charge.proof.type === "image" ? (
            <div className="rounded-xl overflow-hidden border border-border/50 bg-muted/30 flex items-center justify-center p-2">
              <img src={charge.proof.url!} alt="Receipt" className="max-h-64 object-contain rounded-lg" />
            </div>
          ) : (
            <div className="bg-muted/30 p-4 rounded-xl border border-border/50 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">UPI Reference Number</p>
                <p className="font-mono font-medium">{charge.proof.upi_ref}</p>
              </div>
            </div>
          )}
        </div>

        {/* Splits Section */}
        <div className="pt-4 border-t border-border/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <ImageIcon className="w-4 h-4 hidden" /> Split Details
            </h3>
            <span className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground uppercase tracking-wider font-semibold">
              {charge.split_type}
            </span>
          </div>

          <div className="space-y-3">
            {charge.splits.map((split) => {
              const isMe = split.user_id === currentUser?.id;
              return (
                <div key={split.user_id} className={`flex items-center justify-between p-3 rounded-xl border ${isMe ? 'bg-primary/5 border-primary/20' : 'bg-muted/30 border-border/50'}`}>
                  <div>
                    <p className="font-medium">
                      {split.user_name} {isMe && "(You)"}
                    </p>
                    <p className={`text-xs mt-0.5 font-medium ${split.status === 'cleared' ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {split.status === 'cleared' ? 'Settled' : 'Pending'}
                    </p>
                  </div>
                  <div className="text-right font-semibold">
                    {formatCurrency(split.amount_due)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Settle CTA (Only for members who owe money) */}
        {!isPayer && mySplit && mySplit.status === "pending" && (
          <div className="pt-6">
            <Button className="w-full h-12 text-base font-medium rounded-xl">
              Settle My Share ({formatCurrency(mySplit.amount_due)})
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-2">
              Phase 4 will implement the clearance flow.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
