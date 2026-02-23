import { useState, useEffect } from "react";
import { useRequireApiKey } from "@/hooks/useRequireApiKey";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Image, Loader2, Sparkles } from "lucide-react";
import { Brand } from "@/hooks/useBrands";
import { useGeneratedImages } from "@/hooks/useGeneratedImages";
import { useUserSettings } from "@/hooks/useUserSettings";

interface GenerateImageDialogProps {
  brand: Brand;
  defaultQuote?: string;
  postId?: string;
  onImageGenerated?: (imageUrl: string) => void;
}

const IMAGE_TYPES = [
  { value: "quote_card", label: "Quote Card", description: "Text-focused image with your quote" },
  { value: "visual", label: "Visual", description: "Abstract branded visual" },
  { value: "banner", label: "Banner", description: "Wide format for covers" },
];

const STYLES = [
  { value: "modern", label: "Modern" },
  { value: "minimal", label: "Minimal" },
  { value: "bold", label: "Bold" },
  { value: "elegant", label: "Elegant" },
  { value: "tech", label: "Tech" },
  { value: "creative", label: "Creative" },
];

export function GenerateImageDialog({ 
  brand, 
  defaultQuote = "", 
  postId,
  onImageGenerated 
}: GenerateImageDialogProps) {
  const { settings } = useUserSettings();
  const [open, setOpen] = useState(false);
  const [imageType, setImageType] = useState(settings.default_image_type);
  const [style, setStyle] = useState(settings.default_image_style);
  const [quoteText, setQuoteText] = useState(defaultQuote);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);

  // Update defaults when settings load
  useEffect(() => {
    if (settings.id) {
      setImageType(settings.default_image_type);
      setStyle(settings.default_image_style);
    }
  }, [settings.id, settings.default_image_type, settings.default_image_style]);
  
  const { generateImage, isGenerating } = useGeneratedImages(brand.id);
  const { requireKey } = useRequireApiKey();

  const handleGenerate = async () => {
    if (!requireKey()) return;
    const result = await generateImage({
      brand,
      quote_text: imageType === "quote_card" ? quoteText : undefined,
      style,
      image_type: imageType,
      post_id: postId,
    });

    if (result) {
      setGeneratedImageUrl(result.image_url);
      onImageGenerated?.(result.image_url);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setGeneratedImageUrl(null);
    setQuoteText(defaultQuote);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => isOpen ? setOpen(true) : handleClose()}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Image className="h-4 w-4 mr-2" />
          Generate Image
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Generate Branded Image
          </DialogTitle>
          <DialogDescription>
            Create AI-generated visuals using {brand.name}'s brand colors and style.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Brand Preview */}
          <div className="flex items-center gap-4 p-4 border bg-muted/50">
            <div className="flex gap-2">
              <div 
                className="w-8 h-8 border"
                style={{ backgroundColor: brand.primary_color || "#000000" }}
                title="Primary Color"
              />
              <div 
                className="w-8 h-8 border"
                style={{ backgroundColor: brand.secondary_color || "#ffffff" }}
                title="Secondary Color"
              />
            </div>
            <div>
              <p className="font-medium">{brand.name}</p>
              <p className="text-sm text-muted-foreground capitalize">{brand.tone} tone</p>
            </div>
          </div>

          {/* Image Type Selection */}
          <div className="space-y-2">
            <Label>Image Type</Label>
            <Select value={imageType} onValueChange={setImageType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {IMAGE_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div>
                      <span className="font-medium">{type.label}</span>
                      <span className="text-muted-foreground ml-2">— {type.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quote Text (for quote cards) */}
          {imageType === "quote_card" && (
            <div className="space-y-2">
              <Label htmlFor="quote">Quote Text</Label>
              <Textarea
                id="quote"
                placeholder="Enter the quote or text to display on the image..."
                value={quoteText}
                onChange={(e) => setQuoteText(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Keep it concise for better readability
              </p>
            </div>
          )}

          {/* Style Selection */}
          <div className="space-y-2">
            <Label>Visual Style</Label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STYLES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Generated Image Preview */}
          {generatedImageUrl && (
            <div className="space-y-2">
              <Label>Generated Image</Label>
              <div className="border p-2 bg-muted/30">
                <img 
                  src={generatedImageUrl} 
                  alt="Generated branded image"
                  className="w-full h-auto max-h-80 object-contain"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(generatedImageUrl, "_blank")}
                >
                  Open Full Size
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = generatedImageUrl;
                    link.download = `${brand.name.toLowerCase().replace(/\s+/g, "-")}-${imageType}.png`;
                    link.click();
                  }}
                >
                  Download
                </Button>
              </div>
            </div>
          )}

          {/* Generate Button */}
          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || (imageType === "quote_card" && !quoteText.trim())}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                {generatedImageUrl ? "Regenerate Image" : "Generate Image"}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
