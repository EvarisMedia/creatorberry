import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { OutlineSection } from "@/hooks/useProductOutlines";

export type SectionPhase = "pending" | "expanding" | "designing" | "imaging" | "done" | "skipped" | "error";

export interface BuildSectionStatus {
  id: string;
  title: string;
  phase: SectionPhase;
  error?: string;
  startedAt?: number;
  finishedAt?: number;
}

export interface BookBuilderState {
  isRunning: boolean;
  isDone: boolean;
  statuses: BuildSectionStatus[];
  elapsedMs: number;
}

interface BuildOptions {
  sections: OutlineSection[];
  brandId: string;
  brandContext: any;
  contextAware: boolean;
  generateImages: boolean;
  imagesPerChapter: number;
  imageStyle: string;
  themeName?: string;
  pageSize?: string;
}

export function useBookBuilder() {
  const [isRunning, setIsRunning] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [statuses, setStatuses] = useState<BuildSectionStatus[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null);
  const cancelRef = useRef(false);

  const reset = useCallback(() => {
    setIsRunning(false);
    setIsDone(false);
    setStatuses([]);
    setStartTime(null);
    cancelRef.current = false;
  }, []);

  const cancel = useCallback(() => {
    cancelRef.current = true;
  }, []);

  const updateStatus = (idx: number, updates: Partial<BuildSectionStatus>) => {
    setStatuses(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...updates };
      return next;
    });
  };

  const build = useCallback(async ({ sections, brandId, brandContext, contextAware, generateImages, imagesPerChapter, imageStyle, themeName, pageSize }: BuildOptions) => {
    cancelRef.current = false;
    setIsRunning(true);
    setIsDone(false);
    const now = Date.now();
    setStartTime(now);

    const initial: BuildSectionStatus[] = sections.map(s => ({
      id: s.id,
      title: s.title,
      phase: "pending",
    }));
    setStatuses(initial);

    // Build table of contents for context-aware mode
    const tableOfContents = contextAware
      ? sections.map(s => ({ title: s.title, description: s.description }))
      : undefined;

    const chapterSummaries: { title: string; summary: string }[] = [];

    // Get current user id for image inserts
    let userId: string | null = null;
    if (generateImages) {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id || null;
    }

    for (let i = 0; i < sections.length; i++) {
      if (cancelRef.current) break;
      const section = sections[i];

      // --- EXPAND phase ---
      updateStatus(i, { phase: "expanding", startedAt: Date.now() });

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

          // If already has layouts, skip entirely
          if (existing[0].page_layouts && Array.isArray(existing[0].page_layouts) && (existing[0].page_layouts as any[]).length > 0) {
            updateStatus(i, { phase: "skipped", finishedAt: Date.now() });
            if (contextAware && contentText) {
              chapterSummaries.push({
                title: section.title,
                summary: contentText.slice(0, 300) + "...",
              });
            }
            continue;
          }
        } else {
          // Expand via edge function with context
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
              ...(contextAware && tableOfContents ? { tableOfContents } : {}),
              ...(contextAware && chapterSummaries.length > 0 ? { previousChapters: chapterSummaries } : {}),
            },
          });

          if (response.error) throw new Error(response.error.message || "Expand failed");
          if (response.data?.error) throw new Error(response.data.error);

          contentId = response.data?.content?.id || response.data?.contentId;
          contentText = response.data?.content?.content || response.data?.text;

          if (contextAware && response.data?.chapterSummary) {
            chapterSummaries.push({
              title: section.title,
              summary: response.data.chapterSummary,
            });
          } else if (contextAware && contentText) {
            chapterSummaries.push({
              title: section.title,
              summary: contentText.slice(0, 300) + "...",
            });
          }
        }
      } catch (err: any) {
        updateStatus(i, { phase: "error", error: err.message, finishedAt: Date.now() });
        continue;
      }

      if (cancelRef.current) break;

      // --- DESIGN phase ---
      updateStatus(i, { phase: "designing" });

      try {
        if (contentId && contentText) {
          const layoutResponse = await supabase.functions.invoke("auto-layout-ebook", {
            body: {
              contentId,
              content: contentText,
              sectionTitle: section.title,
              pageSize: pageSize || "6x9",
              generateImages,
              ...(themeName ? { themeName } : {}),
            },
          });

          if (layoutResponse.error) throw new Error(layoutResponse.error.message || "Design failed");
          if (layoutResponse.data?.error) throw new Error(layoutResponse.data.error);

          // Save the AI-generated page layouts to the database
          const pages = layoutResponse.data?.pages || [];
          if (pages.length > 0) {
            const pageLayouts = pages.map((p: any, idx: number) => ({
              id: crypto.randomUUID(),
              layout: p.layout,
              content: {
                heading: p.heading || undefined,
                subheading: p.subheading || undefined,
                body: p.body || undefined,
                image: p.image || undefined,
                items: p.items || undefined,
                quote: p.quote || undefined,
                attribution: p.attribution || undefined,
              },
              order: idx,
            }));

            await supabase
              .from("expanded_content")
              .update({ page_layouts: pageLayouts })
              .eq("id", contentId);
          }
        }
      } catch (err: any) {
        updateStatus(i, { phase: "error", error: err.message, finishedAt: Date.now() });
        continue;
      }

      if (cancelRef.current) break;

      // --- IMAGING phase ---
      if (generateImages && imagesPerChapter > 0 && userId) {
        updateStatus(i, { phase: "imaging" });

        const imageTypes = ["section_infographic", "chapter_illustration", "diagram"];
        const generatedImageUrls: string[] = [];

        try {
          for (let imgIdx = 0; imgIdx < imagesPerChapter; imgIdx++) {
            if (cancelRef.current) break;
            const imageType = imageTypes[imgIdx % imageTypes.length];

            const response = await supabase.functions.invoke("generate-image", {
              body: {
                brand: {
                  name: brandContext.name,
                  primary_color: brandContext.primary_color || "#000000",
                  secondary_color: brandContext.secondary_color || "#ffffff",
                  tone: brandContext.tone,
                },
                quote_text: section.title,
                style: imageStyle,
                image_type: imageType,
                aspect_ratio: "16:9",
                section_context: {
                  title: section.title,
                  description: section.description,
                  subsections: section.subsections,
                },
              },
            });

            if (response.data?.image_url) {
              generatedImageUrls.push(response.data.image_url);
              await supabase.from("generated_images").insert({
                user_id: userId,
                brand_id: brandId,
                image_url: response.data.image_url,
                prompt: response.data.prompt || "",
                image_type: imageType,
                quote_text: section.title,
                style: imageStyle,
                section_id: section.id,
              });
            }
          }

          // Inject generated images into page layouts
          if (generatedImageUrls.length > 0 && contentId) {
            const { data: ec } = await supabase
              .from("expanded_content")
              .select("page_layouts")
              .eq("id", contentId)
              .single();

            if (ec?.page_layouts && Array.isArray(ec.page_layouts)) {
              const layouts = ec.page_layouts as any[];
              let imgIdx = 0;

              // Fill image-capable layouts first
              for (const page of layouts) {
                if (imgIdx >= generatedImageUrls.length) break;
                if (["text-image", "image-text", "full-image"].includes(page.layout) && !page.content?.image) {
                  if (!page.content) page.content = {};
                  page.content.image = generatedImageUrls[imgIdx];
                  imgIdx++;
                }
              }

              // Add remaining images as full-image pages
              while (imgIdx < generatedImageUrls.length) {
                layouts.push({
                  id: crypto.randomUUID(),
                  layout: "full-image",
                  content: { image: generatedImageUrls[imgIdx], heading: section.title },
                  order: layouts.length,
                });
                imgIdx++;
              }

              await supabase
                .from("expanded_content")
                .update({ page_layouts: layouts })
                .eq("id", contentId);
            }
          }
        } catch (err: any) {
          updateStatus(i, { phase: "error", error: err.message, finishedAt: Date.now() });
          continue;
        }
      }

      updateStatus(i, { phase: "done", finishedAt: Date.now() });

      // Rate limit pause
      if (i < sections.length - 1) {
        await new Promise(r => setTimeout(r, 1500));
      }
    }

    setIsRunning(false);
    setIsDone(true);
  }, []);

  // Derived stats
  const completedCount = statuses.filter(s => s.phase === "done" || s.phase === "skipped").length;
  const errorCount = statuses.filter(s => s.phase === "error").length;
  const progressPercent = statuses.length > 0 ? (completedCount / statuses.length) * 100 : 0;
  const currentSection = statuses.find(s => s.phase === "expanding" || s.phase === "designing" || s.phase === "imaging");

  // Estimate remaining time
  const completedWithTime = statuses.filter(s => s.finishedAt && s.startedAt && s.phase !== "skipped");
  const avgTimeMs = completedWithTime.length > 0
    ? completedWithTime.reduce((sum, s) => sum + ((s.finishedAt || 0) - (s.startedAt || 0)), 0) / completedWithTime.length
    : 30000;
  const remainingCount = statuses.filter(s => s.phase === "pending" || s.phase === "expanding" || s.phase === "designing" || s.phase === "imaging").length;
  const estimatedRemainingMs = remainingCount * avgTimeMs;

  return {
    isRunning,
    isDone,
    statuses,
    completedCount,
    errorCount,
    progressPercent,
    currentSection,
    estimatedRemainingMs,
    build,
    cancel,
    reset,
  };
}
