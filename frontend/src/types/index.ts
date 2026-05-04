// ─── Core Domain Types ────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  mobile: string | null;
  upi_id: string | null;
  created_at: string;
}

// ─── Circle Types ─────────────────────────────────────────────────────────────

export type CircleRole = "admin" | "member";

export interface CircleMemberResponse {
  user_id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  role: CircleRole;
  joined_at: string;
}

// List view (from GET /circles/)
export interface Circle {
  id: string;
  name: string;
  description: string;
  invite_code: string;
  member_count: number;
  your_role: CircleRole;
  created_at: string;
}

// Detail view (from GET /circles/:id)
export interface CircleDetail {
  id: string;
  name: string;
  description: string;
  invite_code: string;
  created_at: string;
  members: CircleMemberResponse[];
}

export interface NetBalance {
  user_id: string;
  user_name: string;
  avatar_url: string | null;
  net_amount: number; // positive = owed to them, negative = they owe others
}

// ─── Charge Types ─────────────────────────────────────────────────────────────

export type SplitType = "equal" | "custom";
export type ProofType = "image" | "upi";
export type SplitStatus = "pending" | "cleared";

export interface Proof {
  type: ProofType;
  url: string | null;
  upi_ref: string | null;
}

export interface SplitEntry {
  user_id: string;
  user_name?: string;
  amount_due: number;
  status: SplitStatus;
}

export interface Charge {
  id: string;
  circle_id: string;
  title: string;
  description: string;
  payer_id: string;
  payer_name?: string;
  total_amount: number;
  split_type: SplitType;
  proof: Proof;
  splits: SplitEntry[];
  created_at: string;
}

// ─── Clearance Types ──────────────────────────────────────────────────────────

export type ClearanceMethod = "upi" | "manual";
export type ClearanceStatus = "pending_confirmation" | "confirmed";

export interface Clearance {
  id: string;
  charge_id: string;
  from_user_id: string;
  from_user_name?: string;
  to_user_id: string;
  to_user_name?: string;
  amount: number;
  method: ClearanceMethod;
  upi_ref: string | null;
  proof_url: string | null;
  status: ClearanceStatus;
  confirmed_at: string | null;
  created_at: string;
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface ApiError {
  detail: string;
  code?: string;
}

// ─── Form Types ───────────────────────────────────────────────────────────────

export interface CreateCircleForm {
  name: string;
  description: string;
}

export interface JoinCircleForm {
  invite_code: string;
}

export interface CreateChargeForm {
  title: string;
  description: string;
  total_amount: number;
  split_type: SplitType;
  proof_type: ProofType;
  upi_ref?: string;
  proof_image?: File;
  member_ids: string[];
  custom_shares?: Record<string, number>;
}

export interface CreateClearanceForm {
  method: ClearanceMethod;
  upi_ref?: string;
  proof_image?: File;
}
