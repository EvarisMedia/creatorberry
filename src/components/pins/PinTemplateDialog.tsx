import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Layout, Loader2, Plus, Edit } from "lucide-react";
import { PinTemplate, CreatePinTemplateInput } from "@/hooks/usePinTemplates";

const formSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  description: z.string().optional(),
  pin_type: z.string().optional(),
  title_template: z.string().optional(),
  description_template: z.string().optional(),
  headline_template: z.string().optional(),
  cta_type: z.string().optional(),
  layout_style: z.string().optional(),
  color_emphasis: z.string().optional(),
  keywords: z.string().optional(),
  is_default: z.boolean().default(false),
});

type FormData = z.infer<typeof formSchema>;

const PIN_TYPES = [
  { value: "blog", label: "Blog Pin" },
  { value: "product", label: "Product Pin" },
  { value: "idea", label: "Idea Pin" },
  { value: "infographic", label: "Infographic" },
  { value: "listicle", label: "Listicle" },
  { value: "comparison", label: "Comparison" },
];

const CTA_TYPES = [
  { value: "save", label: "Save" },
  { value: "click", label: "Click" },
  { value: "shop", label: "Shop" },
  { value: "learn", label: "Learn More" },
];

const LAYOUT_STYLES = [
  { value: "minimal", label: "Minimal" },
  { value: "bold", label: "Bold" },
  { value: "elegant", label: "Elegant" },
  { value: "playful", label: "Playful" },
  { value: "professional", label: "Professional" },
];

const COLOR_STYLES = [
  { value: "vibrant", label: "Vibrant" },
  { value: "muted", label: "Muted" },
  { value: "monochrome", label: "Monochrome" },
  { value: "pastel", label: "Pastel" },
  { value: "dark", label: "Dark" },
];

interface PinTemplateDialogProps {
  brandId: string | null;
  template?: PinTemplate;
  onSave: (data: CreatePinTemplateInput) => Promise<void>;
  trigger?: React.ReactNode;
}

export function PinTemplateDialog({
  brandId,
  template,
  onSave,
  trigger,
}: PinTemplateDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      pin_type: "",
      title_template: "",
      description_template: "",
      headline_template: "",
      cta_type: "",
      layout_style: "",
      color_emphasis: "",
      keywords: "",
      is_default: false,
    },
  });

  useEffect(() => {
    if (template && open) {
      form.reset({
        name: template.name,
        description: template.description || "",
        pin_type: template.pin_type || "",
        title_template: template.title_template || "",
        description_template: template.description_template || "",
        headline_template: template.headline_template || "",
        cta_type: template.cta_type || "",
        layout_style: template.layout_style || "",
        color_emphasis: template.color_emphasis || "",
        keywords: template.keywords?.join(", ") || "",
        is_default: template.is_default || false,
      });
    } else if (!template && open) {
      form.reset({
        name: "",
        description: "",
        pin_type: "",
        title_template: "",
        description_template: "",
        headline_template: "",
        cta_type: "",
        layout_style: "",
        color_emphasis: "",
        keywords: "",
        is_default: false,
      });
    }
  }, [template, open, form]);

  const handleSubmit = async (data: FormData) => {
    setIsSaving(true);
    try {
      const keywords = data.keywords
        ? data.keywords.split(",").map((k) => k.trim()).filter(Boolean)
        : undefined;

      await onSave({
        brand_id: brandId || undefined,
        name: data.name,
        description: data.description || undefined,
        pin_type: data.pin_type || undefined,
        title_template: data.title_template || undefined,
        description_template: data.description_template || undefined,
        headline_template: data.headline_template || undefined,
        cta_type: data.cta_type || undefined,
        layout_style: data.layout_style || undefined,
        color_emphasis: data.color_emphasis || undefined,
        keywords,
        is_default: data.is_default,
      });
      setOpen(false);
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            {template ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {template ? "Edit" : "New Template"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layout className="h-5 w-5" />
            {template ? "Edit Pin Template" : "Create Pin Template"}
          </DialogTitle>
          <DialogDescription>
            Save layouts, styles, and copy structures to reuse when creating pins
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Template Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Blog Post Standard" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Brief description of this template" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pin_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pin Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PIN_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cta_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CTA Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select CTA" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CTA_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="layout_style"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Layout Style</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select layout" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {LAYOUT_STYLES.map((style) => (
                          <SelectItem key={style.value} value={style.value}>
                            {style.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="color_emphasis"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color Style</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select colors" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {COLOR_STYLES.map((style) => (
                          <SelectItem key={style.value} value={style.value}>
                            {style.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-sm">Copy Templates</h4>
              <p className="text-xs text-muted-foreground">
                Use placeholders like {"{{topic}}"}, {"{{brand}}"}, {"{{keyword}}"} for dynamic content
              </p>

              <FormField
                control={form.control}
                name="title_template"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title Template</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., {{number}} Ways to {{topic}} | {{brand}}" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="headline_template"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Headline Template</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Discover the secret to {{topic}}" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>The main text overlay on the pin image</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description_template"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description Template</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., Looking for {{topic}}? This guide covers everything you need to know about {{keyword}}. Click to learn more!"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="keywords"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Keywords</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="keyword1, keyword2, keyword3" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>Comma-separated list of default keywords</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="is_default"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Set as Default</FormLabel>
                    <FormDescription>
                      Use this template by default when creating new pins
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Layout className="mr-2 h-4 w-4" />
                    {template ? "Update Template" : "Save Template"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}