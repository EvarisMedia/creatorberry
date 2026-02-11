import { cn } from "@/lib/utils";

interface PMFScoreGaugeProps {
  label: string;
  score: number;
  size?: "sm" | "md";
}

const getScoreColor = (score: number) => {
  if (score >= 80) return "text-green-500";
  if (score >= 60) return "text-yellow-500";
  if (score >= 40) return "text-orange-500";
  return "text-red-500";
};

const getBarColor = (score: number) => {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-yellow-500";
  if (score >= 40) return "bg-orange-500";
  return "bg-red-500";
};

export const PMFScoreGauge = ({ label, score, size = "sm" }: PMFScoreGaugeProps) => {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className={cn("text-muted-foreground", size === "sm" ? "text-xs" : "text-sm")}>
          {label}
        </span>
        <span className={cn("font-semibold", getScoreColor(score), size === "sm" ? "text-xs" : "text-sm")}>
          {score}
        </span>
      </div>
      <div className={cn("w-full rounded-full bg-muted", size === "sm" ? "h-1.5" : "h-2")}>
        <div
          className={cn("rounded-full transition-all duration-500", getBarColor(score), size === "sm" ? "h-1.5" : "h-2")}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
};
