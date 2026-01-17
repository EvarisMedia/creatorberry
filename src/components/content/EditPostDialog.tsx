import { useState, useEffect } from "react";
import { GeneratedPost, useGeneratedPosts } from "@/hooks/useGeneratedPosts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Save } from "lucide-react";

interface EditPostDialogProps {
  post: GeneratedPost;
  brandId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditPostDialog({ post, brandId, open, onOpenChange }: EditPostDialogProps) {
  const [hook, setHook] = useState(post.hook);
  const [body, setBody] = useState(post.body);
  const [cta, setCta] = useState(post.cta || "");
  const { updatePost } = useGeneratedPosts(brandId);

  // Reset form when dialog opens with new post
  useEffect(() => {
    if (open) {
      setHook(post.hook);
      setBody(post.body);
      setCta(post.cta || "");
    }
  }, [open, post]);

  const handleSave = () => {
    updatePost.mutate(
      {
        id: post.id,
        hook,
        body,
        cta: cta || undefined,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  const previewContent = `${hook}\n\n${body}${cta ? `\n\n${cta}` : ""}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Post</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          {/* Hook */}
          <div className="space-y-2">
            <Label htmlFor="hook">Hook</Label>
            <Textarea
              id="hook"
              value={hook}
              onChange={(e) => setHook(e.target.value)}
              placeholder="Enter hook..."
              className="min-h-[80px] resize-none"
            />
          </div>

          {/* Body */}
          <div className="space-y-2">
            <Label htmlFor="body">Body</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Enter body..."
              className="min-h-[150px]"
            />
          </div>

          {/* CTA */}
          <div className="space-y-2">
            <Label htmlFor="cta">Call to Action (optional)</Label>
            <Textarea
              id="cta"
              value={cta}
              onChange={(e) => setCta(e.target.value)}
              placeholder="Enter call to action..."
              className="min-h-[60px] resize-none"
            />
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="bg-muted/50 p-4 rounded-lg whitespace-pre-wrap text-sm border">
              {previewContent}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updatePost.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {updatePost.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
