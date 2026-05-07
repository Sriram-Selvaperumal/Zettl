import { useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, Image as ImageIcon, Loader2, QrCode, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";
import { useCircleDetail } from "@/hooks/useCircles";
import { useCreateCharge } from "@/hooks/useCharges";
import { SplitForm } from "@/components/app/SplitForm";

const formSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters").max(50),
  description: z.string().max(200).optional(),
  total_amount: z.coerce.number().positive("Amount must be greater than 0"),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewCharge() {
  const { id: circleId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const currentUser = useAuthStore((s) => s.user);

  const { data: circle, isLoading: circleLoading } = useCircleDetail(circleId!);
  const createCharge = useCreateCharge(circleId!);

  // Form State
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      title: "",
      description: "",
      total_amount: 0,
    }
  });
  
  const totalAmount = watch("total_amount") || 0;

  // Proof State
  const [proofType, setProofType] = useState<"image" | "upi">("image");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofUpiRef, setProofUpiRef] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Split State
  const [isSplitValid, setIsSplitValid] = useState(false);
  const [splitData, setSplitData] = useState<{
    splitType: "equal" | "custom",
    selectedMembers: string[],
    customShares?: Record<string, number>
  }>({
    splitType: "equal",
    selectedMembers: [],
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    if (!isSplitValid) {
      toast({ title: "Invalid Split", description: "Please ensure the split is configured correctly.", variant: "destructive" });
      return;
    }

    if (proofType === "image" && !proofFile) {
      toast({ title: "Missing Proof", description: "Please upload a receipt image.", variant: "destructive" });
      return;
    }

    if (proofType === "upi" && !proofUpiRef.trim()) {
      toast({ title: "Missing UPI Ref", description: "Please provide the UPI reference number.", variant: "destructive" });
      return;
    }

    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("description", data.description || "");
    formData.append("total_amount", data.total_amount.toString());
    formData.append("split_type", splitData.splitType);
    formData.append("member_ids", JSON.stringify(splitData.selectedMembers));
    
    if (splitData.splitType === "custom" && splitData.customShares) {
      formData.append("custom_shares", JSON.stringify(splitData.customShares));
    }

    formData.append("proof_type", proofType);
    if (proofType === "image" && proofFile) {
      formData.append("proof_file", proofFile);
    } else if (proofType === "upi") {
      formData.append("proof_upi_ref", proofUpiRef);
    }

    createCharge.mutate(formData, {
      onSuccess: () => {
        toast({ title: "Charge Created", description: "Expense logged successfully!" });
        navigate(`/circle/${circleId}`);
      },
      onError: (err: any) => {
        toast({ 
          title: "Error", 
          description: err.response?.data?.detail || "Failed to create charge", 
          variant: "destructive" 
        });
      }
    });
  };

  if (circleLoading) return <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></div>;
  if (!circle || !currentUser) return (
    <div className="p-8 text-center">
      <p className="text-muted-foreground">Error loading circle or you are not authorized.</p>
      <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>Go Back</Button>
    </div>
  );

  return (
    <div className="max-w-xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add Expense</h1>
          <p className="text-sm text-muted-foreground">in {circle.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        
        {/* Step 1: Details */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">1. Details</h2>
          
          <div className="space-y-2">
            <Label>Title</Label>
            <Input {...register("title")} placeholder="e.g. Dinner at CCD" className="h-12 bg-muted/50 border-border/50 focus-visible:ring-primary/20 text-base" />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Amount (₹)</Label>
            <Input {...register("total_amount")} type="number" step="0.01" placeholder="0.00" className="h-14 bg-muted/50 border-border/50 focus-visible:ring-primary/20 text-xl font-bold font-mono" />
            {errors.total_amount && <p className="text-xs text-destructive">{errors.total_amount.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Description (Optional)</Label>
            <Textarea {...register("description")} placeholder="Add a note..." className="bg-muted/50 border-border/50 focus-visible:ring-primary/20 resize-none" />
          </div>
        </div>

        {/* Step 2: Proof */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">2. Proof of Payment</h2>
          <Tabs value={proofType} onValueChange={(v: string) => setProofType(v as "image" | "upi")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="image" className="flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Receipt Image</TabsTrigger>
              <TabsTrigger value="upi" className="flex items-center gap-2"><QrCode className="w-4 h-4" /> UPI Ref</TabsTrigger>
            </TabsList>
            <TabsContent value="image" className="mt-4">
              <div 
                className="border-2 border-dashed border-border/50 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setProofFile(file);
                  }}
                />
                {proofFile ? (
                  <div className="space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                    <p className="font-medium">{proofFile.name}</p>
                    <p className="text-xs text-muted-foreground">Click to change</p>
                  </div>
                ) : (
                  <div className="space-y-2 text-muted-foreground">
                    <ImageIcon className="w-8 h-8 mx-auto opacity-50" />
                    <p className="font-medium text-foreground">Upload Receipt</p>
                    <p className="text-xs">JPG, PNG up to 5MB</p>
                  </div>
                )}
              </div>
            </TabsContent>
            <TabsContent value="upi" className="mt-4 space-y-2">
              <Label>UPI Transaction Reference Number</Label>
              <Input 
                placeholder="e.g. 123456789012" 
                value={proofUpiRef} 
                onChange={(e) => setProofUpiRef(e.target.value)} 
                className="h-12 bg-muted/50 font-mono"
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Step 3: Split */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">3. Split</h2>
          <SplitForm 
            members={circle.members} 
            currentUserId={currentUser.id} 
            totalAmount={totalAmount} 
            onValidChange={(isValid, splitType, selectedMembers, customShares) => {
              setIsSplitValid(isValid);
              setSplitData({ splitType, selectedMembers, customShares });
            }}
          />
        </div>

        <Button 
          type="submit" 
          className="w-full h-12 text-base font-medium rounded-xl"
          disabled={createCharge.isPending}
        >
          {createCharge.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Expense"}
        </Button>
      </form>
    </div>
  );
}
