import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Trash2, Eye, Clock } from "lucide-react";
import { ProductOutline } from "@/hooks/useProductOutlines";
import { formatDistanceToNow } from "date-fns";

interface OutlineCardProps {
  outline: ProductOutline;
  onView: (id: string) => void;
  onDelete: (id: string) => void;
}

const OutlineCard = ({ outline, onView, onDelete }: OutlineCardProps) => {
  const sectionCount = outline.structure?.sections?.length || 0;

  return (
    <Card className="group hover:shadow-md transition-all">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{outline.title}</CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <Clock className="w-3 h-3" />
              {formatDistanceToNow(new Date(outline.created_at), { addSuffix: true })}
            </CardDescription>
          </div>
          <Badge variant={outline.status === "draft" ? "secondary" : "default"}>
            {outline.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1">
            <BookOpen className="w-4 h-4" />
            <span>{sectionCount} sections</span>
          </div>
          {outline.total_word_count > 0 && (
            <span>{outline.total_word_count.toLocaleString()} words target</span>
          )}
        </div>

        {/* Section Preview */}
        {outline.structure?.sections?.slice(0, 3).map((s: any, i: number) => (
          <div key={i} className="flex items-center gap-2 text-sm mb-1.5">
            <span className="text-muted-foreground font-mono text-xs w-5">{i + 1}.</span>
            <span className="truncate">{s.title}</span>
          </div>
        ))}
        {sectionCount > 3 && (
          <p className="text-xs text-muted-foreground mt-1">+{sectionCount - 3} more sections</p>
        )}

        <div className="flex gap-2 mt-4 pt-4 border-t border-border">
          <Button size="sm" className="flex-1" onClick={() => onView(outline.id)}>
            <Eye className="w-3 h-3 mr-1" /> View & Edit
          </Button>
          <Button size="sm" variant="outline" onClick={() => onDelete(outline.id)}>
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default OutlineCard;
