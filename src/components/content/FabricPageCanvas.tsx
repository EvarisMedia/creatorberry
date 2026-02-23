import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from "react";
import { Canvas, Textbox, Rect, Circle, FabricImage, FabricObject } from "fabric";
import { EbookPageData, PAGE_SIZES, PageSizeKey } from "./ebookLayouts";
import { PDFStyleConfig } from "./PDFStyleSettings";
import { pageDataToFabricJSON } from "@/lib/fabricPageSerializer";
import { Button } from "@/components/ui/button";
import {
  Type, Image, Square, CircleIcon, Minus, Trash2,
  BringToFront, SendToBack, AlignLeft, AlignCenter, AlignRight,
  Bold, Italic, Sparkles,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface FabricPageCanvasRef {
  toJSON: () => any;
  toDataURL: (options?: { format?: string; quality?: number; multiplier?: number }) => string;
  getCanvas: () => Canvas | null;
}

interface Props {
  page: EbookPageData;
  pageSize: PageSizeKey;
  pdfStyle: PDFStyleConfig;
  scale: number;
  onChange?: (json: any) => void;
  onImageAction?: (action: "generate" | "upload" | "remove") => void;
}

export const FabricPageCanvas = forwardRef<FabricPageCanvasRef, Props>(
  ({ page, pageSize, pdfStyle, scale, onChange, onImageAction }, ref) => {
    const canvasElRef = useRef<HTMLCanvasElement>(null);
    const fabricRef = useRef<Canvas | null>(null);
    const [selectedObject, setSelectedObject] = useState<FabricObject | null>(null);
    const isInitializedRef = useRef(false);
    const pageIdRef = useRef(page.id);
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const dims = PAGE_SIZES[pageSize];

    useImperativeHandle(ref, () => ({
      toJSON: () => fabricRef.current?.toJSON() ?? null,
      toDataURL: (opts) => {
        const canvas = fabricRef.current;
        if (!canvas) return "";
        return canvas.toDataURL({
          format: (opts?.format || "png") as "png" | "jpeg" | "webp",
          quality: opts?.quality || 1,
          multiplier: opts?.multiplier || 2,
        });
      },
      getCanvas: () => fabricRef.current,
    }));

    // Debounced save
    const emitChange = useCallback(() => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        if (fabricRef.current && onChange) {
          onChange(fabricRef.current.toJSON());
        }
      }, 400);
    }, [onChange]);

    // Initialize canvas
    useEffect(() => {
      if (!canvasElRef.current) return;

      const canvas = new Canvas(canvasElRef.current, {
        width: dims.width,
        height: dims.height,
        backgroundColor: pdfStyle.backgroundColor || "#ffffff",
        selection: true,
        preserveObjectStacking: true,
      });

      fabricRef.current = canvas;

      // Event listeners
      canvas.on("selection:created", (e) => {
        setSelectedObject(e.selected?.[0] ?? null);
      });
      canvas.on("selection:updated", (e) => {
        setSelectedObject(e.selected?.[0] ?? null);
      });
      canvas.on("selection:cleared", () => {
        setSelectedObject(null);
      });
      canvas.on("object:modified", emitChange);
      canvas.on("text:changed", emitChange);

      // Canvas boundary clamping
      canvas.on("object:moving", (e) => {
        const obj = e.target;
        if (!obj) return;
        const bound = obj.getBoundingRect();
        if (bound.left < 0) obj.set("left", obj.left! - bound.left);
        if (bound.top < 0) obj.set("top", obj.top! - bound.top);
        if (bound.left + bound.width > dims.width)
          obj.set("left", obj.left! - (bound.left + bound.width - dims.width));
        if (bound.top + bound.height > dims.height)
          obj.set("top", obj.top! - (bound.top + bound.height - dims.height));
      });

      // Load content
      loadPageContent(canvas, page, pageSize, pdfStyle);
      isInitializedRef.current = true;
      pageIdRef.current = page.id;

      return () => {
        canvas.dispose();
        fabricRef.current = null;
        isInitializedRef.current = false;
      };
    }, []); // Mount once

    // Reload when page changes
    useEffect(() => {
      if (!isInitializedRef.current || !fabricRef.current) return;
      if (pageIdRef.current === page.id) return;
      pageIdRef.current = page.id;
      loadPageContent(fabricRef.current, page, pageSize, pdfStyle);
    }, [page.id]);

    // Update background color
    useEffect(() => {
      if (fabricRef.current) {
        fabricRef.current.backgroundColor = pdfStyle.backgroundColor || "#ffffff";
        fabricRef.current.renderAll();
      }
    }, [pdfStyle.backgroundColor]);

    // Toolbar actions
    const addTextbox = () => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      const tb = new Textbox("New text", {
        left: 50,
        top: 50,
        width: 200,
        fontSize: 16,
        fontFamily: pdfStyle.fontFamily === "serif" ? "Georgia, serif" : "system-ui, sans-serif",
        fill: pdfStyle.bodyColor || "#334155",
      });
      canvas.add(tb);
      canvas.setActiveObject(tb);
      canvas.renderAll();
      emitChange();
    };

    const addRect = () => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      const rect = new Rect({
        left: 50,
        top: 50,
        width: 120,
        height: 80,
        fill: pdfStyle.accentColor || "#6366f1",
        opacity: 0.3,
        rx: 4,
        ry: 4,
      });
      canvas.add(rect);
      canvas.setActiveObject(rect);
      canvas.renderAll();
      emitChange();
    };

    const addCircle = () => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      const circle = new Circle({
        left: 50,
        top: 50,
        radius: 50,
        fill: pdfStyle.accentColor || "#6366f1",
        opacity: 0.3,
      });
      canvas.add(circle);
      canvas.setActiveObject(circle);
      canvas.renderAll();
      emitChange();
    };

    const addLine = () => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      const line = new Rect({
        left: 50,
        top: 100,
        width: 200,
        height: 2,
        fill: "#cccccc",
      });
      canvas.add(line);
      canvas.setActiveObject(line);
      canvas.renderAll();
      emitChange();
    };

    const deleteSelected = () => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      const active = canvas.getActiveObjects();
      active.forEach((obj) => canvas.remove(obj));
      canvas.discardActiveObject();
      canvas.renderAll();
      setSelectedObject(null);
      emitChange();
    };

    const bringForward = () => {
      const canvas = fabricRef.current;
      if (!canvas || !selectedObject) return;
      canvas.bringObjectForward(selectedObject);
      canvas.renderAll();
      emitChange();
    };

    const sendBackward = () => {
      const canvas = fabricRef.current;
      if (!canvas || !selectedObject) return;
      canvas.sendObjectBackwards(selectedObject);
      canvas.renderAll();
      emitChange();
    };

    const setTextAlign = (align: string) => {
      if (!selectedObject || !(selectedObject instanceof Textbox)) return;
      selectedObject.set("textAlign", align);
      fabricRef.current?.renderAll();
      emitChange();
    };

    const toggleBold = () => {
      if (!selectedObject || !(selectedObject instanceof Textbox)) return;
      const current = selectedObject.fontWeight;
      selectedObject.set("fontWeight", current === "bold" ? "normal" : "bold");
      fabricRef.current?.renderAll();
      emitChange();
    };

    const toggleItalic = () => {
      if (!selectedObject || !(selectedObject instanceof Textbox)) return;
      const current = selectedObject.fontStyle;
      selectedObject.set("fontStyle", current === "italic" ? "normal" : "italic");
      fabricRef.current?.renderAll();
      emitChange();
    };

    const isTextSelected = selectedObject instanceof Textbox;

    return (
      <div className="flex flex-col gap-2">
        {/* Fabric toolbar */}
        <div className="flex items-center gap-1 flex-wrap px-1">
          {/* Add elements */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                <Type className="w-3 h-3" /> Add
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[140px]">
              <DropdownMenuItem onClick={addTextbox}><Type className="w-3.5 h-3.5 mr-2" /> Text Box</DropdownMenuItem>
              <DropdownMenuItem onClick={addRect}><Square className="w-3.5 h-3.5 mr-2" /> Rectangle</DropdownMenuItem>
              <DropdownMenuItem onClick={addCircle}><CircleIcon className="w-3.5 h-3.5 mr-2" /> Circle</DropdownMenuItem>
              <DropdownMenuItem onClick={addLine}><Minus className="w-3.5 h-3.5 mr-2" /> Line</DropdownMenuItem>
              {onImageAction && (
                <>
                  <DropdownMenuItem onClick={() => onImageAction("upload")}><Image className="w-3.5 h-3.5 mr-2" /> Upload Image</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onImageAction("generate")}><Sparkles className="w-3.5 h-3.5 mr-2" /> Generate with AI</DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Text formatting (visible when text selected) */}
          {isTextSelected && (
            <>
              <div className="w-px h-4 bg-border mx-0.5" />
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={toggleBold} title="Bold">
                <Bold className="w-3 h-3" />
              </Button>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={toggleItalic} title="Italic">
                <Italic className="w-3 h-3" />
              </Button>
              <div className="w-px h-4 bg-border mx-0.5" />
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setTextAlign("left")} title="Align left">
                <AlignLeft className="w-3 h-3" />
              </Button>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setTextAlign("center")} title="Align center">
                <AlignCenter className="w-3 h-3" />
              </Button>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setTextAlign("right")} title="Align right">
                <AlignRight className="w-3 h-3" />
              </Button>
            </>
          )}

          {/* Object controls (visible when any object selected) */}
          {selectedObject && (
            <>
              <div className="w-px h-4 bg-border mx-0.5" />
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={bringForward} title="Bring forward">
                <BringToFront className="w-3 h-3" />
              </Button>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={sendBackward} title="Send backward">
                <SendToBack className="w-3 h-3" />
              </Button>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={deleteSelected} title="Delete">
                <Trash2 className="w-3 h-3" />
              </Button>
            </>
          )}
        </div>

        {/* Canvas container */}
        <div
          style={{
            width: dims.width * scale,
            height: dims.height * scale,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              width: dims.width,
              height: dims.height,
            }}
          >
            <canvas ref={canvasElRef} />
          </div>
        </div>
      </div>
    );
  }
);

