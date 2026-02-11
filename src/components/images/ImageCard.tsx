import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, ExternalLink, MoreVertical, Trash2 } from "lucide-react";
import { GeneratedImage } from "@/hooks/useGeneratedImages";
import { formatDistanceToNow } from "date-fns";

interface ImageCardProps {
  image: GeneratedImage;
  onDelete: (id: string) => void;
}

export function ImageCard({ image, onDelete }: ImageCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    await onDelete(image.id);
    setIsDeleting(false);
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = image.image_url;
    link.download = `image-${image.id}.png`;
    link.click();
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      quote_card: "Quote Card",
      visual: "Visual",
      banner: "Banner",
      carousel_slide: "Carousel Slide",
      book_cover: "Book Cover",
      chapter_illustration: "Chapter Art",
      worksheet_bg: "Worksheet BG",
      social_promo: "Social Promo",
    };
    return labels[type] || type;
  };

  return (
    <Card className="overflow-hidden group">
      <div className="relative aspect-square bg-muted">
        <img
          src={image.image_url}
          alt={image.quote_text || "Generated image"}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button
            variant="secondary"
            size="icon"
            onClick={() => window.open(image.image_url, "_blank")}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button variant="secondary" size="icon" onClick={handleDownload}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">{getTypeLabel(image.image_type)}</Badge>
              <Badge variant="outline" className="capitalize">
                {image.style}
              </Badge>
            </div>
            {image.quote_text && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                "{image.quote_text}"
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(image.created_at), { addSuffix: true })}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => window.open(image.image_url, "_blank")}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Full Size
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
