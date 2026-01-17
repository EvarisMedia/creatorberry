import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Rss, Link, Lightbulb } from "lucide-react";
import { useContentSources, SourceType, FunnelStage, PriorityLevel } from "@/hooks/useContentSources";

const sourceSchema = z.object({
  source_type: z.enum(["rss_feed", "blog_url", "manual_idea"]),
  name: z.string().min(1, "Name is required"),
  url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  content: z.string().optional(),
  topic: z.string().optional(),
  funnel_stage: z.enum(["awareness", "authority", "conversion"]),
  priority: z.enum(["low", "medium", "high"]),
});

type SourceFormData = z.infer<typeof sourceSchema>;

interface AddSourceDialogProps {
  brandId: string;
}

const sourceTypeConfig = {
  rss_feed: { icon: Rss, label: "RSS Feed", requiresUrl: true },
  blog_url: { icon: Link, label: "Blog URL", requiresUrl: true },
  manual_idea: { icon: Lightbulb, label: "Manual Idea", requiresUrl: false },
};

export function AddSourceDialog({ brandId }: AddSourceDialogProps) {
  const [open, setOpen] = useState(false);
  const { createSource } = useContentSources(brandId);

  const form = useForm<SourceFormData>({
    resolver: zodResolver(sourceSchema),
    defaultValues: {
      source_type: "rss_feed",
      name: "",
      url: "",
      content: "",
      topic: "",
      funnel_stage: "awareness",
      priority: "medium",
    },
  });

  const sourceType = form.watch("source_type");

  const onSubmit = async (data: SourceFormData) => {
    await createSource.mutateAsync({
      brand_id: brandId,
      source_type: data.source_type as SourceType,
      name: data.name,
      url: data.url || undefined,
      content: data.content || undefined,
      topic: data.topic || undefined,
      funnel_stage: data.funnel_stage as FunnelStage,
      priority: data.priority as PriorityLevel,
    });
    form.reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Source
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Content Source</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Source Type Selection */}
            <FormField
              control={form.control}
              name="source_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Source Type</FormLabel>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(sourceTypeConfig) as SourceType[]).map((type) => {
                      const config = sourceTypeConfig[type];
                      const Icon = config.icon;
                      return (
                        <Button
                          key={type}
                          type="button"
                          variant={field.value === type ? "default" : "outline"}
                          className="flex flex-col h-auto py-3"
                          onClick={() => field.onChange(type)}
                        >
                          <Icon className="h-5 w-5 mb-1" />
                          <span className="text-xs">{config.label}</span>
                        </Button>
                      );
                    })}
                  </div>
                </FormItem>
              )}
            />

            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., TechCrunch AI News" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* URL (for RSS and Blog) */}
            {sourceTypeConfig[sourceType as SourceType]?.requiresUrl && (
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={
                          sourceType === "rss_feed"
                            ? "https://example.com/feed.xml"
                            : "https://example.com/blog"
                        }
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Content (for Manual Ideas) */}
            {sourceType === "manual_idea" && (
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Idea Content</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your content idea..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Topic */}
            <FormField
              control={form.control}
              name="topic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Topic (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., AI, Leadership, Marketing" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              {/* Funnel Stage */}
              <FormField
                control={form.control}
                name="funnel_stage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Funnel Stage</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="awareness">Awareness</SelectItem>
                        <SelectItem value="authority">Authority</SelectItem>
                        <SelectItem value="conversion">Conversion</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Priority */}
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createSource.isPending}>
                {createSource.isPending ? "Adding..." : "Add Source"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
