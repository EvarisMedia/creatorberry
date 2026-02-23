import { useState } from "react";
import { useRequireApiKey } from "@/hooks/useRequireApiKey";
import { useBookBuilder } from "@/hooks/useBookBuilder";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { Check, Loader2, X, Sparkles, BookOpen, FileDown, SkipForward } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { OutlineSection } from "@/hooks/useProductOutlines";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  outlineId: string;
  sections: OutlineSection[];
  brandId: string;
  brandContext: any;
}

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
  const builder = useBookBuilder();

  const handleStart = async () => {
    if (!requireKey()) return;
    await builder.build({ sections, brandId, brandContext, contextAware });

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

  return (
    <Dialog open={open} onOpenChange={v => { if (!builder.isRunning) { builder.reset(); onOpenChange(v); } }}>
      <DialogContent className="max-w-lg">
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
              This will automatically expand and design all <strong>{sections.length}</strong> sections.
              Existing content and layouts will be preserved.
            </p>

            <div className="flex items-center gap-3 rounded-md border p-3">
              <Switch id="context-aware" checked={contextAware} onCheckedChange={setContextAware} />
              <div className="space-y-0.5">
                <Label htmlFor="context-aware" className="text-sm font-medium cursor-pointer">Context-aware writing</Label>
                <p className="text-xs text-muted-foreground">
                  Each chapter receives summaries of previous chapters for narrative coherence.
                </p>
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              Estimated time: ~{Math.ceil(sections.length * 0.5)} minutes
            </div>
          </div>
        )}

        {/* PROGRESS SCREEN */}
        {(builder.isRunning || builder.isDone) && (
          <div className="space-y-3 py-2">
            {builder.currentSection && (
              <p className="text-sm font-medium">
                {builder.currentSection.phase === "expanding" ? "📝 Writing" : "🎨 Designing"}
                {" "}Chapter {currentIdx + 1} of {builder.statuses.length}
                {contextAware && currentIdx > 0 && (
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
                  {(s.phase === "expanding" || s.phase === "designing") && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary shrink-0" />}
                  {s.phase === "pending" && <div className="w-3.5 h-3.5 rounded-full border border-border shrink-0" />}
                  <span className={`truncate ${s.phase === "skipped" ? "text-muted-foreground" : ""} ${s.phase === "error" ? "text-destructive" : ""}`}>
                    {i + 1}. {s.title}
                    {s.phase === "skipped" && " (already done)"}
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
