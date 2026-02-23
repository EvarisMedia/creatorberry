import { useState, useEffect } from "react";
import { useRequireApiKey } from "@/hooks/useRequireApiKey";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, ImagePlus, Download, RefreshCw, Save, X, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePinTemplates, PinTemplate } from "@/hooks/usePinTemplates";
import { usePinVariations } from "@/hooks/usePins";
import { toast } from "sonner";

interface Brand {
  id: string;
  name: string;
  primary_color?: string | null;
  secondary_color?: string | null;
  pin_design_style?: string | null;
  logo_watermark_enabled?: boolean | null;
}

interface Pin {
  id: string;
  title: string;
  keywords?: string[] | null;
  pin_type?: string | null;
}

interface GeneratePinImageDialogProps {
  brand: Brand;
  pin: Pin;
  onImageGenerated?: (imageUrl: string) => void;
  trigger?: React.ReactNode;
}

const LAYOUT_STYLES = [
  { value: "minimal", label: "Minimal", description: "Clean with lots of white space" },
  { value: "bold-text", label: "Bold Text", description: "Large typography focus" },
  { value: "lifestyle", label: "Lifestyle", description: "Photo style with text overlay" },
  { value: "infographic", label: "Infographic", description: "Data and icons" },
  { value: "product", label: "Product", description: "Product showcase style" },
];

// Helper to replace template placeholders
function replacePlaceholders(template: string, context: { topic: string; brand: string }): string {
  return template
    .replace(/\{\{topic\}\}/gi, context.topic)
    .replace(/\{\{brand\}\}/gi, context.brand)
    .replace(/\{\{title\}\}/gi, context.topic);
}

