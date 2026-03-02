import { useState } from "react";
import { useRequireApiKey } from "@/hooks/useRequireApiKey";
import { useBookBuilder } from "@/hooks/useBookBuilder";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Check, Loader2, X, Sparkles, BookOpen, FileDown, SkipForward, Camera } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { OutlineSection } from "@/hooks/useProductOutlines";
import { BUILT_IN_THEMES, DesignTheme } from "@/components/content/ThemeGallery";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  outlineId: string;
  sections: OutlineSection[];
  brandId: string;
  brandContext: any;
}

const PAGE_SIZE_OPTIONS = [
  { value: "6x9", label: '6×9" (Standard Ebook)' },
  { value: "5.5x8.5", label: '5.5×8.5" (Digest)' },
  { value: "8.5x11", label: '8.5×11" (Workbook)' },
  { value: "8x8", label: '8×8" (Square)' },
  { value: "a4", label: "A4 Portrait" },
  { value: "a5", label: "A5 Portrait" },
  { value: "16x9", label: "16:9 Landscape (Slides)" },
];

const IMAGE_STYLES = ["Modern", "Minimal", "Bold", "Watercolor", "Flat", "Professional"];

function formatTime(ms: number): string {
  const seconds = Math.ceil(ms / 1000);
  if (seconds < 60) return `~${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return remaining > 0 ? `~${minutes}m ${remaining}s` : `~${minutes}m`;
}

export default function BuildAllSectionsDialog({ open, onOpenChange, outlineId, sections, brandId, brandContext }: Props) {
  const navigate = useNavigate();
  const { requireKey } = useRequireApiKey();
  const [contextAware, setContextAware] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState<DesignTheme>(BUILT_IN_THEMES[0]);
  const [pageSize, setPageSize] = useState("6x9");
  const [generateImages, setGenerateImages] = useState(false);
  const [imagesPerChapter, setImagesPerChapter] = useState(1);
  const [imageStyle, setImageStyle] = useState("Modern");
  const builder = useBookBuilder();

  const handleStart = async () => {
    if (!requireKey()) return;

    // Save theme + page size to outline's pdf_style_config
    await supabase.from("product_outlines").update({
      pdf_style_config: {
        fontFamily: selectedTheme.fontFamily,
        fontSize: selectedTheme.fontSize,
        headingColor: selectedTheme.headingColor,
        accentColor: selectedTheme.accentColor,
        backgroundColor: selectedTheme.backgroundColor,
        bodyColor: selectedTheme.bodyColor,
        themeName: selectedTheme.name,
        pageSize,
        layout: "single",
        includeCoverPage: true,
        includeToc: true,
        headerText: "",
        footerText: "",
      },
    }).eq("id", outlineId);

    await builder.build({
      sections,
      brandId,
      brandContext,
      contextAware,
      generateImages,
      imagesPerChapter,
      imageStyle,
      themeName: selectedTheme.name,
      pageSize,
    });

    const completed = builder.statuses.filter(s => s.phase === "done" || s.phase === "skipped").length;
    toast({
      title: "Build Complete!",
      description: `${completed} of ${sections.length} sections processed.`,
    });
  };

  const handleClose = () => {
    if (!builder.isRunning) {
      builder.reset();
      onOpenChange(false);
    }
  };

  const currentIdx = builder.currentSection
    ? builder.statuses.findIndex(s => s.id === builder.currentSection!.id)
    : -1;

  const baseMinutes = sections.length * 0.5;
  const imageMinutes = generateImages ? (sections.length * imagesPerChapter * 0.3) : 0;
  const totalMinutes = Math.ceil(baseMinutes + imageMinutes);

  return (
    <Dialog open={open} onOpenChange={v => { if (!builder.isRunning) { builder.reset(); onOpenChange(v); } }}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Build All Sections
          </DialogTitle>
        </DialogHeader>

        {/* PRE-BUILD SCREEN */}
        {!builder.isRunning && !builder.isDone && (
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Configure your product design, then build all <strong>{sections.length}</strong> sections automatically.
            </p>

            {/* Theme Picker */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Design Theme</Label>
              <div className="grid grid-cols-4 gap-2">
                {BUILT_IN_THEMES.map((theme) => (
                  <button
                    key={theme.name}
                    onClick={() => setSelectedTheme(theme)}
                    className={`rounded-lg border-2 p-2 text-left transition-all hover:shadow-sm ${
                      selectedTheme.name === theme.name ? "border-primary ring-1 ring-primary" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex gap-0.5 mb-1.5">
                      <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: theme.headingColor }} />
                      <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: theme.accentColor }} />
                      <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: theme.backgroundColor }} />
                    </div>
                    <p className="text-[10px] font-medium truncate">{theme.name}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Page Size */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Page Size</Label>
              <Select value={pageSize} onValueChange={setPageSize}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Context-aware toggle */}
            <div className="flex items-center gap-3 rounded-md border p-3">
              <Switch id="context-aware" checked={contextAware} onCheckedChange={setContextAware} />
              <div className="space-y-0.5">
                <Label htmlFor="context-aware" className="text-sm font-medium cursor-pointer">Context-aware writing</Label>
                <p className="text-xs text-muted-foreground">
                  Each chapter receives summaries of previous chapters for narrative coherence.
                </p>
              </div>
            </div>

            {/* Auto-generate images toggle */}
            <div className="rounded-md border p-3 space-y-3">
              <div className="flex items-center gap-3">
                <Switch id="auto-images" checked={generateImages} onCheckedChange={setGenerateImages} />
                <div className="space-y-0.5">
                  <Label htmlFor="auto-images" className="text-sm font-medium cursor-pointer">Auto-generate images</Label>
                  <p className="text-xs text-muted-foreground">
                    Generate AI images for each chapter during the build.
                  </p>
                </div>
              </div>

              {generateImages && (
                <div className="space-y-3 pl-1 border-l-2 border-primary/20 ml-5">
                  {/* Images per chapter */}
                  <div className="space-y-1.5 pl-3">
                    <Label className="text-xs font-medium">Images per chapter</Label>
                    <div className="flex gap-2">
                      {[1, 2, 3].map(n => (
                        <Button
                          key={n}
                          size="sm"
                          variant={imagesPerChapter === n ? "default" : "outline"}
                          className="h-7 w-8 text-xs"
                          onClick={() => setImagesPerChapter(n)}
                        >
                          {n}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Image style */}
                  <div className="space-y-1.5 pl-3">
                    <Label className="text-xs font-medium">Image style</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {IMAGE_STYLES.map(s => (
                        <Badge
                          key={s}
                          variant={imageStyle === s ? "default" : "outline"}
                          className="cursor-pointer text-xs"
                          onClick={() => setImageStyle(s)}
                        >
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="text-xs text-muted-foreground">
              Estimated time: ~{totalMinutes} minute{totalMinutes !== 1 ? "s" : ""}
            </div>
          </div>
        )}

        {/* PROGRESS SCREEN */}
        {(builder.isRunning || builder.isDone) && (
          <div className="space-y-3 py-2">
            {builder.currentSection && (
              <p className="text-sm font-medium">
                {builder.currentSection.phase === "expanding" ? "📝 Writing" : builder.currentSection.phase === "imaging" ? "📷 Generating images for" : "🎨 Designing"}
                {" "}Chapter {currentIdx + 1} of {builder.statuses.length}
                {contextAware && currentIdx > 0 && builder.currentSection.phase === "expanding" && (
                  <span className="text-muted-foreground font-normal">
                    {" "}(with context from chapters 1–{currentIdx})
                  </span>
                )}
                : {builder.currentSection.title}
              </p>
            )}
            <Progress value={builder.progressPercent} className="h-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{builder.completedCount} / {builder.statuses.length} sections</span>
              {builder.isRunning && builder.estimatedRemainingMs > 0 && (
                <span>{formatTime(builder.estimatedRemainingMs)} remaining</span>
              )}
              {builder.isDone && builder.errorCount > 0 && (
                <span className="text-destructive">{builder.errorCount} error{builder.errorCount > 1 ? "s" : ""}</span>
              )}
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1 border rounded-md p-2">
              {builder.statuses.map((s, i) => (
                <div key={s.id} className="flex items-center gap-2 text-xs">
                  {s.phase === "done" && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                  {s.phase === "skipped" && <SkipForward className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                  {s.phase === "error" && <X className="w-3.5 h-3.5 text-destructive shrink-0" />}
                  {s.phase === "imaging" && <Camera className="w-3.5 h-3.5 animate-pulse text-primary shrink-0" />}
                  {(s.phase === "expanding" || s.phase === "designing") && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary shrink-0" />}
                  {s.phase === "pending" && <div className="w-3.5 h-3.5 rounded-full border border-border shrink-0" />}
                  <span className={`truncate ${s.phase === "skipped" ? "text-muted-foreground" : ""} ${s.phase === "error" ? "text-destructive" : ""}`}>
                    {i + 1}. {s.title}
                    {s.phase === "skipped" && " (already done)"}
                    {s.phase === "imaging" && " — generating images…"}
                    {s.phase === "error" && s.error && ` — ${s.error}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {!builder.isRunning && !builder.isDone && (
            <>
              <Button variant="ghost" onClick={handleClose}>Cancel</Button>
              <Button onClick={handleStart}>
                <Sparkles className="w-4 h-4 mr-2" /> Start Building
              </Button>
            </>
          )}
          {builder.isRunning && (
            <Button variant="destructive" onClick={builder.cancel}>
              <X className="w-4 h-4 mr-2" /> Stop
            </Button>
          )}
          {builder.isDone && (
            <>
              <Button variant="ghost" onClick={handleClose}>Close</Button>
              <Button variant="outline" onClick={() => { handleClose(); navigate(`/export-center`); }}>
                <FileDown className="w-4 h-4 mr-2" /> Export PDF
              </Button>
              <Button onClick={() => { handleClose(); navigate(`/content/${outlineId}`); }}>
                <BookOpen className="w-4 h-4 mr-2" /> Open Content Editor
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
