import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { GripVertical, ChevronDown, ChevronRight, Pencil, Check, X, BookOpen } from "lucide-react";
import { OutlineSection } from "@/hooks/useProductOutlines";

interface OutlineSectionCardProps {
  section: OutlineSection;
  index: number;
  onUpdate: (sectionId: string, updates: Partial<OutlineSection>) => Promise<boolean>;
  dragHandleProps?: any;
}

const OutlineSectionCard = ({ section, index, onUpdate, dragHandleProps }: OutlineSectionCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(section.title);
  const [editDescription, setEditDescription] = useState(section.description || "");
  const [editWordCount, setEditWordCount] = useState(section.word_count_target);

  const handleSave = async () => {
    const success = await onUpdate(section.id, {
      title: editTitle,
      description: editDescription,
      word_count_target: editWordCount,
    });
    if (success) setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(section.title);
    setEditDescription(section.description || "");
    setEditWordCount(section.word_count_target);
    setIsEditing(false);
  };

  const subsections = Array.isArray(section.subsections) ? section.subsections : [];

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-start gap-2 p-4">
          {/* Drag Handle */}
          <div className="pt-1 cursor-grab text-muted-foreground hover:text-foreground" {...dragHandleProps}>
            <GripVertical className="w-4 h-4" />
          </div>

          {/* Section Number */}
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-semibold text-primary">{index + 1}</span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="space-y-3">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="font-medium"
                />
                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Section description..."
                  rows={2}
                />
                <div className="flex items-center gap-2">
                  <label className="text-sm text-muted-foreground">Word target:</label>
                  <Input
                    type="number"
                    value={editWordCount}
                    onChange={(e) => setEditWordCount(parseInt(e.target.value) || 500)}
                    className="w-24"
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSave}>
                    <Check className="w-3 h-3 mr-1" /> Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancel}>
                    <X className="w-3 h-3 mr-1" /> Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  <h3 className="font-medium truncate">{section.title}</h3>
                  <Button size="sm" variant="ghost" className="h-6 px-2" onClick={() => setIsEditing(true)}>
                    <Pencil className="w-3 h-3" />
                  </Button>
                </div>
                {section.description && (
                  <p className="text-sm text-muted-foreground ml-6 line-clamp-2">{section.description}</p>
                )}
              </>
            )}
          </div>

          {/* Word Count Badge */}
          <Badge variant="secondary" className="flex-shrink-0">
            <BookOpen className="w-3 h-3 mr-1" />
            {section.word_count_target.toLocaleString()}w
          </Badge>
        </div>

        {/* Expanded Subsections */}
        {isExpanded && subsections.length > 0 && (
          <div className="px-4 pb-4 ml-14">
            <div className="border-l-2 border-border pl-4 space-y-2">
              {subsections.map((sub: string, i: number) => (
                <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                  {sub}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OutlineSectionCard;
