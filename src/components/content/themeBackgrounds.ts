export interface BackgroundElement {
  type: "circle" | "rect" | "gradient" | "wave" | "dots" | "stripe" | "blob" | "line";
  position: { top?: string; right?: string; bottom?: string; left?: string };
  size: { width: string; height: string };
  color: string;
  opacity: number;
  rotation?: number;
  borderRadius?: string;
  // For gradient type
  gradient?: string;
  // For SVG-based types (wave, blob)
  svgPath?: string;
  viewBox?: string;
}

export interface ThemeBackgroundDesign {
  elements: BackgroundElement[];
  contentPadding: { top: number; right: number; bottom: number; left: number };
}

export const THEME_BACKGROUNDS: Record<string, ThemeBackgroundDesign> = {
  "Minimal Clean": {
    contentPadding: { top: 48, right: 40, bottom: 40, left: 40 },
    elements: [
      {
        type: "circle",
        position: { top: "-60px", left: "-60px" },
        size: { width: "180px", height: "180px" },
        color: "#6366f1",
        opacity: 0.07,
        borderRadius: "50%",
      },
      {
        type: "line",
        position: { bottom: "24px", left: "40px", right: "40px" },
        size: { width: "calc(100% - 80px)", height: "2px" },
        color: "#6366f1",
        opacity: 0.15,
      },
      {
        type: "circle",
        position: { bottom: "-30px", right: "-30px" },
        size: { width: "80px", height: "80px" },
        color: "#6366f1",
        opacity: 0.04,
        borderRadius: "50%",
      },
    ],
  },

  "Classic Elegant": {
    contentPadding: { top: 56, right: 44, bottom: 44, left: 44 },
    elements: [
      {
        type: "gradient",
        position: { top: "0", left: "0" },
        size: { width: "100%", height: "80px" },
        color: "#8b6f47",
        opacity: 0.08,
        gradient: "linear-gradient(180deg, #8b6f47 0%, transparent 100%)",
      },
      {
        type: "rect",
        position: { top: "16px", left: "16px" },
        size: { width: "40px", height: "40px" },
        color: "#8b6f47",
        opacity: 0.1,
        rotation: 45,
        borderRadius: "4px",
      },
      {
        type: "rect",
        position: { bottom: "16px", right: "16px" },
        size: { width: "40px", height: "40px" },
        color: "#8b6f47",
        opacity: 0.1,
        rotation: 45,
        borderRadius: "4px",
      },
      {
        type: "line",
        position: { top: "0", left: "0" },
        size: { width: "100%", height: "4px" },
        color: "#8b6f47",
        opacity: 0.2,
      },
    ],
  },

  "Bold Modern": {
    contentPadding: { top: 52, right: 40, bottom: 36, left: 40 },
    elements: [
      {
        type: "rect",
        position: { top: "0", left: "0" },
        size: { width: "100%", height: "6px" },
        color: "#ef4444",
        opacity: 0.85,
      },
      {
        type: "rect",
        position: { top: "-40px", right: "-20px" },
        size: { width: "140px", height: "140px" },
        color: "#ef4444",
        opacity: 0.06,
        rotation: 35,
      },
      {
        type: "stripe",
        position: { bottom: "0", left: "0" },
        size: { width: "60px", height: "100%" },
        color: "#0f172a",
        opacity: 0.03,
      },
    ],
  },

  "Warm Earthy": {
    contentPadding: { top: 44, right: 40, bottom: 40, left: 40 },
    elements: [
      {
        type: "gradient",
        position: { top: "0", left: "0" },
        size: { width: "100%", height: "100%" },
        color: "#d97706",
        opacity: 1,
        gradient: "radial-gradient(ellipse at 20% 20%, rgba(217,119,6,0.06) 0%, transparent 60%)",
      },
      {
        type: "dots",
        position: { top: "0", left: "0" },
        size: { width: "100%", height: "100%" },
        color: "#d97706",
        opacity: 0.06,
      },
      {
        type: "line",
        position: { bottom: "0", left: "0" },
        size: { width: "100%", height: "3px" },
        color: "#d97706",
        opacity: 0.15,
      },
    ],
  },

  "Ocean Breeze": {
    contentPadding: { top: 40, right: 40, bottom: 56, left: 40 },
    elements: [
      {
        type: "gradient",
        position: { top: "0", left: "0" },
        size: { width: "100%", height: "100%" },
        color: "#0891b2",
        opacity: 1,
        gradient: "linear-gradient(180deg, rgba(8,145,178,0.05) 0%, transparent 40%)",
      },
      {
        type: "wave",
        position: { bottom: "0", left: "0" },
        size: { width: "100%", height: "60px" },
        color: "#0891b2",
        opacity: 0.1,
        svgPath: "M0,20 Q25,0 50,20 T100,20 L100,60 L0,60 Z",
        viewBox: "0 0 100 60",
      },
      {
        type: "circle",
        position: { top: "20px", right: "20px" },
        size: { width: "60px", height: "60px" },
        color: "#0891b2",
        opacity: 0.05,
        borderRadius: "50%",
      },
    ],
  },

  "Dark Professional": {
    contentPadding: { top: 48, right: 44, bottom: 44, left: 44 },
    elements: [
      {
        type: "rect",
        position: { top: "-20px", left: "-20px" },
        size: { width: "100px", height: "100px" },
        color: "#818cf8",
        opacity: 0.08,
        rotation: 45,
      },
      {
        type: "rect",
        position: { bottom: "-20px", right: "-20px" },
        size: { width: "80px", height: "80px" },
        color: "#818cf8",
        opacity: 0.06,
        rotation: 45,
      },
      {
        type: "dots",
        position: { top: "0", left: "0" },
        size: { width: "100%", height: "100%" },
        color: "#818cf8",
        opacity: 0.04,
      },
      {
        type: "line",
        position: { left: "0", top: "0" },
        size: { width: "3px", height: "100%" },
        color: "#818cf8",
        opacity: 0.15,
      },
    ],
  },

  "Playful Creative": {
    contentPadding: { top: 48, right: 44, bottom: 48, left: 44 },
    elements: [
      {
        type: "blob",
        position: { top: "-30px", right: "-30px" },
        size: { width: "120px", height: "120px" },
        color: "#ec4899",
        opacity: 0.1,
        svgPath: "M50,5 C70,0 95,15 90,40 C100,60 85,90 60,95 C35,100 10,85 5,60 C0,35 25,10 50,5Z",
        viewBox: "0 0 100 100",
      },
      {
        type: "blob",
        position: { bottom: "-20px", left: "-20px" },
        size: { width: "100px", height: "100px" },
        color: "#7c3aed",
        opacity: 0.08,
        svgPath: "M45,5 C65,0 90,20 95,45 C100,70 80,95 55,95 C30,95 5,75 5,50 C5,25 25,10 45,5Z",
        viewBox: "0 0 100 100",
      },
      {
        type: "dots",
        position: { top: "0", left: "0" },
        size: { width: "100%", height: "100%" },
        color: "#ec4899",
        opacity: 0.05,
      },
    ],
  },

  "Nature Zen": {
    contentPadding: { top: 44, right: 44, bottom: 48, left: 44 },
    elements: [
      {
        type: "gradient",
        position: { top: "0", left: "0" },
        size: { width: "100%", height: "100%" },
        color: "#16a34a",
        opacity: 1,
        gradient: "linear-gradient(135deg, rgba(20,83,45,0.04) 0%, transparent 50%)",
      },
      {
        type: "blob",
        position: { top: "10px", right: "10px" },
        size: { width: "80px", height: "80px" },
        color: "#16a34a",
        opacity: 0.08,
        svgPath: "M50,0 C60,10 80,15 85,35 C90,55 75,70 60,80 C45,90 25,85 15,70 C5,55 10,30 25,15 C35,5 45,-5 50,0Z",
        viewBox: "0 0 100 100",
      },
      {
        type: "line",
        position: { bottom: "0", left: "0" },
        size: { width: "100%", height: "3px" },
        color: "#16a34a",
        opacity: 0.12,
      },
      {
        type: "circle",
        position: { bottom: "40px", left: "-20px" },
        size: { width: "50px", height: "50px" },
        color: "#16a34a",
        opacity: 0.05,
        borderRadius: "50%",
      },
    ],
  },
};