export function GeneratePinImageDialog({
  brand,
  pin,
  onImageGenerated,
  trigger,
}: GeneratePinImageDialogProps) {
  const [open, setOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [headline, setHeadline] = useState(pin.title.slice(0, 60));
  const [subheadline, setSubheadline] = useState("");
  const [layoutStyle, setLayoutStyle] = useState("bold-text");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  const { templates } = usePinTemplates(brand.id);
  const { variations, createVariation, updateVariation } = usePinVariations(pin.id);
  const { requireKey } = useRequireApiKey();
  
  const selectedVariation = variations.find((v) => v.is_selected);
  const defaultTemplate = templates.find((t) => t.is_default);

  // Reset and apply default template when dialog opens
  useEffect(() => {
    if (open) {
      setGeneratedImage(null);
      setHeadline(pin.title.slice(0, 60));
      setSubheadline("");
      setLayoutStyle("bold-text");
      setSelectedTemplateId(null);

      // Apply default template if exists
      if (defaultTemplate) {
        applyTemplate(defaultTemplate);
        setSelectedTemplateId(defaultTemplate.id);
      }
    }
  }, [open, pin.title]);

  const applyTemplate = (template: PinTemplate) => {
    const context = { topic: pin.title, brand: brand.name };
    
    if (template.headline_template) {
      setHeadline(replacePlaceholders(template.headline_template, context).slice(0, 60));
    }
    if (template.layout_style) {
      setLayoutStyle(template.layout_style);
    }
  };

  const handleTemplateChange = (templateId: string) => {
    if (templateId === "none") {
      setSelectedTemplateId(null);
      setHeadline(pin.title.slice(0, 60));
      setLayoutStyle("bold-text");
      return;
    }

    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setSelectedTemplateId(templateId);
      applyTemplate(template);
    }
  };

  const handleGenerate = async () => {
    if (!requireKey()) return;
    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      const { data, error } = await supabase.functions.invoke("generate-pin-image", {
        body: {
          headline,
          subheadline: subheadline || undefined,
          layoutStyle,
          brandContext: {
            name: brand.name,
            primaryColor: brand.primary_color,
            secondaryColor: brand.secondary_color,
            pinDesignStyle: brand.pin_design_style,
            logoWatermark: brand.logo_watermark_enabled,
          },
          pinType: pin.pin_type || "blog",
          keywords: pin.keywords,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setGeneratedImage(data.imageUrl);
      toast.success("Pin image generated!");

      if (onImageGenerated) {
        onImageGenerated(data.imageUrl);
      }
    } catch (error) {
      console.error("Generation error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate image");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToPin = async () => {
    if (!generatedImage) return;

    setIsSaving(true);
    try {
      if (selectedVariation) {
        // Update existing variation
        await updateVariation.mutateAsync({
          id: selectedVariation.id,
          image_url: generatedImage,
          headline,
          layout_style: layoutStyle,
        });
      } else {
        // Create new variation
        await createVariation.mutateAsync({
          pin_id: pin.id,
          image_url: generatedImage,
          headline,
          layout_style: layoutStyle,
        });
      }
      toast.success("Image saved to pin!");
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save image to pin");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedImage) return;

    try {
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pin-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("Image downloaded!");
    } catch (error) {
      toast.error("Failed to download image");
    }
  };

  const handleClose = () => {
    setOpen(false);
    setGeneratedImage(null);
  };

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : handleClose())}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <ImagePlus className="h-4 w-4" />
            Generate Image
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Pin Image</DialogTitle>
          <DialogDescription>
            Create a Pinterest-optimized 2:3 image with text overlay
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Settings */}
          <div className="space-y-4">
            {/* Template Selection */}
            {templates.length > 0 && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Use Template
                </Label>
                <Select
                  value={selectedTemplateId || "none"}
                  onValueChange={handleTemplateChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No template</SelectItem>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex items-center gap-2">
                          {template.name}
                          {template.is_default && (
                            <Badge variant="secondary" className="text-xs">
                              Default
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedTemplate && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {selectedTemplate.name}
                    </Badge>
                    <button
                      onClick={() => handleTemplateChange("none")}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {templates.length > 0 && <Separator />}

            <div className="space-y-2">
              <Label htmlFor="headline">Headline (max 60 chars)</Label>
              <Input
                id="headline"
                value={headline}
                onChange={(e) => setHeadline(e.target.value.slice(0, 60))}
                placeholder="Enter pin headline..."
              />
              <p className="text-xs text-muted-foreground">{headline.length}/60</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subheadline">Subheadline (optional)</Label>
              <Input
                id="subheadline"
                value={subheadline}
                onChange={(e) => setSubheadline(e.target.value)}
                placeholder="Add a supporting line..."
              />
            </div>

            <div className="space-y-2">
              <Label>Layout Style</Label>
              <Select value={layoutStyle} onValueChange={setLayoutStyle}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LAYOUT_STYLES.map((style) => (
                    <SelectItem key={style.value} value={style.value}>
                      <div>
                        <div className="font-medium">{style.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {style.description}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="pt-2 space-y-2">
              <div className="text-sm text-muted-foreground">
                <strong>Brand:</strong> {brand.name}
              </div>
              {brand.primary_color && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <strong>Colors:</strong>
                  <span
                    className="w-4 h-4 rounded-full border"
                    style={{ backgroundColor: brand.primary_color }}
                  />
                  {brand.secondary_color && (
                    <span
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: brand.secondary_color }}
                    />
                  )}
                </div>
              )}
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !headline}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : generatedImage ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Regenerate
                </>
              ) : (
                <>
                  <ImagePlus className="mr-2 h-4 w-4" />
                  Generate Image
                </>
              )}
            </Button>
          </div>

          {/* Preview */}
          <div className="space-y-3">
            <Label>Preview (2:3 ratio)</Label>
            <div className="aspect-[2/3] rounded-lg border bg-muted overflow-hidden">
              {isGenerating ? (
                <div className="h-full flex flex-col items-center justify-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">
                    Creating your pin image...
                  </p>
                </div>
              ) : generatedImage ? (
                <img
                  src={generatedImage}
                  alt="Generated pin"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <ImagePlus className="h-12 w-12 opacity-50" />
                  <p className="text-sm">Your pin preview will appear here</p>
                </div>
              )}
            </div>

            {generatedImage && (
              <div className="flex gap-2">
                <Button
                  variant="default"
                  onClick={handleSaveToPin}
                  disabled={isSaving}
                  className="flex-1"
                >
                  {isSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save to Pin
                </Button>
                <Button variant="outline" onClick={handleDownload}>
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
