import { useState } from "react";
import { format } from "date-fns";
import { Copy, Download, ExternalLink, Check, Image as ImageIcon, Calendar } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GeneratedPost, useGeneratedPosts } from "@/hooks/useGeneratedPosts";
import { GeneratedImage } from "@/hooks/useGeneratedImages";
import { toast } from "sonner";

interface PublishPostDialogProps {
  post: GeneratedPost;
  brandId: string;
  brandName: string;
  attachedImage?: GeneratedImage | null;
  trigger?: React.ReactNode;
}

export function PublishPostDialog({
  post,
  brandId,
  brandName,
  attachedImage,
  trigger,
}: PublishPostDialogProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const { markAsPublished } = useGeneratedPosts(brandId);

  const handleCopyContent = async () => {
    try {
      await navigator.clipboard.writeText(post.full_content);
      setCopied(true);
      toast.success("Content copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy content");
    }
  };

  const handleDownloadImage = async () => {
    if (!attachedImage?.image_url) return;

    setDownloading(true);
    try {
      const response = await fetch(attachedImage.image_url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const date = format(new Date(), "yyyy-MM-dd");
      a.download = `${brandName.toLowerCase().replace(/\s+/g, "-")}-${post.post_type}-${date}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Image downloaded!");
    } catch (error) {
      toast.error("Failed to download image");
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyAndOpenInstagram = async () => {
    await handleCopyContent();
    window.open("https://www.instagram.com/", "_blank");
  };

  const handleMarkAsPublished = () => {
    markAsPublished.mutate(post.id, {
      onSuccess: () => {
        setOpen(false);
      },
    });
  };

  const isOverdue = post.scheduled_at && new Date(post.scheduled_at) < new Date();
  const scheduledTime = post.scheduled_at
    ? format(new Date(post.scheduled_at), "MMM d, yyyy 'at' h:mm a")
    : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="default" size="sm">
            <ExternalLink className="h-4 w-4 mr-2" />
            Publish Now
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Publish to Instagram
            {isOverdue && (
              <Badge variant="destructive" className="text-xs">
                Overdue
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Scheduled time info */}
          {scheduledTime && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Scheduled for {scheduledTime}</span>
            </div>
          )}

          {/* Post content preview */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Post Content</h4>
            <div className="border-2 border-border p-4 bg-muted/30 max-h-60 overflow-y-auto">
              <p className="whitespace-pre-wrap text-sm">{post.full_content}</p>
            </div>
          </div>

          {/* Attached image */}
          {attachedImage && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Attached Image
              </h4>
              <div className="border-2 border-border overflow-hidden">
                <img
                  src={attachedImage.image_url}
                  alt="Post image"
                  className="w-full max-h-48 object-cover"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadImage}
                disabled={downloading}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                {downloading ? "Downloading..." : "Download Image"}
              </Button>
            </div>
          )}

          {/* No image warning */}
          {!attachedImage && (
            <div className="border-2 border-dashed border-muted-foreground/30 p-4 text-center text-muted-foreground text-sm">
              <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No image attached to this post</p>
              <p className="text-xs mt-1">
                You can attach an image from the Content page
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-3 pt-4 border-t border-border">
            <Button
              onClick={handleCopyAndOpenInstagram}
              className="w-full"
              size="lg"
            >
              {copied ? (
                <Check className="h-4 w-4 mr-2" />
              ) : (
                <Copy className="h-4 w-4 mr-2" />
              )}
              Copy & Open Instagram
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleCopyContent}
                className="flex-1"
              >
                {copied ? (
                  <Check className="h-4 w-4 mr-2" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                Copy Only
              </Button>
              <Button
                variant="secondary"
                onClick={handleMarkAsPublished}
                disabled={markAsPublished.isPending}
                className="flex-1"
              >
                Mark as Published
              </Button>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-muted/50 p-4 text-sm space-y-2">
            <h5 className="font-medium">How to publish:</h5>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Click "Copy & Open Instagram"</li>
              <li>Create a new post and paste your caption</li>
              {attachedImage && (
                <li>Upload the downloaded image to your post</li>
              )}
              <li>Add hashtags and share your post</li>
              <li>Come back and click "Mark as Published"</li>
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
