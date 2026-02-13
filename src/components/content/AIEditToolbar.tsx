import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, RefreshCw, Expand, Minimize2, MessageSquare, X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const TONE_OPTIONS = ["Professional", "Casual", "Academic", "Storytelling"];

interface AIEditToolbarProps {
  selectedText: string;
  fullContent: string;
  brandContext?: {
    name?: string;
    tone?: string;
    writing_style?: string;
    about?: string;
    target_audience?: string;
  };
  onApplyEdit: (newText: string) => void;
  onClose: () => void;
}

export function AIEditToolbar({
  selectedText,
  fullContent,
  brandContext,
  onApplyEdit,
  onClose,
}: AIEditToolbarProps) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [customInstruction, setCustomInstruction] = useState("");
  const [editedText, setEditedText] = useState<string | null>(null);

  const handleAIEdit = async (instruction: string) => {
    setIsProcessing(true);
    setEditedText(null);
    try {
      const response = await supabase.functions.invoke("ai-edit-content", {
        body: {
          selectedText,
          instruction,
          fullContent,
          brandContext: brandContext || {},
        },
      });

      if (response.error) throw new Error(response.error.message);
      const result = response.data?.editedText;
      if (!result) throw new Error("No edited text returned");
      setEditedText(result);
    } catch (error: any) {
      console.error("AI edit error:", error);
      toast({
        title: "AI Edit Failed",
        description: error.message || "Failed to edit text",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApply = () => {
    if (editedText) {
      onApplyEdit(editedText);
      onClose();
    }
  };

  return (
    <Card className="border-primary/30 shadow-lg">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" /> AI Text Editor
          </h4>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
            <X className="w-3 h-3" />
          </Button>
        </div>

        {/* Selected text preview */}
        <div className="p-2 rounded bg-muted/50 border border-border text-xs text-muted-foreground max-h-20 overflow-auto">
          "{selectedText.slice(0, 200)}{selectedText.length > 200 ? "..." : ""}"
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => handleAIEdit("Rewrite this text to be clearer and more engaging while keeping the same meaning.")}
            disabled={isProcessing}
          >
            <RefreshCw className="w-3 h-3 mr-1" /> Rewrite
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => handleAIEdit("Expand this text with more detail, examples, and depth.")}
            disabled={isProcessing}
          >
            <Expand className="w-3 h-3 mr-1" /> Expand
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => handleAIEdit("Simplify this text to make it clearer and easier to understand. Use shorter sentences.")}
            disabled={isProcessing}
          >
            <Minimize2 className="w-3 h-3 mr-1" /> Simplify
          </Button>
        </div>

        {/* Tone options */}
        <div className="flex flex-wrap gap-1">
          {TONE_OPTIONS.map((tone) => (
            <Badge
              key={tone}
              variant="outline"
              className="cursor-pointer text-xs hover:bg-primary hover:text-primary-foreground transition-colors"
              onClick={() => handleAIEdit(`Rewrite this text in a ${tone.toLowerCase()} tone while keeping the core message.`)}
            >
              {tone}
            </Badge>
          ))}
        </div>

        {/* Custom instruction */}
        <div className="flex gap-2">
          <Input
            placeholder="Custom instruction..."
            value={customInstruction}
            onChange={(e) => setCustomInstruction(e.target.value)}
            className="h-8 text-xs"
            onKeyDown={(e) => {
              if (e.key === "Enter" && customInstruction.trim()) {
                handleAIEdit(customInstruction.trim());
              }
            }}
          />
          <Button
            size="sm"
            className="h-8"
            onClick={() => customInstruction.trim() && handleAIEdit(customInstruction.trim())}
            disabled={isProcessing || !customInstruction.trim()}
          >
            Go
          </Button>
        </div>

        {/* Processing state */}
        {isProcessing && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" /> Processing...
          </div>
        )}

        {/* Result preview */}
        {editedText && (
          <div className="space-y-2">
            <div className="p-2 rounded bg-primary/5 border border-primary/20 text-sm max-h-40 overflow-auto">
              {editedText}
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="h-7 text-xs" onClick={handleApply}>
                Apply Change
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEditedText(null)}>
                Discard
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
