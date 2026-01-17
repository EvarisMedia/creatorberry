import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, 
  ChevronRight, 
  Layers, 
  Image as ImageIcon,
  Edit,
  Check,
  X,
  Copy,
  GripVertical,
  FileImage
} from "lucide-react";
import { toast } from "sonner";
import { ExportCarouselDialog } from "./ExportCarouselDialog";

export interface CarouselSlide {
  slideNumber: number;
  headline: string;
  content: string;
  visualSuggestion?: string;
}

interface CarouselSlidesEditorProps {
  slides: CarouselSlide[];
  onSlidesChange?: (slides: CarouselSlide[]) => void;
  readOnly?: boolean;
  brand?: {
    id?: string;
    name: string;
    primary_color?: string | null;
    secondary_color?: string | null;
  };
}

export function CarouselSlidesEditor({ 
  slides, 
  onSlidesChange, 
  readOnly = false,
  brand
}: CarouselSlidesEditorProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [editingSlide, setEditingSlide] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<CarouselSlide | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  const goToSlide = (index: number) => {
    if (index >= 0 && index < slides.length) {
      setCurrentSlide(index);
    }
  };

  const startEditing = (index: number) => {
    setEditingSlide(index);
    setEditForm({ ...slides[index] });
  };

  const cancelEditing = () => {
    setEditingSlide(null);
    setEditForm(null);
  };

  const saveEditing = () => {
    if (editingSlide !== null && editForm && onSlidesChange) {
      const newSlides = [...slides];
      newSlides[editingSlide] = editForm;
      onSlidesChange(newSlides);
      setEditingSlide(null);
      setEditForm(null);
      toast.success("Slide updated");
    }
  };

  const copySlide = (slide: CarouselSlide) => {
    const text = `${slide.headline}\n\n${slide.content}`;
    navigator.clipboard.writeText(text);
    toast.success("Slide copied to clipboard");
  };

  const copyAllSlides = () => {
    const text = slides
      .map((s, i) => `--- Slide ${i + 1} ---\n${s.headline}\n\n${s.content}`)
      .join("\n\n");
    navigator.clipboard.writeText(text);
    toast.success("All slides copied to clipboard");
  };

  if (!slides || slides.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No carousel slides available</p>
      </div>
    );
  }

  const slide = slides[currentSlide];
  const isEditing = editingSlide === currentSlide;

  return (
    <div className="space-y-4">
      {/* Slide Navigation Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">Carousel Slides</span>
          <Badge variant="secondary" className="text-xs">
            {slides.length} slides
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          {brand && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExportDialogOpen(true)}
              className="text-xs"
            >
              <FileImage className="h-3 w-3 mr-1" />
              Export
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={copyAllSlides}
            className="text-xs"
          >
            <Copy className="h-3 w-3 mr-1" />
            Copy All
          </Button>
        </div>
      </div>

      {/* Slide Dots Navigation */}
      <div className="flex items-center justify-center gap-1.5">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentSlide 
                ? "bg-primary w-4" 
                : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Current Slide Display */}
      <Card className="border-primary/20">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono">
                {currentSlide + 1} / {slides.length}
              </Badge>
              {slide.visualSuggestion && (
                <Badge variant="secondary" className="text-xs">
                  <ImageIcon className="h-3 w-3 mr-1" />
                  Has visual
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              {!readOnly && !isEditing && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => startEditing(currentSlide)}
                >
                  <Edit className="h-3 w-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => copySlide(slide)}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isEditing && editForm ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Headline</label>
                <Input
                  value={editForm.headline}
                  onChange={(e) => setEditForm({ ...editForm, headline: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Content</label>
                <Textarea
                  value={editForm.content}
                  onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                  rows={4}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Visual Suggestion (optional)</label>
                <Input
                  value={editForm.visualSuggestion || ""}
                  onChange={(e) => setEditForm({ ...editForm, visualSuggestion: e.target.value })}
                  placeholder="Describe the visual for this slide..."
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={cancelEditing}>
                  <X className="h-3 w-3 mr-1" />
                  Cancel
                </Button>
                <Button size="sm" onClick={saveEditing}>
                  <Check className="h-3 w-3 mr-1" />
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-lg leading-tight">{slide.headline}</h4>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {slide.content}
              </p>
              {slide.visualSuggestion && (
                <div className="pt-2 border-t border-dashed">
                  <p className="text-xs text-muted-foreground">
                    <ImageIcon className="h-3 w-3 inline mr-1" />
                    <span className="font-medium">Visual:</span> {slide.visualSuggestion}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Arrows */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToSlide(currentSlide - 1)}
          disabled={currentSlide === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
        <span className="text-xs text-muted-foreground">
          {currentSlide === 0 && "Hook Slide"}
          {currentSlide === slides.length - 1 && "CTA Slide"}
          {currentSlide > 0 && currentSlide < slides.length - 1 && `Content Slide ${currentSlide}`}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToSlide(currentSlide + 1)}
          disabled={currentSlide === slides.length - 1}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Slide Thumbnails List */}
      <div className="border rounded-lg p-2 bg-muted/30">
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {slides.map((s, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-full text-left p-2 rounded transition-colors flex items-start gap-2 ${
                index === currentSlide 
                  ? "bg-primary/10 border border-primary/30" 
                  : "hover:bg-muted"
              }`}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground/50 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground">
                    {index + 1}.
                  </span>
                  <span className="text-sm font-medium truncate">
                    {s.headline}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {s.content.slice(0, 60)}...
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Export Dialog */}
      {brand && (
        <ExportCarouselDialog
          slides={slides}
          brand={brand}
          open={exportDialogOpen}
          onOpenChange={setExportDialogOpen}
        />
      )}
    </div>
  );
}
