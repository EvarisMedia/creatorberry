import { useState } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles } from "lucide-react";

interface GenerateIdeasDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (numberOfIdeas: number) => Promise<void>;
  isGenerating: boolean;
}

export const GenerateIdeasDialog = ({
  open,
  onOpenChange,
  onGenerate,
  isGenerating,
}: GenerateIdeasDialogProps) => {
  const [numberOfIdeas, setNumberOfIdeas] = useState("5");

  const handleGenerate = async () => {
    await onGenerate(parseInt(numberOfIdeas));
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
