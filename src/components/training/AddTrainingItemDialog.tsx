import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrainingItem, CreateTrainingItemInput } from "@/hooks/useTrainingLibrary";
import { Loader2 } from "lucide-react";

interface AddTrainingItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (item: CreateTrainingItemInput) => void;
  editItem?: TrainingItem | null;
  isLoading?: boolean;
}

const categories = [
  { value: "hook", label: "Hook" },
  { value: "example_post", label: "Example Post" },
  { value: "guideline", label: "Guideline" },
  { value: "framework", label: "Framework" },
];

const hookSubcategories = [
  { value: "curiosity", label: "Curiosity" },
  { value: "contrarian", label: "Contrarian" },
  { value: "authority", label: "Authority" },
  { value: "story", label: "Story" },
  { value: "question", label: "Question" },
  { value: "statistic", label: "Statistic" },
  { value: "bold_claim", label: "Bold Claim" },
];

export function AddTrainingItemDialog({
  open,
  onOpenChange,
  onSave,
  editItem,
  isLoading,
}: AddTrainingItemDialogProps) {
  const [category, setCategory] = useState("hook");
  const [subcategory, setSubcategory] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    if (editItem) {
      setCategory(editItem.category);
      setSubcategory(editItem.subcategory || "");
      setTitle(editItem.title);
      setContent(editItem.content);
    } else {
      resetForm();
    }
  }, [editItem, open]);

  const resetForm = () => {
    setCategory("hook");
    setSubcategory("");
    setTitle("");
    setContent("");
  };

  const handleSubmit = () => {
    onSave({
      category,
      subcategory: category === "hook" ? subcategory : undefined,
      title,
      content,
    });
  };

  const isValid = title.trim() && content.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editItem ? "Edit Training Item" : "Add Training Item"}
          </DialogTitle>
          <DialogDescription>
            Add content to train the AI for better post generation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {category === "hook" && (
            <div className="space-y-2">
              <Label htmlFor="subcategory">Hook Type</Label>
              <Select value={subcategory} onValueChange={setSubcategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select hook type" />
                </SelectTrigger>
                <SelectContent>
                  {hookSubcategories.map((sub) => (
                    <SelectItem key={sub.value} value={sub.value}>
                      {sub.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a descriptive title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                category === "hook"
                  ? "Enter the hook template, e.g., 'Most people don't realize this about {topic}...'"
                  : category === "example_post"
                  ? "Enter a full example post that demonstrates good writing"
                  : category === "guideline"
                  ? "Enter a writing guideline or rule"
                  : "Enter a content framework or structure"
              }
              rows={6}
            />
            <p className="text-xs text-muted-foreground">
              {content.length} characters
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editItem ? "Save Changes" : "Add Item"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
