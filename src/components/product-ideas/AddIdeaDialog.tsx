import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Upload, FileText, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface AddIdeaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (idea: { title: string; description: string; format: string; target_audience: string }) => Promise<void>;
  isAdding: boolean;
}

const formatOptions = [
  { value: "ebook", label: "Ebook / Guide" },
  { value: "course", label: "Online Course" },
  { value: "templates", label: "Templates / Toolkit" },
  { value: "workbook", label: "Workbook / Journal" },
  { value: "coaching", label: "Coaching Program" },
  { value: "membership", label: "Membership / Community" },
  { value: "printables", label: "Printables / Planners" },
  { value: "newsletter", label: "Paid Newsletter" },
  { value: "audio_course", label: "Audio Course" },
  { value: "video_course", label: "Video Course / Masterclass" },
];

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];
const ACCEPTED_EXTENSIONS = ".pdf,.docx,.txt";

export const AddIdeaDialog = ({ open, onOpenChange, onAdd, isAdding }: AddIdeaDialogProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [format, setFormat] = useState("ebook");
  const [targetAudience, setTargetAudience] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const parseAndAutoFill = async (file: File) => {
    setSelectedFile(file);
    setIsParsing(true);

    try {
      let base64: string;
      if (file.type === "text/plain") {
        const text = await file.text();
        base64 = btoa(unescape(encodeURIComponent(text)));
      } else {
        base64 = await fileToBase64(file);
      }

      const { data, error } = await supabase.functions.invoke("parse-document-for-ideas", {
        body: { fileBase64: base64, fileType: file.type, mode: "extract-idea" },
      });
      if (error) throw error;

      const idea = data.idea;
      if (idea) {
        if (idea.title) setTitle(idea.title);
        if (idea.description) setDescription(idea.description);
        if (idea.format && formatOptions.some(f => f.value === idea.format)) setFormat(idea.format);
        if (idea.target_audience) setTargetAudience(idea.target_audience);
        toast({ title: "Auto-filled!", description: "Fields populated from your document. Feel free to edit." });
      }
    } catch (err: any) {
      console.error("Auto-fill error:", err);
      toast({ title: "Auto-fill failed", description: err.message || "Could not extract idea from document.", variant: "destructive" });
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && ACCEPTED_TYPES.includes(file.type)) parseAndAutoFill(file);
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
    if (file && ACCEPTED_TYPES.includes(file.type)) parseAndAutoFill(file);
  }, []);

  const handleAdd = async () => {
    if (!title.trim() || !description.trim()) return;
    await onAdd({ title, description, format, target_audience: targetAudience });
    setTitle("");
    setDescription("");
    setFormat("ebook");
    setTargetAudience("");
    setSelectedFile(null);
    onOpenChange(false);
  };

  const formatSize = (bytes: number) =>
    bytes < 1024 * 1024 ? (bytes / 1024).toFixed(1) + " KB" : (bytes / (1024 * 1024)).toFixed(1) + " MB";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Product Idea</DialogTitle>
          <DialogDescription>
            Manually add a product idea or upload a document to auto-fill.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Document Upload for Auto-fill */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Upload Document to Auto-fill
            </Label>
            {!selectedFile ? (
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-3 text-center transition-colors cursor-pointer",
                  dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById("add-file-upload")?.click()}
              >
                <Upload className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  Drop a PDF, DOCX, or TXT — AI will extract an idea
                </p>
                <input
                  type="file"
                  accept={ACCEPTED_EXTENSIONS}
                  onChange={handleFileSelect}
                  className="hidden"
                  id="add-file-upload"
                />
              </div>
            ) : (
              <div className="flex items-center gap-2 p-2.5 border rounded-lg bg-muted/50">
                <FileText className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">{formatSize(selectedFile.size)}</p>
                </div>
                {isParsing ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedFile(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Title *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. The Ultimate Budgeting Workbook"
            />
          </div>

          <div className="space-y-2">
            <Label>Description *</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the product, who it's for, and what transformation it provides"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Format</Label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {formatOptions.map((f) => (
                  <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Target Audience (optional)</Label>
            <Input
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="e.g. Freelancers struggling with budgeting"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isAdding || isParsing}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={isAdding || isParsing || !title.trim() || !description.trim()}>
            {isAdding ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Add Idea
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