FabricPageCanvas.displayName = "FabricPageCanvas";

/**
 * Load page content into the Fabric canvas.
 * Uses existing fabricJSON if available, otherwise converts from page data.
 */
async function loadPageContent(
  canvas: Canvas,
  page: EbookPageData,
  pageSize: PageSizeKey,
  pdfStyle: PDFStyleConfig
) {
  canvas.clear();
  canvas.backgroundColor = pdfStyle.backgroundColor || "#ffffff";

  if (page.fabricJSON) {
    // Load from saved Fabric JSON
    try {
      await canvas.loadFromJSON(page.fabricJSON);
      canvas.renderAll();
      return;
    } catch (err) {
      console.warn("Failed to load fabricJSON, falling back to conversion:", err);
    }
  }

  // Convert from page data
  const fabricJSON = pageDataToFabricJSON(page, pageSize, pdfStyle);

  // Manually create objects from our JSON spec
  for (const objData of fabricJSON.objects) {
    try {
      let obj: FabricObject | null = null;

      switch (objData.type) {
        case "Textbox":
          obj = new Textbox(objData.text || "", {
            left: objData.left,
            top: objData.top,
            width: objData.width,
            fontSize: objData.fontSize || 16,
            fontFamily: objData.fontFamily || "system-ui, sans-serif",
            fontWeight: (objData.fontWeight || "normal") as string,
            fontStyle: (objData.fontStyle || "normal") as string,
            fill: objData.fill || "#000000",
            textAlign: (objData.textAlign || "left") as string,
            lineHeight: (objData.lineHeight as number) || 1.3,
            selectable: objData.selectable !== false,
            evented: objData.evented !== false,
            charSpacing: (objData.charSpacing as number) || 0,
          });
          break;

        case "Rect":
          obj = new Rect({
            left: objData.left,
            top: objData.top,
            width: objData.width || 100,
            height: objData.height || 100,
            fill: objData.fill || "#cccccc",
            opacity: objData.opacity ?? 1,
            rx: objData.rx || 0,
            ry: objData.ry || 0,
            angle: objData.angle || 0,
            selectable: objData.selectable !== false,
            evented: objData.evented !== false,
          });
          break;

        case "Circle":
          obj = new Circle({
            left: objData.left,
            top: objData.top,
            radius: objData.radius || 50,
            fill: objData.fill || "#cccccc",
            opacity: objData.opacity ?? 1,
            selectable: objData.selectable !== false,
            evented: objData.evented !== false,
          });
          break;

        case "Image":
          if (objData.src) {
            try {
              const img = await FabricImage.fromURL(objData.src, { crossOrigin: "anonymous" });
              if (img) {
                img.set({
                  left: objData.left,
                  top: objData.top,
                });
                if (objData.width && objData.height) {
                  img.scaleToWidth(objData.width);
                }
                canvas.add(img);
              }
            } catch (imgErr) {
              // Image failed to load; add placeholder rect
              obj = new Rect({
                left: objData.left,
                top: objData.top,
                width: objData.width || 200,
                height: objData.height || 150,
                fill: "#f1f5f9",
                rx: 4,
                ry: 4,
              });
            }
          }
          break;
      }

      if (obj) {
        canvas.add(obj);
      }
    } catch (err) {
      console.warn("Failed to create fabric object:", err);
    }
  }

  canvas.renderAll();
}
