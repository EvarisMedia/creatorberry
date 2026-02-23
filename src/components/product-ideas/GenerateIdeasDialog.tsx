import { useState } from "react";
import { useRequireApiKey } from "@/hooks/useRequireApiKey";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles } from "lucide-react";

interface GenerateIdeasDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (numberOfIdeas: number, seedPrompt?: string) => Promise<void>;
  isGenerating: boolean;
}

export const GenerateIdeasDialog = ({
  open,
  onOpenChange,
  onGenerate,
  isGenerating,
}: GenerateIdeasDialogProps) => {
  const [numberOfIdeas, setNumberOfIdeas] = useState("5");
  const [seedPrompt, setSeedPrompt] = useState("");
  const { requireKey } = useRequireApiKey();

  const handleGenerate = async () => {
    if (!requireKey()) return;
    await onGenerate(parseInt(numberOfIdeas), seedPrompt.trim() || undefined);
    setSeedPrompt("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Product Ideas</DialogTitle>
          <DialogDescription>
            AI will analyze your brand profile and content sources to generate validated product ideas with PMF scoring.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Number of Ideas</Label>
            <Select value={numberOfIdeas} onValueChange={setNumberOfIdeas}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 ideas</SelectItem>
                <SelectItem value="5">5 ideas</SelectItem>
                <SelectItem value="8">8 ideas</SelectItem>
                <SelectItem value="10">10 ideas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Seed Prompt (optional)</Label>
            <Textarea
              value={seedPrompt}
              onChange={(e) => setSeedPrompt(e.target.value)}
              placeholder="Describe a topic, trend, or rough idea you want AI to explore..."
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Guide the AI toward specific topics or market opportunities you're interested in.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isGenerating}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Ideas
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
