import { useState } from "react";
import { useRequireApiKey } from "@/hooks/useRequireApiKey";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import { ProductIdea } from "@/hooks/useProductIdeas";

interface GenerateOutlineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ideas: ProductIdea[];
  brand: any;
  onGenerate: (idea: ProductIdea, brand: any) => Promise<any>;
  isGenerating: boolean;
}

const GenerateOutlineDialog = ({
  open,
  onOpenChange,
  ideas,
  brand,
  onGenerate,
  isGenerating,
}: GenerateOutlineDialogProps) => {
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
  const { requireKey } = useRequireApiKey();
  const handleGenerate = async () => {
    const idea = ideas.find((i) => i.id === selectedIdeaId);
    if (!idea || !brand) return;
    if (!requireKey()) return;
    await onGenerate(idea, brand);
    onOpenChange(false);
    setSelectedIdeaId(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Generate Outline</DialogTitle>
          <DialogDescription>
            Select a product idea to generate a structured outline with chapters and sections.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 max-h-80 overflow-y-auto">
          {ideas.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No product ideas yet. Generate ideas first from the Product Ideas page.
            </p>
          ) : (
            ideas.map((idea) => (
              <button
                key={idea.id}
                onClick={() => setSelectedIdeaId(idea.id)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedIdeaId === idea.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="font-medium text-sm">{idea.title}</div>
                <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{idea.description}</div>
                <div className="flex gap-2 mt-2">
                  <span className="text-xs bg-secondary px-2 py-0.5 rounded">{idea.format}</span>
                  {idea.pmf_score && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                      PMF: {idea.pmf_score.combined_score}
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={!selectedIdeaId || isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            Generate Outline
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GenerateOutlineDialog;
