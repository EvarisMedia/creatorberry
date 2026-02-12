import { ProductIdea } from "@/hooks/useProductIdeas";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PMFScoreGauge } from "./PMFScoreGauge";
import {
  BookOpen,
  GraduationCap,
  FolderOpen,
  ClipboardList,
  Users,
  Newspaper,
  Printer,
  Headphones,
  Video,
  Lightbulb,
  ArrowRight,
  Trash2,
  Bookmark,
  BookmarkCheck,
  X,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const formatIcons: Record<string, any> = {
  ebook: BookOpen,
  course: GraduationCap,
  templates: FolderOpen,
  workbook: ClipboardList,
  coaching: Users,
  membership: Users,
  newsletter: Newspaper,
  printables: Printer,
  audio_course: Headphones,
  video_course: Video,
};

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  new: { label: "New", variant: "secondary" },
  saved: { label: "Saved", variant: "default" },
  in_progress: { label: "In Progress", variant: "outline" },
  completed: { label: "Completed", variant: "default" },
  dismissed: { label: "Dismissed", variant: "destructive" },
};

interface ProductIdeaCardProps {
  idea: ProductIdea;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
  onStartBuilding?: (idea: ProductIdea) => void;
  isBuildingId?: string | null;
}

export const ProductIdeaCard = ({ idea, onStatusChange, onDelete, onStartBuilding, isBuildingId }: ProductIdeaCardProps) => {
  const Icon = formatIcons[idea.format] || Lightbulb;
  const pmf = idea.pmf_score;
  const status = statusConfig[idea.status] || statusConfig.new;

  const getCombinedScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500 border-green-500/30 bg-green-500/10";
    if (score >= 60) return "text-yellow-500 border-yellow-500/30 bg-yellow-500/10";
    if (score >= 40) return "text-orange-500 border-orange-500/30 bg-orange-500/10";
    return "text-red-500 border-red-500/30 bg-red-500/10";
  };

  return (
    <Card className="group hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <Badge variant={status.variant} className="text-[10px]">
                {status.label}
              </Badge>
              <p className="text-xs text-muted-foreground capitalize mt-0.5">{idea.format.replace(/_/g, " ")}</p>
            </div>
          </div>

          {/* Combined PMF Score */}
          {pmf && (
            <div className={`w-12 h-12 rounded-xl border-2 flex flex-col items-center justify-center ${getCombinedScoreColor(pmf.combined_score)}`}>
              <span className="text-lg font-bold leading-none">{pmf.combined_score}</span>
              <span className="text-[8px] uppercase font-medium opacity-70">PMF</span>
            </div>
          )}
        </div>

        <h3 className="font-semibold text-foreground mb-1.5 line-clamp-2">{idea.title}</h3>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-3">{idea.description}</p>

        {idea.target_audience && (
          <p className="text-xs text-muted-foreground mb-3">
            <span className="font-medium">Audience:</span> {idea.target_audience}
          </p>
        )}

        {/* PMF Score Breakdown */}
        {pmf && (
          <div className="space-y-2 mb-4 p-3 rounded-lg bg-muted/50">
            <PMFScoreGauge label="Demand" score={pmf.demand_score} />
            <PMFScoreGauge label="Fit" score={pmf.fit_score} />
            <PMFScoreGauge label="Gap" score={pmf.gap_score} />
            <PMFScoreGauge label="Urgency" score={pmf.urgency_score} />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-border/50">
          {idea.status === "new" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onStatusChange(idea.id, "saved")}
              className="text-primary hover:text-primary hover:bg-primary/10"
            >
              <Bookmark className="w-4 h-4 mr-1" />
              Save
            </Button>
          )}
          {(idea.status === "saved" || idea.status === "new") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onStartBuilding?.(idea)}
              disabled={isBuildingId === idea.id}
              className="text-primary hover:text-primary hover:bg-primary/10"
            >
              {isBuildingId === idea.id ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Building...
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4 mr-1" />
                  Start Building
                </>
              )}
            </Button>
          )}
          {idea.status !== "dismissed" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onStatusChange(idea.id, "dismissed")}
              className="text-muted-foreground hover:text-muted-foreground"
            >
              <X className="w-4 h-4 mr-1" />
              Dismiss
            </Button>
          )}
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(idea.id)}
            className="text-muted-foreground hover:text-destructive h-8 w-8"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
