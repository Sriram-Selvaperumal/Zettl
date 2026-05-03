import { useState } from "react";
import { Zap, Plus, LogIn, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CircleCard } from "@/components/app/CircleCard";
import { useMyCircles, useCreateCircle, useJoinCircle } from "@/hooks/useCircles";
import { useAuthStore } from "@/store/authStore";

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const { data: circles, isLoading } = useMyCircles();
  const createCircle = useCreateCircle();
  const joinCircle = useJoinCircle();

  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  const [createName, setCreateName] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) return;
    createCircle.mutate(
      { name: createName.trim(), description: createDesc.trim() },
      {
        onSuccess: () => {
          setShowCreate(false);
          setCreateName("");
          setCreateDesc("");
        },
      }
    );
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    joinCircle.mutate(inviteCode.trim(), {
      onSuccess: () => {
        setShowJoin(false);
        setInviteCode("");
      },
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Ambient blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-zettl-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-purple-600/8 rounded-full blur-3xl" />
      </div>

      {/* Navbar */}
      <header className="border-b border-border/50 backdrop-blur-md sticky top-0 z-50 bg-background/80">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-zettl-500 to-purple-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg gradient-text">Zettl</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">
              Hey, {user?.name?.split(" ")[0]} 👋
            </span>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zettl-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
              {user?.name?.[0]?.toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Your Circles</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage your friend groups and shared expenses
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              id="join-circle-btn"
              variant="outline"
              size="sm"
              onClick={() => { setShowJoin(!showJoin); setShowCreate(false); }}
            >
              <LogIn className="w-4 h-4 mr-1.5" />
              Join
            </Button>
            <Button
              id="create-circle-btn"
              size="sm"
              onClick={() => { setShowCreate(!showCreate); setShowJoin(false); }}
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Create
            </Button>
          </div>
        </div>

        {/* Inline Create Form */}
        {showCreate && (
          <div className="glass-card rounded-2xl p-6 mb-6 border border-zettl-500/30 animate-fade-in">
            <h3 className="font-semibold mb-4 text-foreground">Create a new Circle</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <Input
                id="circle-name-input"
                placeholder="Circle name (e.g. BITS Hostel G7)"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                className="bg-muted/50"
                required
              />
              <Input
                id="circle-desc-input"
                placeholder="Description (optional)"
                value={createDesc}
                onChange={(e) => setCreateDesc(e.target.value)}
                className="bg-muted/50"
              />
              {createCircle.error && (
                <p className="text-xs text-destructive">
                  {(createCircle.error as any)?.response?.data?.detail ?? "Something went wrong"}
                </p>
              )}
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={createCircle.isPending}>
                  {createCircle.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Circle"}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Inline Join Form */}
        {showJoin && (
          <div className="glass-card rounded-2xl p-6 mb-6 border border-purple-500/30 animate-fade-in">
            <h3 className="font-semibold mb-4 text-foreground">Join a Circle</h3>
            <form onSubmit={handleJoin} className="space-y-3">
              <Input
                id="invite-code-input"
                placeholder="Enter invite code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="bg-muted/50 font-mono tracking-wider"
                required
              />
              {joinCircle.error && (
                <p className="text-xs text-destructive">
                  {(joinCircle.error as any)?.response?.data?.detail ?? "Invalid invite code"}
                </p>
              )}
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowJoin(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={joinCircle.isPending}>
                  {joinCircle.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Join Circle"}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Circles grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card rounded-2xl p-6 animate-pulse h-40" />
            ))}
          </div>
        ) : circles && circles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {circles.map((circle) => (
              <CircleCard key={circle.id} circle={circle} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-2xl bg-muted mx-auto flex items-center justify-center mb-4">
              <Users className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">No circles yet</h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
              Create a circle to start splitting expenses with your friends.
            </p>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create your first Circle
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
