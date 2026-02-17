import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Paintbrush } from "lucide-react";
import { useState } from "react";

export interface PDFStyleConfig {
  fontFamily: "serif" | "sans-serif" | "mono";
  fontSize: "small" | "medium" | "large";
  headingColor: string;
  layout: "single" | "two-column";
  includeCoverPage: boolean;
  includeToc: boolean;
  headerText: string;
  footerText: string;
  pageSize: "6x9" | "5.5x8.5" | "8.5x11" | "8x8" | "a4" | "a4-landscape" | "a5" | "letter-landscape" | "16x9";
}

const DEFAULT_CONFIG: PDFStyleConfig = {
  fontFamily: "serif",
  fontSize: "medium",
  headingColor: "#1a1a2e",
  layout: "single",
  includeCoverPage: true,
  includeToc: true,
  headerText: "",
  footerText: "",
  pageSize: "6x9",
};

interface Props {
  config: PDFStyleConfig;
  onChange: (config: PDFStyleConfig) => void;
  variant?: "card" | "compact";
}

const PAGE_SIZE_OPTIONS = [
  { value: "6x9", label: '6×9" (Standard Ebook)' },
  { value: "5.5x8.5", label: '5.5×8.5" (Digest)' },
  { value: "8.5x11", label: '8.5×11" (Workbook)' },
  { value: "8x8", label: '8×8" (Square)' },
  { value: "a4", label: "A4 Portrait" },
  { value: "a4-landscape", label: "A4 Landscape" },
  { value: "a5", label: "A5 Portrait" },
  { value: "letter-landscape", label: "Letter Landscape" },
  { value: "16x9", label: "16:9 Landscape (Slides)" },
];

export function PDFStyleSettings({ config, onChange, variant = "card" }: Props) {
  const [open, setOpen] = useState(false);

  const update = (partial: Partial<PDFStyleConfig>) => {
    onChange({ ...config, ...partial });
  };

  if (variant === "compact") {
    return (
      <div className="flex flex-wrap items-center gap-3 px-1 py-2">
        {/* Page Size */}
        <div className="flex items-center gap-1.5">
          <Label className="text-xs text-muted-foreground whitespace-nowrap">Size</Label>
          <Select value={config.pageSize} onValueChange={(v) => update({ pageSize: v as PDFStyleConfig["pageSize"] })}>
            <SelectTrigger className="h-7 text-xs w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Font */}
        <div className="flex items-center gap-1.5">
          <Label className="text-xs text-muted-foreground">Font</Label>
          <Select value={config.fontFamily} onValueChange={(v) => update({ fontFamily: v as PDFStyleConfig["fontFamily"] })}>
            <SelectTrigger className="h-7 text-xs w-[110px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="serif">Serif</SelectItem>
              <SelectItem value="sans-serif">Sans-serif</SelectItem>
              <SelectItem value="mono">Monospace</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Color */}
        <div className="flex items-center gap-1.5">
          <Label className="text-xs text-muted-foreground">Color</Label>
          <Input
            type="color"
            value={config.headingColor}
            onChange={(e) => update({ headingColor: e.target.value })}
            className="w-7 h-7 p-0.5 cursor-pointer rounded"
          />
        </div>

        {/* Cover toggle */}
        <div className="flex items-center gap-1.5">
          <Switch id="cover-compact" checked={config.includeCoverPage} onCheckedChange={(v) => update({ includeCoverPage: v })} className="scale-75" />
          <Label htmlFor="cover-compact" className="text-xs text-muted-foreground cursor-pointer">Cover</Label>
        </div>

        {/* ToC toggle */}
        <div className="flex items-center gap-1.5">
          <Switch id="toc-compact" checked={config.includeToc} onCheckedChange={(v) => update({ includeToc: v })} className="scale-75" />
          <Label htmlFor="toc-compact" className="text-xs text-muted-foreground cursor-pointer">ToC</Label>
        </div>
      </div>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Paintbrush className="w-4 h-4 text-primary" />
                PDF & Course Styling
              </span>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-4 pt-0">
            <div className="grid grid-cols-2 gap-4">
              {/* Font Family */}
              <div className="space-y-1.5">
                <Label className="text-xs">Font Family</Label>
                <Select value={config.fontFamily} onValueChange={(v) => update({ fontFamily: v as PDFStyleConfig["fontFamily"] })}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="serif">Serif (Classic)</SelectItem>
                    <SelectItem value="sans-serif">Sans-serif (Modern)</SelectItem>
                    <SelectItem value="mono">Monospace (Technical)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Font Size */}
              <div className="space-y-1.5">
                <Label className="text-xs">Font Size</Label>
                <Select value={config.fontSize} onValueChange={(v) => update({ fontSize: v as PDFStyleConfig["fontSize"] })}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small (14px)</SelectItem>
                    <SelectItem value="medium">Medium (16px)</SelectItem>
                    <SelectItem value="large">Large (18px)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Heading Color */}
              <div className="space-y-1.5">
                <Label className="text-xs">Heading Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={config.headingColor}
                    onChange={(e) => update({ headingColor: e.target.value })}
                    className="w-10 h-9 p-1 cursor-pointer"
                  />
                  <Input
                    value={config.headingColor}
                    onChange={(e) => update({ headingColor: e.target.value })}
                    className="h-9 font-mono text-xs"
                    placeholder="#1a1a2e"
                  />
                </div>
              </div>

              {/* Layout */}
              <div className="space-y-1.5">
                <Label className="text-xs">Page Layout</Label>
                <Select value={config.layout} onValueChange={(v) => update({ layout: v as PDFStyleConfig["layout"] })}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single Column</SelectItem>
                    <SelectItem value="two-column">Two Column</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Page Size */}
              <div className="space-y-1.5">
                <Label className="text-xs">Page Size</Label>
                <Select value={config.pageSize} onValueChange={(v) => update({ pageSize: v as PDFStyleConfig["pageSize"] })}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Toggles */}
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <Switch id="cover" checked={config.includeCoverPage} onCheckedChange={(v) => update({ includeCoverPage: v })} />
                <Label htmlFor="cover" className="text-xs cursor-pointer">Cover Page</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="toc" checked={config.includeToc} onCheckedChange={(v) => update({ includeToc: v })} />
                <Label htmlFor="toc" className="text-xs cursor-pointer">Table of Contents</Label>
              </div>
            </div>

            {/* Header / Footer */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Header Text</Label>
                <Input
                  value={config.headerText}
                  onChange={(e) => update({ headerText: e.target.value })}
                  placeholder="e.g. My Course Name"
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Footer Text</Label>
                <Input
                  value={config.footerText}
                  onChange={(e) => update({ footerText: e.target.value })}
                  placeholder="e.g. © 2026 My Brand"
                  className="h-9 text-xs"
                />
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export { DEFAULT_CONFIG as DEFAULT_PDF_STYLE_CONFIG };
