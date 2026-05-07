import { formatCurrency } from "@/utils/formatCurrency";

import { Receipt, CheckCircle2, Clock, Image as ImageIcon, QrCode } from "lucide-react";
import type { Charge } from "@/types";
import { useAuthStore } from "@/store/authStore";

interface ChargeCardProps {
  charge: Charge;
  onClick: () => void;
}

export function ChargeCard({ charge, onClick }: ChargeCardProps) {
  const currentUser = useAuthStore((s) => s.user);

  // Determine user's status in this charge
  const isPayer = charge.payer_id === currentUser?.id;
  const mySplit = charge.splits.find((s) => s.user_id === currentUser?.id);

  let statusBadge = null;
  if (isPayer) {
    const pendingCount = charge.splits.filter(s => s.status === "pending").length;
    if (pendingCount === 0) {
      statusBadge = (
        <span className="flex items-center gap-1 text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">
          <CheckCircle2 className="w-3 h-3" /> Fully Settled
        </span>
      );
    } else {
      statusBadge = (
        <span className="flex items-center gap-1 text-xs font-medium text-amber-500 bg-amber-500/10 px-2 py-1 rounded-full">
          <Clock className="w-3 h-3" /> {pendingCount} Pending
        </span>
      );
    }
  } else if (mySplit) {
    if (mySplit.status === "cleared") {
      statusBadge = (
        <span className="flex items-center gap-1 text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">
          <CheckCircle2 className="w-3 h-3" /> Cleared
        </span>
      );
    } else {
      statusBadge = (
        <span className="flex items-center gap-1 text-xs font-medium text-amber-500 bg-amber-500/10 px-2 py-1 rounded-full">
          <Clock className="w-3 h-3" /> You owe {formatCurrency(mySplit.amount_due)}
        </span>
      );
    }
  } else {
    statusBadge = (
      <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full">
        Not involved
      </span>
    );
  }

  return (
    <div
      onClick={onClick}
      className="bg-card hover:bg-muted/50 transition-colors border border-border/50 rounded-2xl p-4 cursor-pointer flex flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{charge.title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Paid by <span className="font-medium text-foreground">{isPayer ? "You" : charge.payer_name}</span> on {new Date(charge.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-bold text-base">{formatCurrency(charge.total_amount)}</p>
          <div className="flex items-center justify-end gap-1 mt-0.5 text-xs text-muted-foreground">
            {charge.proof.type === "image" ? <ImageIcon className="w-3 h-3" /> : <QrCode className="w-3 h-3" />}
            <span>Proof attached</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-1 pt-3 border-t border-border/50">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Receipt className="w-3.5 h-3.5" />
          <span>Split {charge.split_type} with {charge.splits.length} {charge.splits.length === 1 ? "person" : "people"}</span>
        </div>
        {statusBadge}
      </div>
    </div>
  );
}
