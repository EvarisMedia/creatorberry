import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PDFStyleConfig } from "./PDFStyleSettings";

export interface DesignTheme {
  name: string;
  fontFamily: PDFStyleConfig["fontFamily"];
  fontSize: PDFStyleConfig["fontSize"];
  headingColor: string;
  accentColor: string;
  backgroundColor: string;
  bodyColor: string;
}

export const BUILT_IN_THEMES: DesignTheme[] = [
  { name: "Minimal Clean", fontFamily: "sans-serif", fontSize: "medium", headingColor: "#1a1a2e", accentColor: "#6366f1", backgroundColor: "#ffffff", bodyColor: "#334155" },
  { name: "Classic Elegant", fontFamily: "serif", fontSize: "medium", headingColor: "#2c1810", accentColor: "#8b6f47", backgroundColor: "#faf8f5", bodyColor: "#44403c" },
  { name: "Bold Modern", fontFamily: "sans-serif", fontSize: "medium", headingColor: "#0f172a", accentColor: "#ef4444", backgroundColor: "#ffffff", bodyColor: "#374151" },
  { name: "Warm Earthy", fontFamily: "serif", fontSize: "medium", headingColor: "#3d2c1e", accentColor: "#d97706", backgroundColor: "#fefbf3", bodyColor: "#57534e" },
  { name: "Ocean Breeze", fontFamily: "sans-serif", fontSize: "medium", headingColor: "#0c4a6e", accentColor: "#0891b2", backgroundColor: "#f0f9ff", bodyColor: "#334155" },
  { name: "Dark Professional", fontFamily: "sans-serif", fontSize: "medium", headingColor: "#e2e8f0", accentColor: "#818cf8", backgroundColor: "#1e293b", bodyColor: "#cbd5e1" },
  { name: "Playful Creative", fontFamily: "sans-serif", fontSize: "medium", headingColor: "#7c3aed", accentColor: "#ec4899", backgroundColor: "#fdf4ff", bodyColor: "#4b5563" },
  { name: "Nature Zen", fontFamily: "serif", fontSize: "medium", headingColor: "#14532d", accentColor: "#16a34a", backgroundColor: "#f0fdf4", bodyColor: "#3f3f46" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTheme: (theme: DesignTheme) => void;
  currentThemeName?: string;
}

export function ThemeGallery({ open, onOpenChange, onSelectTheme, currentThemeName }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Choose a Design Theme</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {BUILT_IN_THEMES.map((theme) => (
            <button
              key={theme.name}
              onClick={() => { onSelectTheme(theme); onOpenChange(false); }}
              className={`group rounded-lg border-2 p-3 text-left transition-all hover:shadow-md ${
                currentThemeName === theme.name ? "border-primary ring-1 ring-primary" : "border-border hover:border-primary/50"
              }`}
            >
              {/* Color swatches */}
              <div className="flex gap-1 mb-2">
                <div className="w-6 h-6 rounded-full border" style={{ backgroundColor: theme.headingColor }} title="Heading" />
                <div className="w-6 h-6 rounded-full border" style={{ backgroundColor: theme.accentColor }} title="Accent" />
                <div className="w-6 h-6 rounded-full border" style={{ backgroundColor: theme.backgroundColor }} title="Background" />
              </div>
              {/* Mini page preview */}
              <div
                className="rounded border h-16 mb-2 p-2 flex flex-col gap-1 overflow-hidden"
                style={{ backgroundColor: theme.backgroundColor }}
              >
                <div className="h-1.5 rounded-sm w-3/4" style={{ backgroundColor: theme.headingColor }} />
                <div className="h-1 rounded-sm w-full" style={{ backgroundColor: theme.bodyColor, opacity: 0.5 }} />
                <div className="h-1 rounded-sm w-5/6" style={{ backgroundColor: theme.bodyColor, opacity: 0.5 }} />
                <div className="h-2 rounded-sm w-1/3 mt-auto" style={{ backgroundColor: theme.accentColor }} />
              </div>
              <p className="text-xs font-medium truncate">{theme.name}</p>
              <p className="text-[10px] text-muted-foreground">{theme.fontFamily}</p>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
