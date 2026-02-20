import React, { useState, useRef, useCallback } from "react";
import { ContentBlock } from "./ebookLayouts";
import { GripVertical, ImagePlus, Plus, Trash2, Type, Image, Quote, List, Minus, AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FreeformPageRendererProps {
  blocks: ContentBlock[];
  style: {
    fontFamily: string;
    headingColor: string;
    fontSize: string;
    accentColor?: string;
    backgroundColor?: string;
    bodyColor?: string;
  };
  editable?: boolean;
  onBlocksChange?: (blocks: ContentBlock[]) => void;
  onImageAction?: (action: "generate" | "upload" | "remove", blockId: string) => void;
}

export function FreeformPageRenderer({
  blocks,
  style,
  editable,
  onBlocksChange,
  onImageAction,
}: FreeformPageRendererProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const accentColor = style.accentColor || style.headingColor;
  const bodyColor = style.bodyColor || undefined;

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (isNaN(sourceIndex) || sourceIndex === targetIndex) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }
    const updated = [...blocks];
    const [moved] = updated.splice(sourceIndex, 1);
    updated.splice(targetIndex, 0, moved);
    onBlocksChange?.(updated);
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const updateBlock = (blockId: string, partial: Partial<ContentBlock>) => {
    const updated = blocks.map((b) => (b.id === blockId ? { ...b, ...partial } : b));
    onBlocksChange?.(updated);
  };

  const deleteBlock = (blockId: string) => {
    if (blocks.length <= 1) return;
    onBlocksChange?.(blocks.filter((b) => b.id !== blockId));
  };

  const addBlock = (type: ContentBlock["type"], afterIndex: number) => {
    const newBlock: ContentBlock = {
      id: crypto.randomUUID(),
      type,
      content: type === "heading" ? "New Heading" : type === "subheading" ? "Subheading" : type === "spacer" ? "" : type === "image" ? "" : "New text block",
      alignment: "left",
      items: type === "items" ? ["Item 1", "Item 2", "Item 3"] : undefined,
      imageWidth: type === "image" ? 60 : undefined,
    };
    const updated = [...blocks];
    updated.splice(afterIndex + 1, 0, newBlock);
    onBlocksChange?.(updated);
  };

  const setAlignment = (blockId: string, alignment: "left" | "center" | "right") => {
    updateBlock(blockId, { alignment });
  };

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-full px-6 py-6 gap-0.5 overflow-hidden"
      style={{ fontFamily: style.fontFamily, fontSize: style.fontSize, color: bodyColor }}
    >
      {blocks.map((block, index) => {
        const isSelected = editable && selectedBlockId === block.id;
        const isDragOver = dragOverIndex === index && dragIndex !== index;

        return (
          <div key={block.id} className="relative group">
            {/* Drop indicator line */}
            {isDragOver && (
              <div className="absolute -top-1 left-0 right-0 h-0.5 bg-primary rounded-full z-10" />
            )}

            <div
              className={`relative flex items-start gap-1 rounded transition-all ${
                editable ? "hover:bg-primary/5" : ""
              } ${isSelected ? "ring-1 ring-primary/40 bg-primary/5" : ""} ${
                dragIndex === index ? "opacity-40" : ""
              }`}
              onClick={(e) => {
                if (editable) {
                  e.stopPropagation();
                  setSelectedBlockId(block.id);
                }
              }}
            >
              {/* Drag handle */}
              {editable && (
                <div
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className="opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing shrink-0 pt-1 transition-opacity"
                  title="Drag to reorder"
                >
                  <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
              )}

              {/* Block content */}
              <div
                className="flex-1 min-w-0"
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                style={{ textAlign: block.alignment || "left" }}
              >
                <BlockContent
                  block={block}
                  style={style}
                  accentColor={accentColor}
                  editable={editable}
                  onContentChange={(value) => updateBlock(block.id, { content: value })}
                  onItemChange={(itemIndex, value) => {
                    const items = [...(block.items || [])];
                    items[itemIndex] = value;
                    updateBlock(block.id, { items });
                  }}
                  onImageAction={onImageAction ? (action) => onImageAction(action, block.id) : undefined}
                  onWidthChange={(w) => updateBlock(block.id, { imageWidth: w })}
                />
              </div>

              {/* Block actions (visible on hover/select) */}
              {editable && isSelected && (
                <div className="absolute -top-7 right-0 flex items-center gap-0.5 bg-background border border-border rounded-md shadow-sm px-1 py-0.5 z-20">
                  <button onClick={() => setAlignment(block.id, "left")} className={`p-1 rounded hover:bg-muted ${block.alignment === "left" || !block.alignment ? "bg-muted" : ""}`} title="Align left">
                    <AlignLeft className="w-3 h-3" />
                  </button>
                  <button onClick={() => setAlignment(block.id, "center")} className={`p-1 rounded hover:bg-muted ${block.alignment === "center" ? "bg-muted" : ""}`} title="Align center">
                    <AlignCenter className="w-3 h-3" />
                  </button>
                  <button onClick={() => setAlignment(block.id, "right")} className={`p-1 rounded hover:bg-muted ${block.alignment === "right" ? "bg-muted" : ""}`} title="Align right">
                    <AlignRight className="w-3 h-3" />
                  </button>
                  <div className="w-px h-4 bg-border mx-0.5" />
                  <button
                    onClick={() => deleteBlock(block.id)}
                    className="p-1 rounded hover:bg-destructive/10 text-destructive"
                    title="Delete block"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Add block button between blocks */}
            {editable && (
              <div className="h-0 relative group/add">
                <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 z-10 opacity-0 group-hover/add:opacity-100 transition-opacity">
                  <AddBlockMenu onAdd={(type) => addBlock(type, index)} />
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Deselect on background click */}
      {editable && (
        <div className="flex-1 min-h-[20px]" onClick={() => setSelectedBlockId(null)}>
          {blocks.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <AddBlockMenu onAdd={(type) => addBlock(type, -1)} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AddBlockMenu({ onAdd }: { onAdd: (type: ContentBlock["type"]) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-5 w-5 p-0 rounded-full bg-primary/10 hover:bg-primary/20">
          <Plus className="w-3 h-3 text-primary" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="min-w-[140px]">
        <DropdownMenuItem onClick={() => onAdd("heading")}><Type className="w-3.5 h-3.5 mr-2" /> Heading</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAdd("subheading")}><Type className="w-3.5 h-3.5 mr-2 opacity-60" /> Subheading</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAdd("body")}><AlignLeft className="w-3.5 h-3.5 mr-2" /> Text</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAdd("image")}><Image className="w-3.5 h-3.5 mr-2" /> Image</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAdd("items")}><List className="w-3.5 h-3.5 mr-2" /> List</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAdd("quote")}><Quote className="w-3.5 h-3.5 mr-2" /> Quote</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAdd("spacer")}><Minus className="w-3.5 h-3.5 mr-2" /> Spacer</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Individual block content renderers
function BlockContent({
  block,
  style,
  accentColor,
  editable,
  onContentChange,
  onItemChange,
  onImageAction,
  onWidthChange,
}: {
  block: ContentBlock;
  style: FreeformPageRendererProps["style"];
  accentColor: string;
  editable?: boolean;
  onContentChange: (value: string) => void;
  onItemChange?: (index: number, value: string) => void;
  onImageAction?: (action: "generate" | "upload" | "remove") => void;
  onWidthChange?: (w: number) => void;
}) {
  const headingStyle: React.CSSProperties = { color: style.headingColor, fontFamily: style.fontFamily };

  switch (block.type) {
    case "heading":
      return (
        <EditableBlockText
          value={block.content}
          editable={editable}
          onChange={onContentChange}
          className="text-xl font-bold leading-tight py-1"
          style={headingStyle}
          tag="h2"
        />
      );

    case "subheading":
      return (
        <EditableBlockText
          value={block.content}
          editable={editable}
          onChange={onContentChange}
          className="text-sm uppercase tracking-widest text-muted-foreground py-0.5"
          tag="p"
        />
      );

    case "body":
      return (
        <EditableBlockText
          value={block.content}
          editable={editable}
          onChange={onContentChange}
          className="text-sm leading-relaxed whitespace-pre-wrap py-0.5"
          tag="div"
        />
      );

    case "image":
      return (
        <ResizableImageBlock
          src={block.content}
          width={block.imageWidth || 60}
          editable={editable}
          onImageAction={onImageAction}
          onWidthChange={onWidthChange}
          alignment={block.alignment}
        />
      );

    case "items":
      return (
        <div className="space-y-1.5 py-1">
          {(block.items || []).map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5"
                style={{ backgroundColor: accentColor + "1a", color: accentColor }}
              >
                {i + 1}
              </div>
              {editable ? (
                <span
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => onItemChange?.(i, e.currentTarget.textContent || "")}
                  className="text-sm leading-relaxed outline-none hover:ring-1 hover:ring-primary/30 focus:ring-2 focus:ring-primary/50 rounded px-0.5 cursor-text flex-1"
                >
                  {item}
                </span>
              ) : (
                <span className="text-sm leading-relaxed">{item}</span>
              )}
            </div>
          ))}
        </div>
      );

    case "quote":
      return (
        <div className="py-2">
          <div className="text-3xl text-muted-foreground/30 leading-none">"</div>
          <EditableBlockText
            value={block.content}
            editable={editable}
            onChange={onContentChange}
            className="text-base italic leading-relaxed px-4"
            style={headingStyle}
            tag="blockquote"
          />
        </div>
      );

    case "attribution":
      return (
        <EditableBlockText
          value={block.content}
          editable={editable}
          onChange={onContentChange}
          className="text-xs text-muted-foreground py-0.5"
          tag="p"
        />
      );

    case "spacer":
      return <div className="h-6" />;

    default:
      return null;
  }
}

function EditableBlockText({
  value,
  editable,
  onChange,
  className,
  style,
  tag: Tag = "div",
}: {
  value: string;
  editable?: boolean;
  onChange: (value: string) => void;
  className?: string;
  style?: React.CSSProperties;
  tag?: keyof JSX.IntrinsicElements;
}) {
  const El = Tag as any;
  if (editable) {
    return (
      <El
        contentEditable
        suppressContentEditableWarning
        onBlur={(e: React.FocusEvent<HTMLElement>) => onChange(e.currentTarget.textContent || "")}
        className={`${className || ""} outline-none hover:ring-1 hover:ring-primary/30 focus:ring-2 focus:ring-primary/50 rounded px-0.5 cursor-text`}
        style={style}
      >
        {value || "[empty]"}
      </El>
    );
  }
  return <El className={className} style={style}>{value}</El>;
}

// Resizable image block with drag handles
function ResizableImageBlock({
  src,
  width,
  editable,
  onImageAction,
  onWidthChange,
  alignment,
}: {
  src?: string;
  width: number;
  editable?: boolean;
  onImageAction?: (action: "generate" | "upload" | "remove") => void;
  onWidthChange?: (w: number) => void;
  alignment?: string;
}) {
  const [isResizing, setIsResizing] = useState(false);
  const [hovered, setHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);

    const startX = e.clientX;
    const startWidth = width;
    const parentWidth = containerRef.current?.parentElement?.clientWidth || 400;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      const deltaPercent = (delta / parentWidth) * 100 * 2; // *2 because resizing from edge
      const newWidth = Math.max(10, Math.min(100, startWidth + deltaPercent));
      onWidthChange?.(Math.round(newWidth));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }, [width, onWidthChange]);

  const justifyClass = alignment === "center" ? "justify-center" : alignment === "right" ? "justify-end" : "justify-start";

  return (
    <div ref={containerRef} className={`flex ${justifyClass} py-1`}>
      <div
        className="relative"
        style={{ width: `${width}%` }}
        onMouseEnter={() => editable && setHovered(true)}
        onMouseLeave={() => editable && setHovered(false)}
      >
        {src ? (
          <img src={src} alt="" className="w-full h-auto rounded object-cover" />
        ) : (
          <div className={`w-full aspect-video ${editable ? "border-2 border-dashed border-primary/30 bg-muted/30" : "bg-muted"} rounded flex flex-col items-center justify-center gap-2 p-4`}>
            <ImagePlus className="w-6 h-6 text-muted-foreground/40" />
            <span className="text-[10px] text-muted-foreground">{editable ? "Add image" : "Image"}</span>
            {editable && onImageAction && (
              <div className="flex gap-1 mt-1">
                <button
                  onClick={(e) => { e.stopPropagation(); onImageAction("generate"); }}
                  className="px-2 py-0.5 text-[9px] font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90"
                >
                  Generate
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onImageAction("upload"); }}
                  className="px-2 py-0.5 text-[9px] font-medium bg-secondary text-secondary-foreground rounded hover:bg-secondary/90"
                >
                  Upload
                </button>
              </div>
            )}
          </div>
        )}

        {/* Hover overlay with actions */}
        {editable && hovered && src && (
          <div className="absolute inset-0 bg-background/70 rounded flex items-center justify-center gap-1 z-10">
            <button onClick={() => onImageAction?.("generate")} className="px-2 py-1 text-[9px] bg-primary text-primary-foreground rounded hover:bg-primary/90">Generate</button>
            <button onClick={() => onImageAction?.("upload")} className="px-2 py-1 text-[9px] bg-secondary text-secondary-foreground rounded hover:bg-secondary/90">Upload</button>
            <button onClick={() => onImageAction?.("remove")} className="px-2 py-1 text-[9px] bg-destructive text-destructive-foreground rounded hover:bg-destructive/90">Remove</button>
          </div>
        )}

        {/* Resize handles */}
        {editable && (
          <>
            <div
              onMouseDown={handleResizeStart}
              className={`absolute top-0 -right-1.5 bottom-0 w-3 cursor-col-resize flex items-center justify-center z-20 ${hovered || isResizing ? "opacity-100" : "opacity-0"} transition-opacity`}
            >
              <div className="w-1 h-8 bg-primary rounded-full" />
            </div>
            {/* Width indicator */}
            {isResizing && (
              <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-mono z-30">
                {width}%
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}