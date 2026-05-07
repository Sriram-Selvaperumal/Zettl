import { useState, useEffect } from "react";
import type { CircleMemberResponse } from "@/types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { formatCurrency } from "@/utils/formatCurrency";

interface SplitFormProps {
  members: CircleMemberResponse[];
  currentUserId: string;
  totalAmount: number;
  onValidChange: (
    isValid: boolean,
    splitType: "equal" | "custom",
    selectedMembers: string[],
    customShares?: Record<string, number>
  ) => void;
}

export function SplitForm({ members, currentUserId, totalAmount, onValidChange }: SplitFormProps) {
  const [splitType, setSplitType] = useState<"equal" | "custom">("equal");
  
  // By default, everyone except the payer is selected.
  const [selectedMembers, setSelectedMembers] = useState<string[]>(() => {
    return members.filter(m => m.user_id !== currentUserId).map(m => m.user_id);
  });

  const [customShares, setCustomShares] = useState<Record<string, number>>({});

  const handleMemberToggle = (userId: string, checked: boolean) => {
    setSelectedMembers(prev => 
      checked ? [...prev, userId] : prev.filter(id => id !== userId)
    );
  };

  const handleCustomShareChange = (userId: string, value: string) => {
    const numValue = parseFloat(value);
    setCustomShares(prev => ({
      ...prev,
      [userId]: isNaN(numValue) ? 0 : numValue
    }));
  };

  // Validation & Emit
  useEffect(() => {
    if (selectedMembers.length === 0) {
      onValidChange(false, splitType, selectedMembers);
      return;
    }

    if (splitType === "equal") {
      onValidChange(true, "equal", selectedMembers);
    } else {
      const sum = selectedMembers.reduce((acc, id) => acc + (customShares[id] || 0), 0);
      // Valid if sum is within 1 penny of total
      const isValid = Math.abs(sum - totalAmount) < 0.01;
      onValidChange(isValid, "custom", selectedMembers, customShares);
    }
  }, [splitType, selectedMembers, customShares, totalAmount, onValidChange]);

  const customSum = selectedMembers.reduce((acc, id) => acc + (customShares[id] || 0), 0);
  const isCustomValid = Math.abs(customSum - totalAmount) < 0.01;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border border-border/50 p-4 rounded-xl">
        <div>
          <Label className="text-base font-medium">Split Type</Label>
          <p className="text-sm text-muted-foreground">
            {splitType === "equal" ? "Divide equally among members" : "Specify exact amounts"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Label className={splitType === "equal" ? "text-foreground" : "text-muted-foreground"}>Equal</Label>
          <Switch 
            checked={splitType === "custom"} 
            onCheckedChange={(checked: boolean) => setSplitType(checked ? "custom" : "equal")} 
          />
          <Label className={splitType === "custom" ? "text-foreground" : "text-muted-foreground"}>Custom</Label>
        </div>
      </div>

      {splitType === "custom" && (
        <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Allocated Amount</span>
            <span className={`text-sm font-bold ${isCustomValid ? 'text-emerald-500' : 'text-amber-500'}`}>
              {formatCurrency(customSum)} / {formatCurrency(totalAmount)}
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div 
              className={`h-full transition-all ${isCustomValid ? 'bg-emerald-500' : 'bg-amber-500'}`} 
              style={{ width: `${Math.min(100, (customSum / (totalAmount || 1)) * 100)}%` }}
            />
          </div>
          {!isCustomValid && totalAmount > 0 && (
            <p className="text-xs text-amber-500 mt-2 text-right">
              {customSum > totalAmount ? "Allocated too much!" : `₹${(totalAmount - customSum).toFixed(2)} remaining`}
            </p>
          )}
        </div>
      )}

      <div className="space-y-4">
        <Label>Select Members</Label>
        <div className="grid gap-3">
          {members.map(member => {
            const isSelected = selectedMembers.includes(member.user_id);
            const isMe = member.user_id === currentUserId;
            
            return (
              <div 
                key={member.user_id} 
                className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                  isSelected ? 'border-primary/50 bg-primary/5' : 'border-border/50 hover:bg-muted/30'
                }`}
              >
                <Checkbox 
                  id={`member-${member.user_id}`}
                  checked={isSelected}
                  onCheckedChange={(checked: boolean) => handleMemberToggle(member.user_id, !!checked)}
                />
                <div className="flex-1">
                  <Label htmlFor={`member-${member.user_id}`} className="cursor-pointer font-medium">
                    {member.name} {isMe && "(You)"}
                  </Label>
                </div>
                
                {splitType === "custom" && isSelected && (
                  <div className="w-24">
                    <Input 
                      type="number" 
                      step="0.01" 
                      min="0"
                      placeholder="0.00"
                      value={customShares[member.user_id] || ""}
                      onChange={(e) => handleMemberToggle(member.user_id, true) /* Ensure checked if typing */}
                      onInput={(e) => handleCustomShareChange(member.user_id, e.currentTarget.value)}
                      className="h-8 text-right"
                    />
                  </div>
                )}
                
                {splitType === "equal" && isSelected && totalAmount > 0 && (
                  <div className="text-sm font-medium text-muted-foreground">
                    ~ {formatCurrency(totalAmount / selectedMembers.length)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
