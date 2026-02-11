import { useState } from "react";
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
import { Loader2, Sparkles, Palette } from "lucide-react";
import { Brand } from "@/hooks/useBrands";
import { useGeneratedImages } from "@/hooks/useGeneratedImages";

interface GenerateStudioImageDialogProps {
  brand: Brand;
  onGenerated: () => void;
  defaultType?: string;
}

const IMAGE_TYPES = [
  { value: "book_cover", label: "Book Cover", description: "Professional ebook/book cover design", hasText: true, textLabel: "Book Title", textPlaceholder: "Enter the book title to display..." },
  { value: "chapter_illustration", label: "Chapter Illustration", description: "Header illustration for chapters/sections", hasText: true, textLabel: "Chapter Theme", textPlaceholder: "Describe the chapter theme (e.g., 'Growth mindset', 'Building habits')..." },
  { value: "worksheet_bg", label: "Worksheet Background", description: "Subtle background for worksheets/workbooks", hasText: false, textLabel: "", textPlaceholder: "" },
  { value: "social_promo", label: "Social Promo", description: "Product promotion graphic for social media", hasText: true, textLabel: "Product Name / Tagline", textPlaceholder: "Enter the product name or promotional tagline..." },
  { value: "quote_card", label: "Quote Card", description: "Text-focused image with your quote", hasText: true, textLabel: "Quote Text", textPlaceholder: "Enter the quote to display..." },
  { value: "visual", label: "Visual", description: "Abstract branded visual", hasText: false, textLabel: "", textPlaceholder: "" },
  { value: "banner", label: "Banner", description: "Story/cover format", hasText: false, textLabel: "", textPlaceholder: "" },
];

const STYLES = [
  { value: "modern", label: "Modern" },
  { value: "minimal", label: "Minimal" },
  { value: "bold", label: "Bold" },
  { value: "elegant", label: "Elegant" },
  { value: "tech", label: "Tech" },
  { value: "creative", label: "Creative" },
  { value: "watercolor", label: "Watercolor" },
  { value: "3d", label: "3D Render" },
  { value: "flat", label: "Flat Design" },
  { value: "vintage", label: "Vintage" },
];

export function GenerateStudioImageDialog({ brand, onGenerated, defaultType }: GenerateStudioImageDialogProps) {
  const [open, setOpen] = useState(false);
  const [imageType, setImageType] = useState(defaultType || "book_cover");
  const [style, setStyle] = useState("modern");
  const [textInput, setTextInput] = useState("");
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);

  const { generateImage, isGenerating } = useGeneratedImages(brand.id);

  const selectedType = IMAGE_TYPES.find((t) => t.value === imageType);

  const handleGenerate = async () => {
    const result = await generateImage({
      brand,
      quote_text: selectedType?.hasText ? textInput : undefined,
      style,
      image_type: imageType,
    });

    if (result) {
      setGeneratedImageUrl(result.image_url);
      onGenerated();
    }
  };

  const handleClose = () => {
    setOpen(false);
    setGeneratedImageUrl(null);
    setTextInput("");
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => (isOpen ? setOpen(true) : handleClose())}>
      <DialogTrigger asChild>
        <Button>
          <Palette className="h-4 w-4 mr-2" />
          Generate Image
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Image Studio
          </DialogTitle>
          <DialogDescription>
            Generate branded visuals for your digital products using {brand.name}'s style.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Brand Preview */}
          <div className="flex items-center gap-4 p-4 border rounded-xl bg-muted/50">
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded-lg border" style={{ backgroundColor: brand.primary_color || "#000000" }} title="Primary" />
              <div className="w-8 h-8 rounded-lg border" style={{ backgroundColor: brand.secondary_color || "#ffffff" }} title="Secondary" />
            </div>
            <div>
              <p className="font-medium">{brand.name}</p>
              <p className="text-sm text-muted-foreground capitalize">{brand.tone} tone</p>
            </div>
          </div>

          {/* Image Type */}
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

          {/* Text Input (conditional) */}
          {selectedType?.hasText && (
            <div className="space-y-2">
              <Label>{selectedType.textLabel}</Label>
              <Textarea
                placeholder={selectedType.textPlaceholder}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                rows={3}
              />
            </div>
          )}

          {/* Style */}
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

          {/* Preview */}
          {generatedImageUrl && (
            <div className="space-y-2">
              <Label>Generated Image</Label>
              <div className="border rounded-xl p-2 bg-muted/30">
                <img src={generatedImageUrl} alt="Generated" className="w-full h-auto max-h-80 object-contain rounded-lg" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => window.open(generatedImageUrl, "_blank")}>
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
            disabled={isGenerating || (selectedType?.hasText && !textInput.trim())}
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
                {generatedImageUrl ? "Regenerate" : "Generate Image"}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
