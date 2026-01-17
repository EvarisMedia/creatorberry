import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Pencil, Trash2, FileText } from "lucide-react";
import { TrainingItem } from "@/hooks/useTrainingLibrary";

interface TrainingItemCardProps {
  item: TrainingItem;
  onEdit: (item: TrainingItem) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
}

const categoryColors: Record<string, string> = {
  hook: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  example_post: "bg-green-500/10 text-green-500 border-green-500/20",
  guideline: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  framework: "bg-orange-500/10 text-orange-500 border-orange-500/20",
};

const categoryLabels: Record<string, string> = {
  hook: "Hook",
  example_post: "Example Post",
  guideline: "Guideline",
  framework: "Framework",
};

export function TrainingItemCard({
  item,
  onEdit,
  onDelete,
  onToggleActive,
}: TrainingItemCardProps) {
  return (
    <Card className={`transition-opacity ${!item.is_active ? "opacity-50" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge
                variant="outline"
                className={categoryColors[item.category] || ""}
              >
                {categoryLabels[item.category] || item.category}
              </Badge>
              {item.subcategory && (
                <Badge variant="secondary" className="text-xs">
                  {item.subcategory}
                </Badge>
              )}
              {item.source_file && (
                <Badge variant="outline" className="text-xs gap-1">
                  <FileText className="h-3 w-3" />
                  {item.source_file}
                </Badge>
              )}
            </div>
            <h4 className="font-medium text-sm mb-1 truncate">{item.title}</h4>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {item.content}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Switch
              checked={item.is_active}
              onCheckedChange={(checked) => onToggleActive(item.id, checked)}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(item)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(item.id)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
