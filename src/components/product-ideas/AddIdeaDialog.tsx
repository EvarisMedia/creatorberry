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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus } from "lucide-react";

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

export const AddIdeaDialog = ({ open, onOpenChange, onAdd, isAdding }: AddIdeaDialogProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [format, setFormat] = useState("ebook");
  const [targetAudience, setTargetAudience] = useState("");

  const handleAdd = async () => {
    if (!title.trim() || !description.trim()) return;
    await onAdd({ title, description, format, target_audience: targetAudience });
    setTitle("");
    setDescription("");
    setFormat("ebook");
    setTargetAudience("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Product Idea</DialogTitle>
          <DialogDescription>
            Manually add a product idea to your list.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
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
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isAdding}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={isAdding || !title.trim() || !description.trim()}>
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
