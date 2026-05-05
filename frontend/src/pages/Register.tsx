import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import {
  Loader2, Zap, Mail, Lock, User, KeyRound,
  AtSign, CheckCircle2, XCircle, AlertTriangle, ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRegister, useSendOtp } from "@/hooks/useAuth";
import { authService } from "@/services/authService";
import { cn } from "@/lib/utils";

const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(30, "Username must be under 30 characters")
      .regex(/^[a-z0-9_]+$/, "Only lowercase letters, numbers, and underscores")
      .refine((v) => !v.startsWith("_") && !v.endsWith("_"), {
        message: "Cannot start or end with an underscore",
      }),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

type UsernameState = "idle" | "checking" | "available" | "taken" | "invalid";

export default function Register() {
  const register_ = useRegister();
  const sendOtp_ = useSendOtp();

  const [step, setStep] = useState<"details" | "otp">("details");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");

  // Username availability state
  const [usernameState, setUsernameState] = useState<UsernameState>("idle");
  const [usernameDebounce, setUsernameDebounce] = useState<ReturnType<typeof setTimeout> | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
  });

  const usernameValue = watch("username");

  // Debounced username availability check
  const checkUsername = useCallback((value: string) => {
    if (usernameDebounce) clearTimeout(usernameDebounce);

    const trimmed = value?.trim().toLowerCase();
    if (!trimmed || trimmed.length < 3 || !/^[a-z0-9_]+$/.test(trimmed)) {
      setUsernameState("invalid");
      return;
    }

    setUsernameState("checking");
    const t = setTimeout(async () => {
      try {
        const result = await authService.checkUsername(trimmed);
        setUsernameState(result.available ? "available" : "taken");
      } catch {
        setUsernameState("idle");
      }
    }, 500);
    setUsernameDebounce(t);
  }, []);

  useEffect(() => {
    if (usernameValue !== undefined) checkUsername(usernameValue);
  }, [usernameValue]);

  const onDetailsSubmit = (data: RegisterForm) => {
    if (usernameState !== "available") return;
    sendOtp_.mutate(data.email, {
      onSuccess: () => setStep("otp"),
    });
  };

  const onOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setOtpError("OTP must be exactly 6 digits");
      return;
    }
    setOtpError("");
    const data = getValues();
    register_.mutate({
      name: data.name,
      username: data.username.toLowerCase(),
      email: data.email,
      password: data.password,
      otp,
    });
  };

  const usernameIcon = () => {
    if (usernameState === "checking") return <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />;
    if (usernameState === "available") return <CheckCircle2 className="w-4 h-4 text-green-400" />;
    if (usernameState === "taken") return <XCircle className="w-4 h-4 text-destructive" />;
    return null;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-zettl-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl animate-pulse delay-700" />
      </div>

      <div className="w-full max-w-md animate-fade-in relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-zettl-500 to-purple-600 mb-4 shadow-2xl shadow-zettl-500/30 animate-pulse-glow">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold gradient-text mb-1">Zettl</h1>
          <p className="text-muted-foreground text-sm">Split expenses. Keep friendships.</p>
        </div>

        {/* Glass card */}
        <div className="glass-card rounded-2xl p-8 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-foreground mb-1">
              {step === "details" ? "Create your account" : "Verify Email"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {step === "details"
                ? "Join thousands splitting smarter"
                : `We sent a code to ${getValues("email")}`}
            </p>
          </div>

          {register_.isSuccess && (
            <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
              Account created! Redirecting to login…
            </div>
          )}

          {sendOtp_.error && step === "details" && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {(sendOtp_.error as any)?.response?.data?.detail ?? "Failed to send OTP. Try again."}
            </div>
          )}

          {register_.error && step === "otp" && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {(register_.error as any)?.response?.data?.detail ?? "Verification failed. Try again."}
            </div>
          )}

          {step === "details" ? (
            <form onSubmit={handleSubmit(onDetailsSubmit)} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label htmlFor="reg-name" className="text-sm font-medium">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="reg-name"
                    placeholder="Arjun Sharma"
                    className={cn("pl-9 bg-muted/50", errors.name && "border-destructive")}
                    {...register("name")}
                  />
                </div>
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>

              {/* Username */}
              <div className="space-y-1.5">
                <label htmlFor="reg-username" className="text-sm font-medium flex items-center gap-2">
                  Username
                  <span className="text-xs text-amber-400 font-normal flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" /> Permanent — cannot be changed later
                  </span>
                </label>
                <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="reg-username"
                    placeholder="arjun_sharma"
                    className={cn(
                      "pl-9 pr-9 bg-muted/50",
                      errors.username && "border-destructive",
                      usernameState === "available" && "border-green-500/50",
                      usernameState === "taken" && "border-destructive",
                    )}
                    {...register("username")}
                    onChange={(e) => {
                      // Force lowercase as user types
                      e.target.value = e.target.value.toLowerCase();
                      register("username").onChange(e);
                    }}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">{usernameIcon()}</div>
                </div>
                {/* Status messages */}
                {usernameState === "available" && (
                  <p className="text-xs text-green-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> @{usernameValue?.toLowerCase()} is available
                  </p>
                )}
                {usernameState === "taken" && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> @{usernameValue?.toLowerCase()} is already taken
                  </p>
                )}
                {errors.username && usernameState !== "taken" && (
                  <p className="text-xs text-destructive">{errors.username.message}</p>
                )}
                {/* Permanent warning banner */}
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-300 leading-relaxed">
                    Your username is <strong>permanent</strong> and cannot be changed after registration. Choose wisely — it's how friends will find you on Zettl.
                  </p>
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="reg-email" className="text-sm font-medium">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="reg-email"
                    type="email"
                    placeholder="arjun@example.com"
                    className={cn("pl-9 bg-muted/50", errors.email && "border-destructive")}
                    {...register("email")}
                  />
                </div>
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label htmlFor="reg-password" className="text-sm font-medium">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="reg-password"
                    type="password"
                    placeholder="Min. 8 characters"
                    className={cn("pl-9 bg-muted/50", errors.password && "border-destructive")}
                    {...register("password")}
                  />
                </div>
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label htmlFor="reg-confirm" className="text-sm font-medium">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="reg-confirm"
                    type="password"
                    placeholder="••••••••"
                    className={cn("pl-9 bg-muted/50", errors.confirmPassword && "border-destructive")}
                    {...register("confirmPassword")}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
                )}
              </div>

              <Button
                id="register-submit"
                type="submit"
                className="w-full"
                size="lg"
                disabled={sendOtp_.isPending || usernameState !== "available"}
              >
                {sendOtp_.isPending ? (
                  <><Loader2 className="animate-spin mr-2" />Sending Code…</>
                ) : (
                  "Send Verification Code"
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={onOtpSubmit} className="space-y-4 animate-fade-in">
              <div className="space-y-1.5">
                <label htmlFor="otp-input" className="text-sm font-medium">6-Digit OTP</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="otp-input"
                    type="text"
                    maxLength={6}
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    className={cn(
                      "pl-9 bg-muted/50 text-center tracking-widest font-mono text-lg",
                      otpError && "border-destructive"
                    )}
                  />
                </div>
                {otpError && <p className="text-xs text-destructive">{otpError}</p>}
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setStep("details")}
                  disabled={register_.isPending}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={register_.isPending || otp.length !== 6}
                >
                  {register_.isPending ? (
                    <><Loader2 className="animate-spin mr-2" />Verifying…</>
                  ) : (
                    "Verify & Register"
                  )}
                </Button>
              </div>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-primary font-medium hover:underline underline-offset-4 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
