import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Receipt, Upload, IndianRupee, Users, CheckCircle2, AlertCircle } from "lucide-react";
import { useCircleDetail } from "@/hooks/useCircles";
import { useCreateCharge } from "@/hooks/useCharges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import api from "@/services/api";

type ProofType = "upi" | "image";
type SplitType = "equal" | "custom";

export default function NewCharge() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);

  const { data: circle, isLoading: circleLoading } = useCircleDetail(id!);
  const createCharge = useCreateCharge(id!);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amountStr, setAmountStr] = useState("");
  
  const [proofType, setProofType] = useState<ProofType>("upi");
  const [upiRef, setUpiRef] = useState("");
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [splitType, setSplitType] = useState<SplitType>("equal");
  
  // Equal split selections
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  
  // Custom split values
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});

  const totalAmount = parseFloat(amountStr) || 0;

  // Initialize selected members when circle loads
  useMemo(() => {
    if (circle && selectedMembers.size === 0) {
      setSelectedMembers(new Set(circle.members.map(m => m.user_id)));
    }
  }, [circle]);

  const customTotal = useMemo(() => {
    return Object.values(customSplits).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  }, [customSplits]);

  const handleEqualToggle = (userId: string) => {
    const next = new Set(selectedMembers);
    if (next.has(userId)) {
      next.delete(userId);
    } else {
      next.add(userId);
    }
    setSelectedMembers(next);
  };

  const handleCustomChange = (userId: string, val: string) => {
    setCustomSplits(prev => ({ ...prev, [userId]: val }));
  };

  const uploadProofImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await api.post<{ url: string }>(`/circles/${id}/upload-proof`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || totalAmount <= 0) return;

    if (splitType === "equal" && selectedMembers.size === 0) {
      alert("Please select at least one member to split the cost with.");
      return;
    }

    if (splitType === "custom" && Math.abs(customTotal - totalAmount) > 0.05) {
      alert(`Custom splits (₹${customTotal}) must equal total amount (₹${totalAmount}).`);
      return;
    }

    try {
      setIsUploading(true);
      let proofUrl = null;
      if (proofType === "image" && proofImage) {
        proofUrl = await uploadProofImage(proofImage);
      }

      await createCharge.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        total_amount: totalAmount,
        split_type: splitType,
        proof: {
          type: proofType,
          url: proofUrl,
          upi_ref: proofType === "upi" ? upiRef.trim() : null,
        },
        involved_user_ids: splitType === "equal" ? Array.from(selectedMembers) : undefined,
        custom_splits: splitType === "custom" ? Object.fromEntries(
          Object.entries(customSplits).map(([k, v]) => [k, parseFloat(v) || 0])
        ) : undefined,
      });

      navigate(`/circle/${id}`);
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Failed to create charge");
    } finally {
      setIsUploading(false);
    }
  };

  if (circleLoading) return <div className="min-h-screen bg-background" />;
  if (!circle) return <div className="min-h-screen bg-background flex items-center justify-center">Circle not found</div>;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Navbar */}
      <header className="border-b border-border/50 backdrop-blur-md sticky top-0 z-50 bg-background/80">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-3">
          <button
            onClick={() => navigate(`/circle/${id}`)}
            className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" />
            <span className="font-bold text-lg text-foreground">Add New Charge</span>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Basics */}
          <div className="space-y-5">
            <div>
              <Label>What was this for?</Label>
              <Input 
                autoFocus
                placeholder="e.g. Dinner at Absolute Barbecues" 
                value={title} 
                onChange={e => setTitle(e.target.value)}
                className="mt-1.5 bg-muted/30 border-border/50 text-lg py-6"
                required
              />
            </div>
            
            <div>
              <Label>Total Amount</Label>
              <div className="relative mt-1.5">
                <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input 
                  type="number"
                  step="0.01"
                  min="1"
                  placeholder="0.00" 
                  value={amountStr} 
                  onChange={e => setAmountStr(e.target.value)}
                  className="pl-12 bg-muted/30 border-border/50 text-2xl font-semibold py-7"
                  required
                />
              </div>
            </div>

            <div>
              <Label>Notes (Optional)</Label>
              <Textarea 
                placeholder="Any extra details..." 
                value={description} 
                onChange={e => setDescription(e.target.value)}
                className="mt-1.5 bg-muted/30 border-border/50 resize-none h-20"
              />
            </div>
          </div>

          {/* Proof */}
          <div className="glass-card rounded-2xl p-5 border border-border/50 space-y-4">
            <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider">Proof of Payment</h3>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={proofType === "upi" ? "default" : "outline"}
                className={cn("flex-1", proofType === "upi" && "bg-primary text-primary-foreground")}
                onClick={() => setProofType("upi")}
              >
                UPI Ref
              </Button>
              <Button
                type="button"
                variant={proofType === "image" ? "default" : "outline"}
                className={cn("flex-1", proofType === "image" && "bg-primary text-primary-foreground")}
                onClick={() => setProofType("image")}
              >
                Receipt Image
              </Button>
            </div>

            {proofType === "upi" ? (
              <Input 
                placeholder="UPI Transaction ID (e.g. 3019283719)" 
                value={upiRef}
                onChange={e => setUpiRef(e.target.value)}
                className="bg-background"
                required
              />
            ) : (
              <div className="relative">
                <Input 
                  type="file" 
                  accept="image/*"
                  onChange={e => setProofImage(e.target.files?.[0] || null)}
                  className="bg-background file:text-primary file:font-medium"
                  required
                />
              </div>
            )}
          </div>

          {/* Split Rules */}
          {totalAmount > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider">Split Details</h3>
              <div className="flex bg-muted/50 p-1 rounded-xl">
                <button
                  type="button"
                  className={cn(
                    "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                    splitType === "equal" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => setSplitType("equal")}
                >
                  Split Equally
                </button>
                <button
                  type="button"
                  className={cn(
                    "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                    splitType === "custom" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => setSplitType("custom")}
                >
                  Custom Amounts
                </button>
              </div>

              <div className="bg-muted/20 border border-border/50 rounded-2xl divide-y divide-border/50 overflow-hidden">
                {circle.members.map(member => {
                  const isMe = member.user_id === currentUser?.id;
                  const isSelected = selectedMembers.has(member.user_id);
                  const equalShare = selectedMembers.size > 0 ? (totalAmount / selectedMembers.size) : 0;
                  
                  return (
                    <div key={member.user_id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-zettl-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                          {member.name[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {member.name} {isMe && <span className="text-muted-foreground font-normal">(you)</span>}
                          </p>
                        </div>
                      </div>

                      {splitType === "equal" ? (
                        <div className="flex items-center gap-4">
                          <span className={cn("text-sm font-medium", isSelected ? "text-foreground" : "text-muted-foreground/40")}>
                            ₹{isSelected ? equalShare.toFixed(2) : "0.00"}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleEqualToggle(member.user_id)}
                            className={cn(
                              "w-6 h-6 rounded-md flex items-center justify-center transition-colors",
                              isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground border border-border"
                            )}
                          >
                            {isSelected && <CheckCircle2 className="w-4 h-4" />}
                          </button>
                        </div>
                      ) : (
                        <div className="w-28 relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                          <Input 
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={customSplits[member.user_id] || ""}
                            onChange={(e) => handleCustomChange(member.user_id, e.target.value)}
                            className="pl-7 h-9 text-right"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {splitType === "custom" && (
                <div className={cn(
                  "p-4 rounded-xl flex items-center justify-between font-medium text-sm",
                  Math.abs(customTotal - totalAmount) > 0.05 ? "bg-destructive/10 text-destructive" : "bg-green-500/10 text-green-500"
                )}>
                  <span>Total Split Amount:</span>
                  <div className="flex items-center gap-2">
                    {Math.abs(customTotal - totalAmount) > 0.05 && <AlertCircle className="w-4 h-4" />}
                    <span>₹{customTotal.toFixed(2)} / ₹{totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full py-6 text-lg rounded-xl shadow-lg shadow-primary/25"
            disabled={
              !title.trim() || 
              totalAmount <= 0 || 
              isUploading || 
              createCharge.isPending ||
              (splitType === "custom" && Math.abs(customTotal - totalAmount) > 0.05)
            }
          >
            {isUploading || createCharge.isPending ? "Processing..." : "Create Charge"}
          </Button>
        </form>
      </main>
    </div>
  );
}
