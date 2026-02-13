import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bold, Italic, Heading1, Heading2, Heading3, List, ListOrdered, Quote, Minus,
  ImagePlus, Upload, GalleryHorizontalEnd, Sparkles, Type,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface ContentToolbarProps {
  onFormat: (format: string) => void;
  onInsertImage: () => void;
  onUploadImage: () => void;
  onGalleryImage: () => void;
  onAIEdit: () => void;
  hasSelection: boolean;
}

export function ContentToolbar({
  onFormat,
  onInsertImage,
  onUploadImage,
  onGalleryImage,
  onAIEdit,
  hasSelection,
}: ContentToolbarProps) {
  const formatButtons = [
    { icon: Bold, label: "Bold", format: "bold" },
    { icon: Italic, label: "Italic", format: "italic" },
  ];

  const headingButtons = [
    { icon: Heading1, label: "Heading 1", format: "h1" },
    { icon: Heading2, label: "Heading 2", format: "h2" },
    { icon: Heading3, label: "Heading 3", format: "h3" },
  ];

  const listButtons = [
    { icon: List, label: "Bullet List", format: "ul" },
    { icon: ListOrdered, label: "Numbered List", format: "ol" },
    { icon: Quote, label: "Blockquote", format: "quote" },
    { icon: Minus, label: "Horizontal Rule", format: "hr" },
  ];

  return (
    <div className="flex items-center gap-1 p-2 bg-card border border-border rounded-lg flex-wrap">
      {/* Text formatting */}
      {formatButtons.map((btn) => (
        <Button
          key={btn.format}
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onFormat(btn.format)}
          title={btn.label}
        >
          <btn.icon className="w-4 h-4" />
        </Button>
      ))}

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Headings */}
      {headingButtons.map((btn) => (
        <Button
          key={btn.format}
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onFormat(btn.format)}
          title={btn.label}
        >
          <btn.icon className="w-4 h-4" />
        </Button>
      ))}

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Lists & blocks */}
      {listButtons.map((btn) => (
        <Button
          key={btn.format}
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onFormat(btn.format)}
          title={btn.label}
        >
          <btn.icon className="w-4 h-4" />
        </Button>
      ))}

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Insert Image */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-1.5">
            <ImagePlus className="w-4 h-4" /> Image
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={onInsertImage}>
            <Sparkles className="w-4 h-4 mr-2" /> Generate with AI
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onUploadImage}>
            <Upload className="w-4 h-4 mr-2" /> Upload Image
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onGalleryImage}>
            <GalleryHorizontalEnd className="w-4 h-4 mr-2" /> From Gallery
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* AI Edit */}
      <Button
        variant={hasSelection ? "default" : "outline"}
        size="sm"
        className="h-8 gap-1.5"
        onClick={onAIEdit}
      >
        <Sparkles className="w-4 h-4" /> AI Edit
      </Button>
    </div>
  );
}
