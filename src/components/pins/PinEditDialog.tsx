import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, X, Plus } from "lucide-react";
import { Pin, PinVariation, usePins, usePinVariations } from "@/hooks/usePins";
import { useBoards, Board } from "@/hooks/useBoards";
import { toast } from "sonner";

interface PinEditDialogProps {
  pin: Pin;
  brandId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PIN_TYPES = [
  { value: "blog", label: "Blog" },
  { value: "product", label: "Product" },
  { value: "idea", label: "Idea" },
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
  { value: "bold-text", label: "Bold Text" },
  { value: "lifestyle", label: "Lifestyle" },
  { value: "infographic", label: "Infographic" },
  { value: "product", label: "Product" },
];

const formSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title is too long"),
  description: z.string().max(500, "Description is too long").optional(),
  destination_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  keywords: z.string().optional(),
  pin_type: z.string().optional(),
  cta_type: z.string().optional(),
  board_id: z.string().optional(),
  // Variation fields
  headline: z.string().max(60, "Headline max 60 characters").optional(),
  description_variation: z.string().max(200, "Description max 200 characters").optional(),
  layout_style: z.string().optional(),
  color_emphasis: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function PinEditDialog({
  pin,
  brandId,
  open,
  onOpenChange,
}: PinEditDialogProps) {
  const { updatePin } = usePins(brandId);
  const { boards } = useBoards(brandId);
  const { variations } = usePinVariations(pin.id);
  const [isSaving, setIsSaving] = useState(false);
  const [keywordInput, setKeywordInput] = useState("");
  const [keywordsList, setKeywordsList] = useState<string[]>(pin.keywords || []);

  const selectedVariation = variations.find((v) => v.is_selected);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: pin.title,
      description: pin.description || "",
      destination_url: pin.destination_url || "",
      keywords: pin.keywords?.join(", ") || "",
      pin_type: pin.pin_type || "",
      cta_type: pin.cta_type || "",
      board_id: pin.board_id || "",
      headline: selectedVariation?.headline || "",
      description_variation: selectedVariation?.description_variation || "",
      layout_style: selectedVariation?.layout_style || "",
      color_emphasis: selectedVariation?.color_emphasis || "",
    },
  });

  // Reset form when pin changes
  useEffect(() => {
    if (open) {
      const newKeywords = pin.keywords || [];
      setKeywordsList(newKeywords);
      form.reset({
        title: pin.title,
        description: pin.description || "",
        destination_url: pin.destination_url || "",
        keywords: newKeywords.join(", "),
        pin_type: pin.pin_type || "",
        cta_type: pin.cta_type || "",
        board_id: pin.board_id || "",
        headline: selectedVariation?.headline || "",
        description_variation: selectedVariation?.description_variation || "",
        layout_style: selectedVariation?.layout_style || "",
        color_emphasis: selectedVariation?.color_emphasis || "",
      });
    }
  }, [open, pin, selectedVariation, form]);

  const addKeyword = () => {
    const trimmed = keywordInput.trim();
    if (trimmed && !keywordsList.includes(trimmed) && keywordsList.length < 10) {
      setKeywordsList([...keywordsList, trimmed]);
      setKeywordInput("");
    }
  };

  const removeKeyword = (keyword: string) => {
    setKeywordsList(keywordsList.filter((k) => k !== keyword));
  };

  const handleKeywordKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addKeyword();
    }
  };

  const onSubmit = async (values: FormValues) => {
    setIsSaving(true);
    try {
      // Update pin
      await updatePin.mutateAsync({
        id: pin.id,
        title: values.title,
        description: values.description || null,
        destination_url: values.destination_url || null,
        keywords: keywordsList.length > 0 ? keywordsList : null,
        pin_type: values.pin_type || null,
        cta_type: values.cta_type || null,
        board_id: values.board_id || null,
      });

      toast.success("Pin updated successfully");
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating pin:", error);
      toast.error("Failed to update pin");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Pin</DialogTitle>
          <DialogDescription>
            Update pin details, keywords, and settings
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="Pin title..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Pin description..."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="destination_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destination URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Keywords */}
            <div className="space-y-2">
              <FormLabel>Keywords</FormLabel>
              <div className="flex gap-2">
                <Input
                  placeholder="Add keyword..."
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={handleKeywordKeyDown}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  onClick={addKeyword}
                  disabled={!keywordInput.trim() || keywordsList.length >= 10}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {keywordsList.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {keywordsList.map((keyword) => (
                    <Badge
                      key={keyword}
                      variant="secondary"
                      className="pr-1"
                    >
                      {keyword}
                      <button
                        type="button"
                        onClick={() => removeKeyword(keyword)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {keywordsList.length}/10 keywords
              </p>
            </div>

            {/* Selectors Grid */}
            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="pin_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pin Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
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
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select CTA" />
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
                name="board_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Board</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select board" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">No board</SelectItem>
                        {boards.map((board) => (
                          <SelectItem key={board.id} value={board.id}>
                            {board.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Variation Fields (if variation exists) */}
            {selectedVariation && (
              <div className="border-t pt-4 space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Variation Settings
                </h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="headline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Headline</FormLabel>
                        <FormControl>
                          <Input placeholder="Image headline..." {...field} />
                        </FormControl>
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
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
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
                </div>

                <FormField
                  control={form.control}
                  name="description_variation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description Variation</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Variation description..."
                          className="resize-none"
                          rows={2}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="color_emphasis"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color Emphasis</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., warm, cool, neutral..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Status Display */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Status:</span>
              <Badge variant="outline">{pin.status || "draft"}</Badge>
              {pin.seo_score && (
                <>
                  <span className="ml-2">SEO Score:</span>
                  <Badge
                    variant={pin.seo_score >= 70 ? "default" : "secondary"}
                    className={
                      pin.seo_score >= 70
                        ? "bg-green-500/10 text-green-600"
                        : pin.seo_score >= 50
                        ? "bg-yellow-500/10 text-yellow-600"
                        : "bg-red-500/10 text-red-600"
                    }
                  >
                    {pin.seo_score}
                  </Badge>
                </>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
