import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LAYOUT_TEMPLATES, LayoutType, LayoutWireframe } from "./ebookLayouts";

interface Props {
  open: boolean;
  onClose: () => void;
  currentLayout: LayoutType;
  onSelect: (layout: LayoutType) => void;
}

export function PageLayoutPicker({ open, onClose, currentLayout, onSelect }: Props) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Choose Page Layout</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-2">
          {LAYOUT_TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.type}
              onClick={() => { onSelect(tmpl.type); onClose(); }}
              className={`flex flex-col items-center p-2 rounded-lg border transition-all hover:shadow-md ${
                currentLayout === tmpl.type
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="w-full aspect-[3/4] bg-muted/50 rounded border border-border mb-2 overflow-hidden">
                <LayoutWireframe type={tmpl.type} />
              </div>
              <span className="text-xs font-medium">{tmpl.icon} {tmpl.label}</span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
