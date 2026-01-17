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
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, LayoutTemplate, X } from "lucide-react";
import { usePins, GeneratedPin } from "@/hooks/usePins";
import { useBoards } from "@/hooks/useBoards";
import { usePinTemplates, PinTemplate } from "@/hooks/usePinTemplates";
import { toast } from "sonner";

const formSchema = z.object({
  sourceName: z.string().min(1, "Source name is required"),
  sourceContent: z.string().min(10, "Content must be at least 10 characters"),
  sourceUrl: z.string().url().optional().or(z.literal("")),
  pinType: z.string().min(1, "Pin type is required"),
  boardId: z.string().optional(),
  numberOfVariations: z.number().min(1).max(10),
  ctaType: z.string().optional(),
  layoutStyle: z.string().optional(),
  colorEmphasis: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface Brand {
  id: string;
  name: string;
  niche?: string | null;
  primary_keywords?: string[] | null;
  pin_design_style?: string | null;
  target_audience?: string | null;
}

interface GeneratePinsDialogProps {
  brand: Brand;
}

const PIN_TYPES = [
  { value: "blog", label: "Blog Pin", description: "Drive traffic to blog posts" },
  { value: "product", label: "Product Pin", description: "Showcase products" },
  { value: "idea", label: "Idea Pin", description: "Multi-slide storytelling" },
  { value: "infographic", label: "Infographic", description: "Data-driven visuals" },
  { value: "listicle", label: "Listicle", description: "List-based content" },
  { value: "comparison", label: "Comparison", description: "Before/after content" },
];

const CTA_TYPES = [
  { value: "save", label: "Save" },
  { value: "click", label: "Click" },
  { value: "shop", label: "Shop" },
  { value: "learn", label: "Learn More" },
];

const LAYOUT_STYLES = [
  { value: "minimal", label: "Minimal" },
  { value: "bold-text", label: "Bold Text" },
  { value: "lifestyle", label: "Lifestyle" },
  { value: "infographic", label: "Infographic" },
];

export function GeneratePinsDialog({ brand }: GeneratePinsDialogProps) {
  const [open, setOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPins, setGeneratedPins] = useState<GeneratedPin[]>([]);
  const [step, setStep] = useState<"input" | "review">("input");
  const [selectedTemplate, setSelectedTemplate] = useState<PinTemplate | null>(null);

  const { generatePins, createPinWithVariations } = usePins(brand.id);
  const { boards } = useBoards(brand.id);
  const { templates, isLoading: templatesLoading } = usePinTemplates(brand.id);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sourceName: "",
      sourceContent: "",
      sourceUrl: "",
      pinType: "blog",
      boardId: "",
      numberOfVariations: 3,
      ctaType: "",
      layoutStyle: "",
      colorEmphasis: "",
    },
  });

  // Apply template defaults when dialog opens
  useEffect(() => {
    if (open && templates && !selectedTemplate) {
      const defaultTemplate = templates.find((t) => t.is_default);
      if (defaultTemplate) {
        applyTemplate(defaultTemplate);
      }
    }
  }, [open, templates]);

  const applyTemplate = (template: PinTemplate) => {
    setSelectedTemplate(template);
    
    if (template.pin_type) {
      form.setValue("pinType", template.pin_type);
    }
    if (template.cta_type) {
      form.setValue("ctaType", template.cta_type);
    }
    if (template.layout_style) {
      form.setValue("layoutStyle", template.layout_style);
    }
    if (template.color_emphasis) {
      form.setValue("colorEmphasis", template.color_emphasis);
    }
    
    toast.success(`Applied template: ${template.name}`);
  };

  const clearTemplate = () => {
    setSelectedTemplate(null);
    form.setValue("ctaType", "");
    form.setValue("layoutStyle", "");
    form.setValue("colorEmphasis", "");
  };

  const selectedBoardId = form.watch("boardId");
  const selectedBoard = boards.find((b) => b.id === selectedBoardId);

  const handleGenerate = async (data: FormData) => {
    setIsGenerating(true);
    try {
      const pins = await generatePins.mutateAsync({
        sourceContent: data.sourceContent,
        sourceName: data.sourceName,
        sourceUrl: data.sourceUrl || undefined,
        pinType: data.pinType,
        brandContext: {
          name: brand.name,
          niche: brand.niche || undefined,
          primaryKeywords: brand.primary_keywords || undefined,
          pinDesignStyle: brand.pin_design_style || undefined,
          targetAudience: brand.target_audience || undefined,
        },
        boardKeywords: selectedBoard?.keywords || undefined,
        numberOfVariations: data.numberOfVariations,
      });

      setGeneratedPins(pins);
      setStep("review");
      toast.success(`Generated ${pins.length} pin variations!`);
    } catch (error) {
      console.error("Generation error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSavePin = async (pin: GeneratedPin, index: number) => {
    const formData = form.getValues();
    
    try {
      await createPinWithVariations.mutateAsync({
        pin: {
          brand_id: brand.id,
          board_id: formData.boardId || undefined,
          title: pin.title,
          description: pin.description,
          destination_url: formData.sourceUrl || undefined,
          keywords: pin.keywords,
          seo_score: pin.seoScore,
          pin_type: formData.pinType,
          cta_type: pin.ctaType,
          source_context: formData.sourceContent.substring(0, 500),
        },
        variations: [
          {
            headline: pin.headline,
            description_variation: pin.description,
            layout_style: pin.layoutStyle,
          },
        ],
      });

      // Remove from list
      setGeneratedPins((prev) => prev.filter((_, i) => i !== index));

      if (generatedPins.length === 1) {
        handleClose();
      }
    } catch (error) {
      console.error("Save error:", error);
    }
  };

  const handleSaveAll = async () => {
    const formData = form.getValues();

    for (const pin of generatedPins) {
      try {
        await createPinWithVariations.mutateAsync({
          pin: {
            brand_id: brand.id,
            board_id: formData.boardId || undefined,
            title: pin.title,
            description: pin.description,
            destination_url: formData.sourceUrl || undefined,
            keywords: pin.keywords,
            seo_score: pin.seoScore,
            pin_type: formData.pinType,
            cta_type: pin.ctaType,
            source_context: formData.sourceContent.substring(0, 500),
          },
          variations: [
            {
              headline: pin.headline,
              description_variation: pin.description,
              layout_style: pin.layoutStyle,
            },
          ],
        });
      } catch (error) {
        console.error("Save error:", error);
      }
    }

    toast.success(`Saved ${generatedPins.length} pins!`);
    handleClose();
  };

  const handleClose = () => {
    setOpen(false);
    setStep("input");
    setGeneratedPins([]);
    setSelectedTemplate(null);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : handleClose())}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Sparkles className="h-4 w-4" />
          Generate Pins
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === "input" ? "Generate AI-Powered Pins" : "Review Generated Pins"}
          </DialogTitle>
          <DialogDescription>
            {step === "input"
              ? "Enter your content and let AI create SEO-optimized Pinterest pins"
              : "Review and save your generated pins"}
          </DialogDescription>
        </DialogHeader>

        {step === "input" ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleGenerate)} className="space-y-6">
              <FormField
                control={form.control}
                name="sourceName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 10 Tips for Better Sleep" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sourceUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destination URL (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://yourblog.com/article" {...field} />
                    </FormControl>
                    <FormDescription>
                      The URL users will visit when clicking your pin
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sourceContent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content to Transform</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Paste your blog post, product description, or content idea here..."
                        className="min-h-[150px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      The AI will analyze this content and create optimized pins
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Template Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <FormLabel className="text-base">Use Template</FormLabel>
                  {selectedTemplate && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearTemplate}
                      className="h-auto p-1 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>
                
                {selectedTemplate ? (
                  <div className="flex items-center gap-2 p-3 rounded-lg border bg-primary/5 border-primary/20">
                    <LayoutTemplate className="h-4 w-4 text-primary" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{selectedTemplate.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {selectedTemplate.pin_type && `${selectedTemplate.pin_type} • `}
                        {selectedTemplate.cta_type && `${selectedTemplate.cta_type} CTA • `}
                        {selectedTemplate.layout_style && `${selectedTemplate.layout_style} layout`}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">Active</Badge>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {templatesLoading ? (
                      <p className="text-sm text-muted-foreground">Loading templates...</p>
                    ) : templates && templates.length > 0 ? (
                      templates.map((template) => (
                        <Button
                          key={template.id}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => applyTemplate(template)}
                          className="gap-1.5"
                        >
                          <LayoutTemplate className="h-3 w-3" />
                          {template.name}
                          {template.is_default && (
                            <Badge variant="secondary" className="ml-1 text-[10px] px-1 py-0">
                              Default
                            </Badge>
                          )}
                        </Button>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No templates yet. Create templates from the Templates tab.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="pinType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pin Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select pin type" />
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
                  name="boardId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Board (optional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select board" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {boards.map((board) => (
                            <SelectItem key={board.id} value={board.id}>
                              {board.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Board keywords will enhance SEO targeting
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="ctaType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CTA Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Auto" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CTA_TYPES.map((cta) => (
                            <SelectItem key={cta.value} value={cta.value}>
                              {cta.label}
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
                  name="layoutStyle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Layout Style</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Auto" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {LAYOUT_STYLES.map((layout) => (
                            <SelectItem key={layout.value} value={layout.value}>
                              {layout.label}
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
                  name="colorEmphasis"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color Style</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Auto" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="brand">Brand Colors</SelectItem>
                          <SelectItem value="warm">Warm Tones</SelectItem>
                          <SelectItem value="cool">Cool Tones</SelectItem>
                          <SelectItem value="neutral">Neutral</SelectItem>
                          <SelectItem value="vibrant">Vibrant</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="numberOfVariations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Variations: {field.value}</FormLabel>
                    <FormControl>
                      <Slider
                        min={1}
                        max={10}
                        step={1}
                        value={[field.value]}
                        onValueChange={(v) => field.onChange(v[0])}
                      />
                    </FormControl>
                    <FormDescription>
                      Generate multiple variations to test different approaches
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isGenerating}>
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Pins
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {generatedPins.length} pins ready to save
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep("input")}>
                  Generate More
                </Button>
                <Button onClick={handleSaveAll} disabled={generatedPins.length === 0}>
                  Save All Pins
                </Button>
              </div>
            </div>

            <div className="grid gap-4">
              {generatedPins.map((pin, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 space-y-3 bg-card"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-primary/10 text-primary">
                          SEO Score: {pin.seoScore}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {pin.layoutStyle}
                        </span>
                      </div>
                      <h4 className="font-semibold">{pin.title}</h4>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSavePin(pin, index)}
                    >
                      Save
                    </Button>
                  </div>

                  <p className="text-sm text-muted-foreground">{pin.description}</p>

                  <div className="flex flex-wrap gap-1.5">
                    {pin.keywords.map((keyword, ki) => (
                      <span
                        key={ki}
                        className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>

                  <div className="pt-2 border-t flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">
                      Headline: <strong>{pin.headline}</strong>
                    </span>
                    <span className="text-muted-foreground">
                      CTA: <strong className="capitalize">{pin.ctaType}</strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
