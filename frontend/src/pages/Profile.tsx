import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Loader2, User, Phone, CreditCard, Mail, Zap, Check, AtSign, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/authStore";
import { authService } from "@/services/authService";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, setAuth, accessToken } = useAuthStore();

  const [name, setName] = useState(user?.name ?? "");
  const [mobile, setMobile] = useState(user?.mobile ?? "");
  const [upiId, setUpiId] = useState(user?.upi_id ?? "");

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar_url ?? null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const updates: { name?: string; mobile?: string; upi_id?: string } = {};
      if (name.trim() && name.trim() !== user?.name) updates.name = name.trim();
      if (mobile.trim() !== (user?.mobile ?? "")) updates.mobile = mobile.trim() || undefined;
      if (upiId.trim() !== (user?.upi_id ?? "")) updates.upi_id = upiId.trim() || undefined;

      if (Object.keys(updates).length === 0) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        return;
      }

      const updatedUser = await authService.updateProfile(updates);
      setAuth(updatedUser, accessToken!);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);

    setAvatarUploading(true);
    try {
      const updatedUser = await authService.uploadAvatar(file);
      setAuth(updatedUser, accessToken!);
      setAvatarPreview(updatedUser.avatar_url);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Avatar upload failed.");
      setAvatarPreview(user?.avatar_url ?? null);
    } finally {
      setAvatarUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Ambient blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-zettl-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -left-40 w-80 h-80 bg-purple-600/8 rounded-full blur-3xl" />
      </div>

      {/* Navbar */}
      <header className="border-b border-border/50 backdrop-blur-md sticky top-0 z-50 bg-background/80">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-3">
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

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Edit Profile</h1>
          <p className="text-sm text-muted-foreground mt-1">Update your personal details and payment info</p>
        </div>

        {/* Avatar section */}
        <div className="glass-card rounded-2xl p-6 flex flex-col items-center gap-4">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-zettl-500 to-purple-600 flex items-center justify-center shadow-lg shadow-zettl-500/20">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl font-bold text-white">
                  {user?.name?.[0]?.toUpperCase()}
                </span>
              )}
            </div>
            {/* Upload overlay */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarUploading}
              className={cn(
                "absolute inset-0 rounded-full flex items-center justify-center",
                "bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              )}
            >
              {avatarUploading ? (
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              ) : (
                <Camera className="w-6 h-6 text-white" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          <div className="text-center">
            <p className="font-semibold text-foreground">{user?.name}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={avatarUploading}
          >
            {avatarUploading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading…</>
            ) : (
              <><Camera className="w-4 h-4 mr-2" />Change Photo</>
            )}
          </Button>
        </div>

        {/* Profile form */}
        <form onSubmit={handleSave} className="glass-card rounded-2xl p-6 space-y-5">
          <h2 className="font-semibold text-foreground">Basic Details</h2>

          {/* Name */}
          <div className="space-y-1.5">
            <label htmlFor="profile-name" className="text-sm font-medium flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" /> Full Name
            </label>
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              className="bg-muted/50"
            />
          </div>

          {/* Username — read-only, permanent */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium flex items-center gap-2">
              <AtSign className="w-4 h-4 text-muted-foreground" /> Username
              <span className="ml-auto flex items-center gap-1 text-xs text-amber-400">
                <Lock className="w-3 h-3" /> Permanent
              </span>
            </label>
            <Input
              value={`@${user?.username ?? ""}`}
              disabled
              className="bg-muted/30 text-muted-foreground cursor-not-allowed font-mono"
            />
            <p className="text-xs text-amber-400/80">
              Username is permanent and cannot be changed once set.
            </p>
          </div>

          {/* Email (read-only) */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" /> Email
            </label>
            <Input
              value={user?.email ?? ""}
              disabled
              className="bg-muted/30 text-muted-foreground cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
          </div>

          {/* Mobile */}
          <div className="space-y-1.5">
            <label htmlFor="profile-mobile" className="text-sm font-medium flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" /> Mobile Number
            </label>
            <Input
              id="profile-mobile"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="+91 98765 43210"
              maxLength={15}
              className="bg-muted/50"
            />
          </div>

          {/* UPI ID */}
          <div className="space-y-1.5">
            <label htmlFor="profile-upi" className="text-sm font-medium flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-muted-foreground" /> UPI ID
            </label>
            <Input
              id="profile-upi"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="yourname@upi"
              className="bg-muted/50"
            />
            <p className="text-xs text-muted-foreground">Used for settlement suggestions in Charges.</p>
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <Button
            id="save-profile-btn"
            type="submit"
            className="w-full"
            disabled={saving}
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</>
            ) : saved ? (
              <><Check className="w-4 h-4 mr-2 text-green-400" />Saved!</>
            ) : (
              "Save Changes"
            )}
          </Button>
        </form>
      </main>
    </div>
  );
}
