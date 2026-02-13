import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, ImagePlus, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Brand } from "@/hooks/useBrands";
import { OutlineSection } from "@/hooks/useProductOutlines";
import { downloadImageBlob } from "@/lib/downloadImage";

const IMAGE_TYPES = [
  { value: "section_infographic", label: "Explainer / Infographic", description: "Conceptual visual explaining the section topic" },
  { value: "chapter_illustration", label: "Chapter Illustration", description: "Artistic illustration for the chapter header" },
  { value: "diagram", label: "Diagram / Flowchart", description: "Process or concept diagram" },
  { value: "concept_map", label: "Concept Map", description: "Visual connections between ideas" },
  { value: "quote_card", label: "Quote Card", description: "Stylized quote or key takeaway card" },
];

const STYLES = ["Modern", "Minimal", "Bold", "Elegant", "Tech", "Creative", "Watercolor", "3D Render", "Flat Design", "Vintage"];

const ASPECT_RATIOS = [
  { value: "16:9", label: "Landscape (16:9)" },
  { value: "1:1", label: "Square (1:1)" },
  { value: "9:16", label: "Portrait (9:16)" },
  { value: "4:3", label: "Wide (4:3)" },
  { value: "2:3", label: "Book Cover (2:3)" },
];

interface Props {
  section: OutlineSection;
  brand: Brand;
  onImageGenerated: () => void;
  onInsertImage?: (imageUrl: string, altText?: string) => void;
}

export function GenerateSectionImageDialog({ section, brand, onImageGenerated, onInsertImage }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [imageType, setImageType] = useState("section_infographic");
  const [style, setStyle] = useState("Modern");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [extraContext, setExtraContext] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!user) return;
    setIsGenerating(true);
    setGeneratedImageUrl(null);

    try {
      const sectionContext = {
        title: section.title,
        description: section.description,
        subsections: section.subsections,
      };

      const response = await supabase.functions.invoke("generate-image", {
        body: {
          brand: {
            name: brand.name,
            primary_color: brand.primary_color,
            secondary_color: brand.secondary_color,
            tone: brand.tone,
          },
          quote_text: section.title,
          style,
          image_type: imageType,
          aspect_ratio: aspectRatio,
          section_context: sectionContext,
          ...(extraContext ? { custom_context: extraContext } : {}),
        },
      });

      if (response.error) throw new Error(response.error.message);

      const { image_url, prompt } = response.data;

      // Save to database with section_id
      const { error: saveError } = await supabase
        .from("generated_images")
        .insert({
          user_id: user.id,
          brand_id: brand.id,
          image_url,
          prompt,
          image_type: imageType,
          quote_text: section.title,
          style,
          section_id: section.id,
        } as any);

      if (saveError) {
        console.error("Error saving image:", saveError);
        toast({ title: "Warning", description: "Image generated but failed to save", variant: "destructive" });
      }

      setGeneratedImageUrl(image_url);
      toast({ title: "Success", description: "Section image generated!" });
      onImageGenerated();

      // Auto-insert into content
      if (onInsertImage) {
        onInsertImage(image_url, section.title);
      }
    } catch (error) {
      console.error("Error generating image:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate image",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImageUrl) return;
    const filename = `${section.title.replace(/\s+/g, "-").toLowerCase()}-image.png`;
    downloadImageBlob(generatedImageUrl, filename);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setGeneratedImageUrl(null); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ImagePlus className="w-4 h-4 mr-2" /> Generate Section Image
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Generate Section Image</DialogTitle>
          <DialogDescription>Create an AI-generated image based on this section's content.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Section context preview */}
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <p className="text-sm font-medium">{section.title}</p>
            {section.description && <p className="text-xs text-muted-foreground mt-1">{section.description}</p>}
            {section.subsections?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {section.subsections.map((s, i) => <Badge key={i} variant="outline" className="text-xs">{s}</Badge>)}
              </div>
            )}
          </div>

          {/* Image Type */}
          <div className="space-y-2">
            <Label>Image Type</Label>
            <Select value={imageType} onValueChange={setImageType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {IMAGE_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    <div>
                      <div className="font-medium">{t.label}</div>
                      <div className="text-xs text-muted-foreground">{t.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Style */}
          <div className="space-y-2">
            <Label>Style</Label>
            <div className="flex flex-wrap gap-2">
              {STYLES.map((s) => (
                <Badge
                  key={s}
                  variant={style === s ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setStyle(s)}
                >
                  {s}
                </Badge>
              ))}
            </div>
          </div>

          {/* Aspect Ratio */}
          <div className="space-y-2">
            <Label>Aspect Ratio</Label>
            <Select value={aspectRatio} onValueChange={setAspectRatio}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ASPECT_RATIOS.map((ar) => (
                  <SelectItem key={ar.value} value={ar.value}>{ar.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Extra context */}
          <div className="space-y-2">
            <Label>Additional Context (optional)</Label>
            <Input
              placeholder="e.g. focus on mindset, include data visualization..."
              value={extraContext}
              onChange={(e) => setExtraContext(e.target.value)}
            />
          </div>

          {/* Generated image preview */}
          {generatedImageUrl && (
            <div className="space-y-2">
              <img src={generatedImageUrl} alt="Generated section image" className="w-full rounded-lg border border-border" />
              <Button variant="outline" size="sm" onClick={handleDownload} className="w-full">
                <Download className="w-4 h-4 mr-2" /> Download Image
              </Button>
            </div>
          )}

          {/* Generate button */}
          <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
            {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ImagePlus className="w-4 h-4 mr-2" />}
            {isGenerating ? "Generating..." : "Generate Image"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
