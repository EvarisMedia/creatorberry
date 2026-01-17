import { useState, useEffect } from "react";
import { Image as ImageIcon, Check, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GeneratedImage, useGeneratedImages } from "@/hooks/useGeneratedImages";
import { Brand } from "@/hooks/useBrands";
import { cn } from "@/lib/utils";

interface AttachImageDialogProps {
  postId: string;
  brand: Brand;
  currentImageId?: string | null;
  onImageAttached?: (image: GeneratedImage | null) => void;
  trigger?: React.ReactNode;
}

export function AttachImageDialog({
  postId,
  brand,
  currentImageId,
  onImageAttached,
  trigger,
}: AttachImageDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(
    currentImageId || null
  );
  const { images, fetchImages, isLoading, attachToPost } = useGeneratedImages(brand.id);

  useEffect(() => {
    if (open) {
      fetchImages();
    }
  }, [open]);

  useEffect(() => {
    setSelectedImageId(currentImageId || null);
  }, [currentImageId]);

  const handleAttach = async () => {
    const selectedImage = selectedImageId
      ? images.find((img) => img.id === selectedImageId) || null
      : null;

    const success = await attachToPost(postId, selectedImageId);
    if (success) {
      onImageAttached?.(selectedImage);
      setOpen(false);
    }
  };

  const handleDetach = async () => {
    const success = await attachToPost(postId, null);
    if (success) {
      setSelectedImageId(null);
      onImageAttached?.(null);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <ImageIcon className="h-4 w-4 mr-2" />
            {currentImageId ? "Change Image" : "Attach Image"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Attach Image to Post</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-muted-foreground/30">
              <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground mb-2">No images generated yet</p>
              <p className="text-sm text-muted-foreground">
                Go to the Images page to generate images for your brand
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Select an image to attach to this post, or click "Detach" to remove
                the current image.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {images.map((image) => (
                  <button
                    key={image.id}
                    onClick={() => setSelectedImageId(image.id)}
                    className={cn(
                      "relative border-2 overflow-hidden transition-all",
                      selectedImageId === image.id
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <img
                      src={image.image_url}
                      alt={image.prompt}
                      className="w-full aspect-square object-cover"
                    />
                    {selectedImageId === image.id && (
                      <div className="absolute top-2 right-2 bg-primary text-primary-foreground p-1">
                        <Check className="h-4 w-4" />
                      </div>
                    )}
                    {image.quote_text && (
                      <div className="absolute bottom-0 left-0 right-0 bg-background/90 p-2">
                        <p className="text-xs truncate">{image.quote_text}</p>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="flex gap-2 pt-4 border-t border-border">
            {currentImageId && (
              <Button variant="destructive" onClick={handleDetach} className="flex-1">
                Detach Image
              </Button>
            )}
            <Button
              onClick={handleAttach}
              disabled={!selectedImageId || selectedImageId === currentImageId}
              className="flex-1"
            >
              <Plus className="h-4 w-4 mr-2" />
              Attach Selected
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
