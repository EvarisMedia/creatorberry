import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  MoreHorizontal,
  Check,
  Trash2,
  ExternalLink,
  Copy,
  ImagePlus,
  Eye,
  Layout,
  Pencil,
  Zap,
  Loader2,
} from "lucide-react";
import { Pin, usePins, usePinVariations } from "@/hooks/usePins";
import { usePinTemplates } from "@/hooks/usePinTemplates";
import { GeneratePinImageDialog } from "./GeneratePinImageDialog";
import { PinPreviewDialog } from "./PinPreviewDialog";
import { PinEditDialog } from "./PinEditDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Brand {
  id: string;
  name: string;
  primary_color?: string | null;
  secondary_color?: string | null;
  pin_design_style?: string | null;
  logo_watermark_enabled?: boolean | null;
}

interface PinCardProps {
  pin: Pin;
  brand: Brand;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  approved: "bg-green-500/10 text-green-600",
  published: "bg-primary/10 text-primary",
};

const pinTypeLabels: Record<string, string> = {
  blog: "Blog",
  product: "Product",
  idea: "Idea",
  infographic: "Infographic",
  listicle: "Listicle",
  comparison: "Comparison",
};

export function PinCard({
  pin,
  brand,
  isSelectionMode = false,
  isSelected = false,
  onToggleSelect,
}: PinCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isQuickGenerating, setIsQuickGenerating] = useState(false);
  const { deletePin, approvePin } = usePins(brand.id);
  const { variations, createVariation, updateVariation } = usePinVariations(pin.id);
  const { createTemplate, templates } = usePinTemplates(brand.id);

  const selectedVariation = variations.find((v) => v.is_selected);
  const pinImage = selectedVariation?.image_url;
  const defaultTemplate = templates.find((t) => t.is_default);

  const handleSaveAsTemplate = async () => {
    await createTemplate.mutateAsync({
      brand_id: brand.id,
      name: `Template from: ${pin.title.substring(0, 30)}`,
      description: `Created from pin "${pin.title}"`,
      pin_type: pin.pin_type || undefined,
      title_template: pin.title,
      description_template: pin.description || undefined,
      headline_template: selectedVariation?.headline || undefined,
      cta_type: pin.cta_type || undefined,
      layout_style: selectedVariation?.layout_style || undefined,
      color_emphasis: selectedVariation?.color_emphasis || undefined,
      keywords: pin.keywords || undefined,
    });
  };

  const handleCopyTitle = () => {
    navigator.clipboard.writeText(pin.title);
    toast.success("Title copied to clipboard");
  };

  const handleCopyDescription = () => {
    if (pin.description) {
      navigator.clipboard.writeText(pin.description);
      toast.success("Description copied to clipboard");
    }
  };

  const handleCopyKeywords = () => {
    if (pin.keywords?.length) {
      navigator.clipboard.writeText(pin.keywords.join(", "));
      toast.success("Keywords copied to clipboard");
    }
  };

  const handleImageGenerated = () => {
    toast.success("Image added to pin!");
  };

  const handleQuickGenerate = async () => {
    setIsQuickGenerating(true);
    try {
      // Use default template headline or pin title
      let headline = pin.title.slice(0, 60);
      let layoutStyle = "bold-text";

      if (defaultTemplate) {
        if (defaultTemplate.headline_template) {
          headline = defaultTemplate.headline_template
            .replace(/\{\{topic\}\}/gi, pin.title)
            .replace(/\{\{brand\}\}/gi, brand.name)
            .replace(/\{\{title\}\}/gi, pin.title)
            .slice(0, 60);
        }
        if (defaultTemplate.layout_style) {
          layoutStyle = defaultTemplate.layout_style;
        }
      }

      const { data, error } = await supabase.functions.invoke("generate-pin-image", {
        body: {
          headline,
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

      // Save the image to variation
      if (selectedVariation) {
        await updateVariation.mutateAsync({
          id: selectedVariation.id,
          image_url: data.imageUrl,
          headline,
          layout_style: layoutStyle,
        });
      } else {
        await createVariation.mutateAsync({
          pin_id: pin.id,
          image_url: data.imageUrl,
          headline,
          layout_style: layoutStyle,
        });
      }

      toast.success("Image generated and saved!");
    } catch (error) {
      console.error("Quick generate error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate image");
    } finally {
      setIsQuickGenerating(false);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (isSelectionMode && onToggleSelect) {
      e.preventDefault();
      e.stopPropagation();
      onToggleSelect();
    }
  };

  return (
    <>
      <Card
        className={`group hover:shadow-md transition-all overflow-hidden cursor-pointer ${
          isSelected ? "ring-2 ring-primary ring-offset-2" : ""
        } ${isSelectionMode ? "cursor-pointer" : ""}`}
        onClick={handleCardClick}
      >
        {/* Image Preview */}
        <div className="aspect-[2/3] bg-muted relative overflow-hidden">
          {pinImage ? (
            <img
              src={pinImage}
              alt={pin.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-2 text-muted-foreground p-4">
              <ImagePlus className="h-8 w-8 opacity-50" />
              <p className="text-xs text-center">No image yet</p>
              {!isSelectionMode && (
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickGenerate();
                    }}
                    disabled={isQuickGenerating}
                  >
                    {isQuickGenerating ? (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    ) : (
                      <Zap className="mr-1 h-3 w-3" />
                    )}
                    Quick
                  </Button>
                  <GeneratePinImageDialog
                    brand={brand}
                    pin={pin}
                    onImageGenerated={handleImageGenerated}
                    trigger={
                      <Button variant="outline" size="sm">
                        <ImagePlus className="mr-1 h-3 w-3" />
                        Custom
                      </Button>
                    }
                  />
                </div>
              )}
            </div>
          )}
          
          {/* Quick Generate Overlay for images that exist */}
          {pinImage && !isSelectionMode && (
            <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="secondary"
                size="sm"
                className="h-7 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  handleQuickGenerate();
                }}
                disabled={isQuickGenerating}
              >
                {isQuickGenerating ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : (
                  <Zap className="mr-1 h-3 w-3" />
                )}
                Regenerate
              </Button>
            </div>
          )}
          
          {/* Selection Checkbox */}
          {isSelectionMode && (
            <div
              className="absolute top-2 left-2 z-10"
              onClick={(e) => {
                e.stopPropagation();
                onToggleSelect?.();
              }}
            >
              <div className="p-1 rounded bg-background/80 backdrop-blur-sm">
                <Checkbox checked={isSelected} />
              </div>
            </div>
          )}

          {/* Status Badge Overlay */}
          <div className={`absolute ${isSelectionMode ? "top-2 left-12" : "top-2 left-2"} flex gap-1`}>
            <Badge variant="outline" className={`${statusColors[pin.status || "draft"]} backdrop-blur-sm`}>
              {pin.status || "draft"}
            </Badge>
          </div>

          {/* Actions Overlay */}
          {!isSelectionMode && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <PinPreviewDialog
                    pin={pin}
                    imageUrl={pinImage || undefined}
                    trigger={
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <Eye className="mr-2 h-4 w-4" />
                        Preview Pin
                      </DropdownMenuItem>
                    }
                  />
                  <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Pin
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleCopyTitle}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Title
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCopyDescription}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Description
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCopyKeywords}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Keywords
                  </DropdownMenuItem>
                  {pin.destination_url && (
                    <DropdownMenuItem asChild>
                      <a
                        href={pin.destination_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open URL
                      </a>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSaveAsTemplate}>
                    <Layout className="mr-2 h-4 w-4" />
                    Save as Template
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {pinImage && (
                    <GeneratePinImageDialog
                      brand={brand}
                      pin={pin}
                      onImageGenerated={handleImageGenerated}
                      trigger={
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <ImagePlus className="mr-2 h-4 w-4" />
                          Custom Image
                        </DropdownMenuItem>
                      }
                    />
                  )}
                  {pin.status === "draft" && (
                    <DropdownMenuItem onClick={() => approvePin.mutate(pin.id)}>
                      <Check className="mr-2 h-4 w-4" />
                      Approve
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        <CardHeader className="pb-2 pt-3">
          <div className="flex items-center gap-2 mb-1">
            {pin.pin_type && (
              <Badge variant="secondary" className="text-xs">
                {pinTypeLabels[pin.pin_type] || pin.pin_type}
              </Badge>
            )}
            {pin.seo_score && (
              <span className="text-xs text-muted-foreground">
                SEO {pin.seo_score}
              </span>
            )}
          </div>
          <CardTitle className="text-sm line-clamp-2">{pin.title}</CardTitle>
        </CardHeader>

        <CardContent className="pt-0 space-y-2">
          {pin.description && (
            <CardDescription className="line-clamp-2 text-xs">
              {pin.description}
            </CardDescription>
          )}

          {pin.keywords && pin.keywords.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {pin.keywords.slice(0, 3).map((keyword, i) => (
                <span
                  key={i}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                >
                  {keyword}
                </span>
              ))}
              {pin.keywords.length > 3 && (
                <span className="text-[10px] text-muted-foreground">
                  +{pin.keywords.length - 3}
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <PinEditDialog
        pin={pin}
        brandId={brand.id}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Pin</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this pin? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletePin.mutate(pin.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
