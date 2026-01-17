import { useEffect, useCallback } from "react";
import { Brand } from "@/hooks/useBrands";
import { useGeneratedImages } from "@/hooks/useGeneratedImages";
import { GenerateImageDialog } from "./GenerateImageDialog";
import { ImageCard } from "./ImageCard";
import { Image, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImagesListProps {
  brand: Brand;
}

export function ImagesList({ brand }: ImagesListProps) {
  const { images, isLoading, fetchImages, deleteImage } = useGeneratedImages(brand.id);

  const handleRefresh = useCallback(() => {
    fetchImages();
  }, [fetchImages]);

  useEffect(() => {
    fetchImages();
  }, [brand.id]);

  // Refetch when window regains focus (user might have generated images elsewhere)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchImages();
      }
    };
    
    const handleFocus = () => {
      fetchImages();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchImages]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Image Library</h2>
          <p className="text-muted-foreground">
            AI-generated branded visuals and quote cards
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleRefresh} title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <GenerateImageDialog brand={brand} />
        </div>
      </div>

      {images.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg">
          <Image className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No images yet</h3>
          <p className="text-muted-foreground text-center max-w-md mb-4">
            Generate branded quote cards and visuals using AI. Your brand colors and style will be automatically applied.
          </p>
          <GenerateImageDialog brand={brand} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {images.map((image) => (
            <ImageCard key={image.id} image={image} onDelete={deleteImage} />
          ))}
        </div>
      )}
    </div>
  );
}
