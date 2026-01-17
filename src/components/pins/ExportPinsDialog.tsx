import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Download, FileArchive, FileText, Loader2, ImageIcon } from "lucide-react";
import { Pin } from "@/hooks/usePins";
import { toast } from "sonner";
import JSZip from "jszip";

interface PinWithImage extends Pin {
  imageUrl?: string;
}

interface ExportPinsDialogProps {
  pins: Pin[];
  brandName: string;
  getImageUrl: (pinId: string) => string | undefined;
}

export function ExportPinsDialog({ pins, brandName, getImageUrl }: ExportPinsDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedPins, setSelectedPins] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);

  const pinsWithImages: PinWithImage[] = pins.map((pin) => ({
    ...pin,
    imageUrl: getImageUrl(pin.id),
  }));

  const togglePin = (pinId: string) => {
    const newSelected = new Set(selectedPins);
    if (newSelected.has(pinId)) {
      newSelected.delete(pinId);
    } else {
      newSelected.add(pinId);
    }
    setSelectedPins(newSelected);
  };

  const toggleAll = () => {
    if (selectedPins.size === pinsWithImages.length) {
      setSelectedPins(new Set());
    } else {
      setSelectedPins(new Set(pinsWithImages.map((p) => p.id)));
    }
  };

  const generateCopyText = (pin: PinWithImage): string => {
    const lines: string[] = [];
    lines.push(`TITLE: ${pin.title}`);
    lines.push("");
    if (pin.description) {
      lines.push(`DESCRIPTION:`);
      lines.push(pin.description);
      lines.push("");
    }
    if (pin.keywords?.length) {
      lines.push(`KEYWORDS: ${pin.keywords.join(", ")}`);
      lines.push("");
    }
    if (pin.destination_url) {
      lines.push(`DESTINATION URL: ${pin.destination_url}`);
      lines.push("");
    }
    if (pin.cta_type) {
      lines.push(`CTA TYPE: ${pin.cta_type}`);
    }
    if (pin.pin_type) {
      lines.push(`PIN TYPE: ${pin.pin_type}`);
    }
    if (pin.seo_score) {
      lines.push(`SEO SCORE: ${pin.seo_score}`);
    }
    return lines.join("\n");
  };

  const sanitizeFilename = (name: string): string => {
    return name
      .replace(/[^a-z0-9\s-]/gi, "")
      .replace(/\s+/g, "-")
      .slice(0, 50);
  };

  const fetchImageAsBlob = async (url: string): Promise<Blob | null> => {
    try {
      const response = await fetch(url);
      if (!response.ok) return null;
      return await response.blob();
    } catch {
      return null;
    }
  };

  const handleExportZip = async () => {
    if (selectedPins.size === 0) {
      toast.error("Please select at least one pin to export");
      return;
    }

    setIsExporting(true);
    const zip = new JSZip();
    const selectedPinsList = pinsWithImages.filter((p) => selectedPins.has(p.id));

    try {
      for (let i = 0; i < selectedPinsList.length; i++) {
        const pin = selectedPinsList[i];
        const folderName = `${String(i + 1).padStart(2, "0")}-${sanitizeFilename(pin.title)}`;
        const folder = zip.folder(folderName);

        if (folder) {
          // Add copy text file
          folder.file("copy.txt", generateCopyText(pin));

          // Add image if available
          if (pin.imageUrl) {
            const imageBlob = await fetchImageAsBlob(pin.imageUrl);
            if (imageBlob) {
              const extension = imageBlob.type.split("/")[1] || "png";
              folder.file(`image.${extension}`, imageBlob);
            }
          }
        }
      }

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${sanitizeFilename(brandName)}-pins-export.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${selectedPins.size} pins as ZIP`);
      setOpen(false);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export pins");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadSingle = async (pin: PinWithImage) => {
    setIsExporting(true);
    try {
      const zip = new JSZip();
      const folderName = sanitizeFilename(pin.title);
      const folder = zip.folder(folderName);

      if (folder) {
        folder.file("copy.txt", generateCopyText(pin));

        if (pin.imageUrl) {
          const imageBlob = await fetchImageAsBlob(pin.imageUrl);
          if (imageBlob) {
            const extension = imageBlob.type.split("/")[1] || "png";
            folder.file(`image.${extension}`, imageBlob);
          }
        }
      }

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${folderName}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Pin exported successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export pin");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadCopyOnly = (pin: PinWithImage) => {
    const text = generateCopyText(pin);
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${sanitizeFilename(pin.title)}-copy.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Copy downloaded");
  };

  const handleDownloadImageOnly = async (pin: PinWithImage) => {
    if (!pin.imageUrl) {
      toast.error("No image available for this pin");
      return;
    }

    try {
      const imageBlob = await fetchImageAsBlob(pin.imageUrl);
      if (imageBlob) {
        const url = URL.createObjectURL(imageBlob);
        const link = document.createElement("a");
        link.href = url;
        const extension = imageBlob.type.split("/")[1] || "png";
        link.download = `${sanitizeFilename(pin.title)}.${extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success("Image downloaded");
      }
    } catch {
      toast.error("Failed to download image");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Export Pins</DialogTitle>
          <DialogDescription>
            Select pins to export with their copy and images
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between py-2 border-b">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selectedPins.size === pinsWithImages.length && pinsWithImages.length > 0}
              onCheckedChange={toggleAll}
            />
            <span className="text-sm font-medium">
              Select All ({pinsWithImages.length} pins)
            </span>
          </div>
          <Badge variant="secondary">
            {selectedPins.size} selected
          </Badge>
        </div>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-2 py-2">
            {pinsWithImages.map((pin) => (
              <div
                key={pin.id}
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <Checkbox
                  checked={selectedPins.has(pin.id)}
                  onCheckedChange={() => togglePin(pin.id)}
                />
                
                {/* Thumbnail */}
                <div className="h-16 w-12 rounded bg-muted overflow-hidden flex-shrink-0">
                  {pin.imageUrl ? (
                    <img
                      src={pin.imageUrl}
                      alt={pin.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Pin Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm line-clamp-1">{pin.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {pin.description || "No description"}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {pin.pin_type && (
                      <Badge variant="outline" className="text-[10px] h-5">
                        {pin.pin_type}
                      </Badge>
                    )}
                    {pin.imageUrl && (
                      <Badge variant="secondary" className="text-[10px] h-5">
                        Has image
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Individual Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleDownloadCopyOnly(pin)}
                    title="Download copy only"
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                  {pin.imageUrl && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDownloadImageOnly(pin)}
                      title="Download image only"
                    >
                      <ImageIcon className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleDownloadSingle(pin)}
                    title="Download as ZIP"
                  >
                    <FileArchive className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleExportZip}
            disabled={selectedPins.size === 0 || isExporting}
          >
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileArchive className="mr-2 h-4 w-4" />
            )}
            Export {selectedPins.size > 0 ? `${selectedPins.size} Pins` : "Selected"} as ZIP
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
