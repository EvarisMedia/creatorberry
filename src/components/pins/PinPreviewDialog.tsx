import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Eye,
  Smartphone,
  Monitor,
  Heart,
  Share2,
  MoreHorizontal,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import { Pin } from "@/hooks/usePins";

interface PinPreviewDialogProps {
  pin: Pin;
  imageUrl?: string;
  trigger?: React.ReactNode;
}

export function PinPreviewDialog({ pin, imageUrl, trigger }: PinPreviewDialogProps) {
  const [open, setOpen] = useState(false);

  const PinterestIcon = () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M12 0a12 12 0 0 0-4.37 23.17c-.1-.94-.2-2.4.04-3.44l1.42-6.03s-.36-.72-.36-1.79c0-1.68.97-2.94 2.18-2.94 1.03 0 1.53.77 1.53 1.7 0 1.04-.66 2.58-.99 4.02-.28 1.19.6 2.16 1.77 2.16 2.12 0 3.76-2.24 3.76-5.47 0-2.86-2.05-4.86-4.98-4.86-3.39 0-5.38 2.54-5.38 5.17 0 1.02.39 2.12.89 2.72.1.12.11.22.08.34l-.33 1.36c-.05.22-.18.27-.41.16-1.54-.72-2.5-2.96-2.5-4.76 0-3.87 2.81-7.43 8.11-7.43 4.26 0 7.56 3.03 7.56 7.08 0 4.23-2.67 7.63-6.37 7.63-1.24 0-2.41-.65-2.81-1.41l-.77 2.92c-.28 1.07-1.03 2.41-1.54 3.23A12 12 0 1 0 12 0z" />
    </svg>
  );

  const MobilePreview = () => (
    <div className="w-full max-w-[375px] mx-auto">
      {/* Mobile Device Frame */}
      <div className="bg-background border-4 border-foreground/20 rounded-[2.5rem] p-2 shadow-xl">
        <div className="bg-muted rounded-[2rem] overflow-hidden">
          {/* Status Bar */}
          <div className="h-6 bg-background flex items-center justify-between px-6 text-[10px]">
            <span>9:41</span>
            <div className="flex items-center gap-1">
              <div className="w-4 h-2 border border-current rounded-sm">
                <div className="w-2/3 h-full bg-current rounded-sm" />
              </div>
            </div>
          </div>

          {/* Pinterest Header */}
          <div className="bg-background px-4 py-2 flex items-center justify-between border-b">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ChevronDown className="h-5 w-5" />
            </Button>
            <PinterestIcon />
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </div>

          {/* Pin Content */}
          <ScrollArea className="h-[500px]">
            <div className="bg-background">
              {/* Image */}
              <div className="aspect-[2/3] bg-muted relative">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={pin.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <span className="text-sm">No image</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="px-4 py-3 flex items-center justify-between border-b">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-10 w-10">
                    <Heart className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-10 w-10">
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>
                <Button className="bg-[#e60023] hover:bg-[#ad081b] text-white rounded-full px-6">
                  Save
                </Button>
              </div>

              {/* Title & Description */}
              <div className="px-4 py-3 space-y-2">
                <h2 className="text-lg font-bold leading-tight">{pin.title}</h2>
                {pin.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {pin.description}
                  </p>
                )}
              </div>

              {/* Destination Link */}
              {pin.destination_url && (
                <div className="px-4 pb-3">
                  <a
                    href="#"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span className="truncate">
                      {new URL(pin.destination_url).hostname}
                    </span>
                  </a>
                </div>
              )}

              {/* Keywords as Topics */}
              {pin.keywords && pin.keywords.length > 0 && (
                <div className="px-4 pb-4">
                  <div className="flex flex-wrap gap-2">
                    {pin.keywords.slice(0, 5).map((keyword, i) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="rounded-full text-xs"
                      >
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );

  const DesktopPreview = () => (
    <div className="w-full max-w-[900px] mx-auto">
      {/* Browser Frame */}
      <div className="bg-muted border rounded-lg overflow-hidden shadow-xl">
        {/* Browser Header */}
        <div className="bg-background border-b px-4 py-2 flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-destructive/60" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
            <div className="w-3 h-3 rounded-full bg-green-500/60" />
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="bg-muted rounded-full px-4 py-1 text-xs text-muted-foreground flex items-center gap-2">
              <PinterestIcon />
              <span>pinterest.com/pin/...</span>
            </div>
          </div>
        </div>

        {/* Pinterest Page Content */}
        <div className="bg-background p-6">
          <div className="flex gap-6 max-w-4xl mx-auto">
            {/* Pin Image */}
            <div className="w-[400px] flex-shrink-0">
              <div className="aspect-[2/3] bg-muted rounded-2xl overflow-hidden">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={pin.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <span>No image</span>
                  </div>
                )}
              </div>
            </div>

            {/* Pin Details */}
            <div className="flex-1 py-4">
              {/* Actions Bar */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-10 w-10">
                    <Heart className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-10 w-10">
                    <Share2 className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-10 w-10">
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" className="rounded-full">
                    Select board
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                  <Button className="bg-[#e60023] hover:bg-[#ad081b] text-white rounded-full px-6">
                    Save
                  </Button>
                </div>
              </div>

              {/* Destination Link */}
              {pin.destination_url && (
                <a
                  href="#"
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:underline mb-4"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>{new URL(pin.destination_url).hostname}</span>
                </a>
              )}

              {/* Title */}
              <h1 className="text-2xl font-bold mb-3">{pin.title}</h1>

              {/* Description */}
              {pin.description && (
                <p className="text-muted-foreground leading-relaxed mb-4">
                  {pin.description}
                </p>
              )}

              {/* Keywords */}
              {pin.keywords && pin.keywords.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-2">Topics</h3>
                  <div className="flex flex-wrap gap-2">
                    {pin.keywords.map((keyword, i) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="rounded-full"
                      >
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA Type */}
              {pin.cta_type && (
                <div className="pt-4 border-t">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">
                    Call to Action: {pin.cta_type}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Eye className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Pin Preview
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="mobile" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full max-w-[300px] grid-cols-2 mx-auto">
            <TabsTrigger value="mobile" className="gap-2">
              <Smartphone className="h-4 w-4" />
              Mobile
            </TabsTrigger>
            <TabsTrigger value="desktop" className="gap-2">
              <Monitor className="h-4 w-4" />
              Desktop
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-auto mt-4 pb-4">
            <TabsContent value="mobile" className="mt-0 h-full">
              <MobilePreview />
            </TabsContent>
            <TabsContent value="desktop" className="mt-0 h-full">
              <DesktopPreview />
            </TabsContent>
          </div>
        </Tabs>

        {/* Pin Info Bar */}
        <div className="border-t pt-4 flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground">
              Type: <span className="text-foreground font-medium">{pin.pin_type || "N/A"}</span>
            </span>
            <span className="text-muted-foreground">
              SEO Score: <span className="text-foreground font-medium">{pin.seo_score || 0}</span>
            </span>
            <span className="text-muted-foreground">
              Status: <span className="text-foreground font-medium capitalize">{pin.status || "draft"}</span>
            </span>
          </div>
          {!imageUrl && (
            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
              Missing image
            </Badge>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
