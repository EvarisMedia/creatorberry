/**
 * Unified EbookTemplate config — single source of truth for PDF, HTML, DOCX, EPUB styling.
 * Maps to existing theme names from ThemeGallery + themeBackgrounds.
 */

export interface EbookTemplateFonts {
  heading: string;
  body: string;
  headingWeight?: "bold" | "normal";
}

export interface EbookTemplateColors {
  background: string;
  text: string;
  heading: string;
  accent: string;
  chapterBg: string;
  mutedText: string;
}

export interface EbookTemplate {
  id: string;
  name: string;
  description: string;
  fonts: EbookTemplateFonts;
  colors: EbookTemplateColors;
  coverStyle: "accent-bar" | "full-bleed" | "split" | "centered" | "geometric";
  chapterOpenerStyle: "centered" | "full-image" | "stripe" | "minimal" | "bold-number";
  pageLayout: "single-column" | "wide-margins" | "editorial";
  /** CSS variables for HTML export */
  cssVariables: Record<string, string>;
  /** Thumbnail for picker UI */
  thumbnail: { primary: string; secondary: string; accent: string };
}

/**
 * 8 templates matching existing theme names from themeBackgrounds.ts
 */
export const EBOOK_TEMPLATES: Record<string, EbookTemplate> = {
  "Minimal Clean": {
    id: "minimal-clean",
    name: "Minimal Clean",
    description: "Clean, airy design with soft indigo accents",
    fonts: { heading: "Helvetica", body: "Helvetica" },
    colors: {
      background: "#ffffff",
      text: "#334155",
      heading: "#1a1a2e",
      accent: "#6366f1",
      chapterBg: "#f8f8ff",
      mutedText: "#94a3b8",
    },
    coverStyle: "centered",
    chapterOpenerStyle: "centered",
    pageLayout: "single-column",
    cssVariables: {
      "--bg": "#ffffff",
      "--text": "#334155",
      "--heading": "#1a1a2e",
      "--accent": "#6366f1",
    },
    thumbnail: { primary: "#ffffff", secondary: "#f8f8ff", accent: "#6366f1" },
  },

  "Classic Elegant": {
    id: "classic-elegant",
    name: "Classic Elegant",
    description: "Timeless typography with warm gold accents",
    fonts: { heading: "Times-Roman", body: "Times-Roman" },
    colors: {
      background: "#fffdf7",
      text: "#3c3c3c",
      heading: "#2d1f0e",
      accent: "#8b6f47",
      chapterBg: "#f5f0e6",
      mutedText: "#8b7355",
    },
    coverStyle: "accent-bar",
    chapterOpenerStyle: "minimal",
    pageLayout: "wide-margins",
    cssVariables: {
      "--bg": "#fffdf7",
      "--text": "#3c3c3c",
      "--heading": "#2d1f0e",
      "--accent": "#8b6f47",
    },
    thumbnail: { primary: "#fffdf7", secondary: "#f5f0e6", accent: "#8b6f47" },
  },

  "Bold Modern": {
    id: "bold-modern",
    name: "Bold Modern",
    description: "High-contrast design with bold red accents",
    fonts: { heading: "Helvetica", body: "Helvetica" },
    colors: {
      background: "#ffffff",
      text: "#1e293b",
      heading: "#0f172a",
      accent: "#ef4444",
      chapterBg: "#ef4444",
      mutedText: "#64748b",
    },
    coverStyle: "accent-bar",
    chapterOpenerStyle: "bold-number",
    pageLayout: "single-column",
    cssVariables: {
      "--bg": "#ffffff",
      "--text": "#1e293b",
      "--heading": "#0f172a",
      "--accent": "#ef4444",
    },
    thumbnail: { primary: "#ffffff", secondary: "#0f172a", accent: "#ef4444" },
  },

  "Warm Earthy": {
    id: "warm-earthy",
    name: "Warm Earthy",
    description: "Natural tones with amber dot patterns",
    fonts: { heading: "Times-Roman", body: "Helvetica" },
    colors: {
      background: "#fffbf0",
      text: "#44403c",
      heading: "#422006",
      accent: "#d97706",
      chapterBg: "#fef3c7",
      mutedText: "#78716c",
    },
    coverStyle: "centered",
    chapterOpenerStyle: "centered",
    pageLayout: "single-column",
    cssVariables: {
      "--bg": "#fffbf0",
      "--text": "#44403c",
      "--heading": "#422006",
      "--accent": "#d97706",
    },
    thumbnail: { primary: "#fffbf0", secondary: "#fef3c7", accent: "#d97706" },
  },

  "Ocean Breeze": {
    id: "ocean-breeze",
    name: "Ocean Breeze",
    description: "Cool cyan tones with wave accents",
    fonts: { heading: "Helvetica", body: "Helvetica" },
    colors: {
      background: "#f0fdff",
      text: "#334155",
      heading: "#164e63",
      accent: "#0891b2",
      chapterBg: "#e0f7fa",
      mutedText: "#64748b",
    },
    coverStyle: "accent-bar",
    chapterOpenerStyle: "stripe",
    pageLayout: "single-column",
    cssVariables: {
      "--bg": "#f0fdff",
      "--text": "#334155",
      "--heading": "#164e63",
      "--accent": "#0891b2",
    },
    thumbnail: { primary: "#f0fdff", secondary: "#e0f7fa", accent: "#0891b2" },
  },

  "Dark Professional": {
    id: "dark-professional",
    name: "Dark Professional",
    description: "Dark mode with indigo accents and dot patterns",
    fonts: { heading: "Helvetica", body: "Helvetica" },
    colors: {
      background: "#0f172a",
      text: "#cbd5e1",
      heading: "#e2e8f0",
      accent: "#818cf8",
      chapterBg: "#1e293b",
      mutedText: "#64748b",
    },
    coverStyle: "geometric",
    chapterOpenerStyle: "bold-number",
    pageLayout: "single-column",
    cssVariables: {
      "--bg": "#0f172a",
      "--text": "#cbd5e1",
      "--heading": "#e2e8f0",
      "--accent": "#818cf8",
    },
    thumbnail: { primary: "#0f172a", secondary: "#1e293b", accent: "#818cf8" },
  },

  "Playful Creative": {
    id: "playful-creative",
    name: "Playful Creative",
    description: "Vibrant pink and purple with playful blobs",
    fonts: { heading: "Helvetica", body: "Helvetica" },
    colors: {
      background: "#fdf4ff",
      text: "#3b0764",
      heading: "#7c3aed",
      accent: "#ec4899",
      chapterBg: "#fce7f3",
      mutedText: "#a855f7",
    },
    coverStyle: "centered",
    chapterOpenerStyle: "centered",
    pageLayout: "single-column",
    cssVariables: {
      "--bg": "#fdf4ff",
      "--text": "#3b0764",
      "--heading": "#7c3aed",
      "--accent": "#ec4899",
    },
    thumbnail: { primary: "#fdf4ff", secondary: "#fce7f3", accent: "#ec4899" },
  },

  "Nature Zen": {
    id: "nature-zen",
    name: "Nature Zen",
    description: "Calming greens with organic shapes",
    fonts: { heading: "Times-Roman", body: "Helvetica" },
    colors: {
      background: "#f0fdf4",
      text: "#334155",
      heading: "#14532d",
      accent: "#16a34a",
      chapterBg: "#dcfce7",
      mutedText: "#6b7280",
    },
    coverStyle: "accent-bar",
    chapterOpenerStyle: "minimal",
    pageLayout: "wide-margins",
    cssVariables: {
      "--bg": "#f0fdf4",
      "--text": "#334155",
      "--heading": "#14532d",
      "--accent": "#16a34a",
    },
    thumbnail: { primary: "#f0fdf4", secondary: "#dcfce7", accent: "#16a34a" },
  },
};

/**
 * Resolve a template from a theme name or PDFStyleConfig.
 * Falls back to Minimal Clean.
 */
export function resolveTemplate(themeName?: string): EbookTemplate {
  if (themeName && EBOOK_TEMPLATES[themeName]) {
    return EBOOK_TEMPLATES[themeName];
  }
  return EBOOK_TEMPLATES["Minimal Clean"];
}
