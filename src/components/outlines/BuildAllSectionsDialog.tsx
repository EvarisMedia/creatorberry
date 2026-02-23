import { useState, useRef } from "react";
import { useRequireApiKey } from "@/hooks/useRequireApiKey";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Check, Loader2, X, Sparkles, BookOpen } from "lucide-react";
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

interface SectionStatus {
  id: string;
  title: string;
  phase: "pending" | "expanding" | "designing" | "done" | "skipped" | "error";
  error?: string;
}

export default function BuildAllSectionsDialog({ open, onOpenChange, outlineId, sections, brandId, brandContext }: Props) {
  const navigate = useNavigate();
  const { requireKey } = useRequireApiKey();
  const [isRunning, setIsRunning] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [sectionStatuses, setSectionStatuses] = useState<SectionStatus[]>([]);
  const cancelRef = useRef(false);

  const startBuild = async () => {
    if (!requireKey()) return;
    cancelRef.current = false;
    setIsRunning(true);
    setIsDone(false);

    const statuses: SectionStatus[] = sections.map((s) => ({
      id: s.id,
      title: s.title,
      phase: "pending",
    }));
    setSectionStatuses([...statuses]);

    for (let i = 0; i < sections.length; i++) {
      if (cancelRef.current) break;
      const section = sections[i];

      // --- EXPAND phase ---
      statuses[i].phase = "expanding";
      setSectionStatuses([...statuses]);

      let contentId: string | null = null;
      let contentText: string | null = null;

      try {
        // Check if expansion already exists
        const { data: existing } = await supabase
          .from("expanded_content")
          .select("id, content, page_layouts")
          .eq("outline_section_id", section.id)
          .eq("mode", "expansion")
          .order("version", { ascending: false })
          .limit(1);

        if (existing && existing.length > 0) {
          contentId = existing[0].id;
          contentText = existing[0].content;

          // Check if already has layouts
          if (existing[0].page_layouts && Array.isArray(existing[0].page_layouts) && (existing[0].page_layouts as any[]).length > 0) {
            statuses[i].phase = "skipped";
            setSectionStatuses([...statuses]);
            continue;
          }
        } else {
          // Expand via edge function
          const response = await supabase.functions.invoke("expand-content", {
            body: {
              sectionId: section.id,
              mode: "expansion",
              brandId,
              sectionTitle: section.title,
              sectionDescription: section.description,
              subsections: section.subsections,
              wordCountTarget: section.word_count_target,
              brandContext,
            },
          });

          if (response.error) throw new Error(response.error.message || "Expand failed");
          if (response.data?.error) throw new Error(response.data.error);

          contentId = response.data?.content?.id || response.data?.contentId;
          contentText = response.data?.content?.content || response.data?.text;
        }
      } catch (err: any) {
        statuses[i].phase = "error";
        statuses[i].error = err.message;
        setSectionStatuses([...statuses]);
        continue;
      }

      if (cancelRef.current) break;

      // --- DESIGN phase ---
      statuses[i].phase = "designing";
      setSectionStatuses([...statuses]);

      try {
        if (contentId && contentText) {
          const layoutResponse = await supabase.functions.invoke("auto-layout-ebook", {
            body: {
              contentId,
              contentText,
              sectionTitle: section.title,
            },
          });

          if (layoutResponse.error) throw new Error(layoutResponse.error.message || "Design failed");
          if (layoutResponse.data?.error) throw new Error(layoutResponse.data.error);
        }
      } catch (err: any) {
        statuses[i].phase = "error";
        statuses[i].error = err.message;
        setSectionStatuses([...statuses]);
        continue;
      }

      statuses[i].phase = "done";
      setSectionStatuses([...statuses]);

      // Rate limit pause
      if (i < sections.length - 1) {
        await new Promise((r) => setTimeout(r, 1500));
      }
    }

    setIsRunning(false);
    setIsDone(true);

    const completed = statuses.filter((s) => s.phase === "done" || s.phase === "skipped").length;
    toast({
      title: "Build Complete!",
      description: `${completed} of ${sections.length} sections processed.`,
    });
  };

  const handleCancel = () => {
    cancelRef.current = true;
  };

  const completedCount = sectionStatuses.filter((s) => s.phase === "done" || s.phase === "skipped").length;
  const progressPercent = sectionStatuses.length > 0 ? (completedCount / sectionStatuses.length) * 100 : 0;
  const currentSection = sectionStatuses.find((s) => s.phase === "expanding" || s.phase === "designing");

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!isRunning) onOpenChange(v); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Build All Sections
          </DialogTitle>
        </DialogHeader>

        {!isRunning && !isDone && (
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              This will automatically expand and design all <strong>{sections.length}</strong> sections.
              Existing content and layouts will be preserved.
            </p>
            <div className="text-xs text-muted-foreground">
              Estimated time: ~{Math.ceil(sections.length * 0.5)} minutes
            </div>
          </div>
        )}

        {(isRunning || isDone) && (
          <div className="space-y-3 py-2">
            {currentSection && (
              <p className="text-sm font-medium">
                {currentSection.phase === "expanding" ? "📝 Expanding" : "🎨 Designing"}: {currentSection.title}
              </p>
            )}
            <Progress value={progressPercent} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {completedCount} / {sectionStatuses.length} sections
            </p>

            <div className="max-h-48 overflow-y-auto space-y-1 border rounded-md p-2">
              {sectionStatuses.map((s, i) => (
                <div key={s.id} className="flex items-center gap-2 text-xs">
                  {s.phase === "done" && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                  {s.phase === "skipped" && <Check className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                  {s.phase === "error" && <X className="w-3.5 h-3.5 text-destructive shrink-0" />}
                  {(s.phase === "expanding" || s.phase === "designing") && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary shrink-0" />}
                  {s.phase === "pending" && <div className="w-3.5 h-3.5 rounded-full border border-border shrink-0" />}
                  <span className={`truncate ${s.phase === "skipped" ? "text-muted-foreground" : ""}`}>
                    {i + 1}. {s.title}
                    {s.phase === "skipped" && " (already done)"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          {!isRunning && !isDone && (
            <>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={startBuild}>
                <Sparkles className="w-4 h-4 mr-2" /> Start Building
              </Button>
            </>
          )}
          {isRunning && (
            <Button variant="destructive" onClick={handleCancel}>
              <X className="w-4 h-4 mr-2" /> Stop
            </Button>
          )}
          {isDone && (
            <>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
              <Button onClick={() => { onOpenChange(false); navigate(`/content/${outlineId}`); }}>
                <BookOpen className="w-4 h-4 mr-2" /> Open Content Editor
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
