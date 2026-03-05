import { useState, useCallback } from "react";
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
import { Loader2, Sparkles, Upload, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface GenerateIdeasDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (numberOfIdeas: number, seedPrompt?: string, documentContext?: string) => Promise<void>;
  isGenerating: boolean;
}

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];
const ACCEPTED_EXTENSIONS = ".pdf,.docx,.txt";

export const GenerateIdeasDialog = ({
  open,
  onOpenChange,
  onGenerate,
  isGenerating,
}: GenerateIdeasDialogProps) => {
  const [numberOfIdeas, setNumberOfIdeas] = useState("5");
  const [seedPrompt, setSeedPrompt] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [documentContext, setDocumentContext] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const { requireKey } = useRequireApiKey();

  const resetFileState = () => {
    setSelectedFile(null);
    setDocumentContext(null);
    setIsParsing(false);
  };

  const parseFile = async (file: File) => {
    setSelectedFile(file);
    setIsParsing(true);

    try {
      if (file.type === "text/plain") {
        const text = await file.text();
        setDocumentContext(text);
      } else {
        const base64 = await fileToBase64(file);
        const { data, error } = await supabase.functions.invoke("parse-document-for-ideas", {
          body: { fileBase64: base64, fileType: file.type, mode: "extract-text" },
        });
        if (error) throw error;
        setDocumentContext(data.text);
      }
      toast({ title: "Document parsed", description: `"${file.name}" ready to use as context.` });
    } catch (err: any) {
      console.error("Parse error:", err);
      toast({ title: "Parse failed", description: err.message || "Could not read document.", variant: "destructive" });
      resetFileState();
    } finally {
      setIsParsing(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && ACCEPTED_TYPES.includes(file.type)) parseFile(file);
    e.target.value = "";
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file && ACCEPTED_TYPES.includes(file.type)) parseFile(file);
  }, []);

  const handleGenerate = async () => {
    if (!requireKey()) return;
    await onGenerate(parseInt(numberOfIdeas), seedPrompt.trim() || undefined, documentContext || undefined);
    setSeedPrompt("");
    resetFileState();
    onOpenChange(false);
  };

  const formatSize = (bytes: number) =>
    bytes < 1024 * 1024 ? (bytes / 1024).toFixed(1) + " KB" : (bytes / (1024 * 1024)).toFixed(1) + " MB";

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

          {/* Document Upload */}
          <div className="space-y-2">
            <Label>Upload Document (optional)</Label>
            {!selectedFile ? (
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer",
                  dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById("gen-file-upload")?.click()}
              >
                <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  Drop a PDF, DOCX, or TXT file here — or click to browse
                </p>
                <input
                  type="file"
                  accept={ACCEPTED_EXTENSIONS}
                  onChange={handleFileSelect}
                  className="hidden"
                  id="gen-file-upload"
                />
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
                <FileText className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">{formatSize(selectedFile.size)}</p>
                </div>
                {isParsing ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={resetFileState}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              The document content will be used as additional context for idea generation.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isGenerating}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={isGenerating || isParsing}>
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
