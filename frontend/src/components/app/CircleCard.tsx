import { useNavigate } from "react-router-dom";
import { Users, Crown } from "lucide-react";
import type { Circle } from "@/types";
import { cn } from "@/lib/utils";

interface CircleCardProps {
  circle: Circle;
}

export function CircleCard({ circle }: CircleCardProps) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/circle/${circle.id}`)}
      className={cn(
        "glass-card rounded-2xl p-6 cursor-pointer group",
        "hover:border-zettl-500/50 hover:shadow-lg hover:shadow-zettl-500/10",
        "transition-all duration-300"
      )}
    >
      {/* Header row */}
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-zettl-500 to-purple-600 flex items-center justify-center shadow-lg shadow-zettl-500/20 group-hover:scale-110 transition-transform duration-300">
          <Users className="w-6 h-6 text-white" />
        </div>
        <span
          className={cn(
            "text-xs font-semibold px-2.5 py-1 rounded-full",
            circle.your_role === "admin"
              ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
              : "bg-zettl-500/15 text-zettl-400 border border-zettl-500/30"
          )}
        >
          {circle.your_role === "admin" ? (
            <span className="flex items-center gap-1">
              <Crown className="w-3 h-3" /> Admin
            </span>
          ) : (
            "Member"
          )}
        </span>
      </div>

      {/* Circle name & desc */}
      <h3 className="font-semibold text-foreground text-lg mb-1 group-hover:text-zettl-400 transition-colors">
        {circle.name}
      </h3>
      {circle.description && (
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {circle.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center gap-2 mt-auto">
        <Users className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          {circle.member_count} {circle.member_count === 1 ? "member" : "members"}
        </span>
      </div>
    </div>
  );
}
