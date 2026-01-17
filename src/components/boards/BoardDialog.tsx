import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { useBoards, Board } from "@/hooks/useBoards";

const boardSchema = z.object({
  name: z.string().min(1, "Board name is required"),
  description: z.string().optional(),
});

type BoardFormData = z.infer<typeof boardSchema>;

interface BoardDialogProps {
  brandId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editBoard?: Board | null;
}

export function BoardDialog({ brandId, open, onOpenChange, editBoard }: BoardDialogProps) {
  const { createBoard, updateBoard } = useBoards(brandId);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [themes, setThemes] = useState<string[]>([]);
  const [themeInput, setThemeInput] = useState("");

  const form = useForm<BoardFormData>({
    resolver: zodResolver(boardSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  useEffect(() => {
    if (editBoard) {
      form.reset({
        name: editBoard.name,
        description: editBoard.description || "",
      });
      setKeywords(editBoard.keywords || []);
      setThemes(editBoard.content_themes || []);
    } else {
      form.reset({
        name: "",
        description: "",
      });
      setKeywords([]);
      setThemes([]);
    }
  }, [editBoard, form]);

  const addKeyword = () => {
    const trimmed = keywordInput.trim().toLowerCase();
    if (trimmed && !keywords.includes(trimmed)) {
      setKeywords([...keywords, trimmed]);
      setKeywordInput("");
    }
  };

  const removeKeyword = (keyword: string) => {
    setKeywords(keywords.filter((k) => k !== keyword));
  };

  const addTheme = () => {
    const trimmed = themeInput.trim();
    if (trimmed && !themes.includes(trimmed)) {
      setThemes([...themes, trimmed]);
      setThemeInput("");
    }
  };

  const removeTheme = (theme: string) => {
    setThemes(themes.filter((t) => t !== theme));
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    type: "keyword" | "theme"
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (type === "keyword") {
        addKeyword();
      } else {
        addTheme();
      }
    }
  };

  const onSubmit = async (data: BoardFormData) => {
    if (editBoard) {
      await updateBoard.mutateAsync({
        id: editBoard.id,
        name: data.name,
        description: data.description || undefined,
        keywords,
        content_themes: themes,
      });
    } else {
      await createBoard.mutateAsync({
        brand_id: brandId,
        name: data.name,
        description: data.description || undefined,
        keywords,
        content_themes: themes,
      });
    }
    form.reset();
    setKeywords([]);
    setThemes([]);
    onOpenChange(false);
  };

  const isLoading = createBoard.isPending || updateBoard.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editBoard ? "Edit Board" : "Create New Board"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Board Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Board Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., DIY Home Projects" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what kind of content belongs in this board..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Keywords */}
            <div className="space-y-2">
              <FormLabel>Keywords</FormLabel>
              <FormDescription>
                Add SEO keywords that describe this board's content
              </FormDescription>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a keyword..."
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, "keyword")}
                />
                <Button type="button" variant="outline" onClick={addKeyword}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {keywords.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {keywords.map((keyword) => (
                    <Badge key={keyword} variant="secondary" className="gap-1">
                      {keyword}
                      <button
                        type="button"
                        onClick={() => removeKeyword(keyword)}
                        className="ml-1 hover:bg-destructive/20 rounded-full"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Content Themes */}
            <div className="space-y-2">
              <FormLabel>Content Themes</FormLabel>
              <FormDescription>
                Add themes or categories for this board
              </FormDescription>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a theme..."
                  value={themeInput}
                  onChange={(e) => setThemeInput(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, "theme")}
                />
                <Button type="button" variant="outline" onClick={addTheme}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {themes.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {themes.map((theme) => (
                    <Badge key={theme} variant="outline" className="gap-1 bg-primary/5">
                      {theme}
                      <button
                        type="button"
                        onClick={() => removeTheme(theme)}
                        className="ml-1 hover:bg-destructive/20 rounded-full"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading
                  ? editBoard
                    ? "Saving..."
                    : "Creating..."
                  : editBoard
                  ? "Save Changes"
                  : "Create Board"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
