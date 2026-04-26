import { Zap } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center animate-fade-in">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-zettl-500 to-purple-600 mb-4 shadow-xl">
          <Zap className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold gradient-text mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Phase 2 — coming next</p>
      </div>
    </div>
  );
}
