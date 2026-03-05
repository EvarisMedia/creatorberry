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
  cssVariables: Record<string, string>;
  thumbnail: { primary: string; secondary: string; accent: string };
}

export const EBOOK_TEMPLATES: Record<string, EbookTemplate> = {
  "Minimal Clean": {
    id: "minimal-clean", name: "Minimal Clean", description: "Clean, airy design with soft indigo accents",
    fonts: { heading: "Helvetica", body: "Helvetica" },
    colors: { background: "#ffffff", text: "#334155", heading: "#1a1a2e", accent: "#6366f1", chapterBg: "#f8f8ff", mutedText: "#94a3b8" },
    coverStyle: "centered", chapterOpenerStyle: "centered", pageLayout: "single-column",
    cssVariables: { "--bg": "#ffffff", "--text": "#334155", "--heading": "#1a1a2e", "--accent": "#6366f1" },
    thumbnail: { primary: "#ffffff", secondary: "#f8f8ff", accent: "#6366f1" },
  },
  "Classic Elegant": {
    id: "classic-elegant", name: "Classic Elegant", description: "Timeless typography with warm gold accents",
    fonts: { heading: "Times-Roman", body: "Times-Roman" },
    colors: { background: "#fffdf7", text: "#3c3c3c", heading: "#2d1f0e", accent: "#8b6f47", chapterBg: "#f5f0e6", mutedText: "#8b7355" },
    coverStyle: "accent-bar", chapterOpenerStyle: "minimal", pageLayout: "wide-margins",
    cssVariables: { "--bg": "#fffdf7", "--text": "#3c3c3c", "--heading": "#2d1f0e", "--accent": "#8b6f47" },
    thumbnail: { primary: "#fffdf7", secondary: "#f5f0e6", accent: "#8b6f47" },
  },
  "Bold Modern": {
    id: "bold-modern", name: "Bold Modern", description: "High-contrast design with bold red accents",
    fonts: { heading: "Helvetica", body: "Helvetica" },
    colors: { background: "#ffffff", text: "#1e293b", heading: "#0f172a", accent: "#ef4444", chapterBg: "#ef4444", mutedText: "#64748b" },
    coverStyle: "accent-bar", chapterOpenerStyle: "bold-number", pageLayout: "single-column",
    cssVariables: { "--bg": "#ffffff", "--text": "#1e293b", "--heading": "#0f172a", "--accent": "#ef4444" },
    thumbnail: { primary: "#ffffff", secondary: "#0f172a", accent: "#ef4444" },
  },
  "Warm Earthy": {
    id: "warm-earthy", name: "Warm Earthy", description: "Natural tones with amber dot patterns",
    fonts: { heading: "Times-Roman", body: "Helvetica" },
    colors: { background: "#fffbf0", text: "#44403c", heading: "#422006", accent: "#d97706", chapterBg: "#fef3c7", mutedText: "#78716c" },
    coverStyle: "centered", chapterOpenerStyle: "centered", pageLayout: "single-column",
    cssVariables: { "--bg": "#fffbf0", "--text": "#44403c", "--heading": "#422006", "--accent": "#d97706" },
    thumbnail: { primary: "#fffbf0", secondary: "#fef3c7", accent: "#d97706" },
  },
  "Ocean Breeze": {
    id: "ocean-breeze", name: "Ocean Breeze", description: "Cool cyan tones with wave accents",
    fonts: { heading: "Helvetica", body: "Helvetica" },
    colors: { background: "#f0fdff", text: "#334155", heading: "#164e63", accent: "#0891b2", chapterBg: "#e0f7fa", mutedText: "#64748b" },
    coverStyle: "accent-bar", chapterOpenerStyle: "stripe", pageLayout: "single-column",
    cssVariables: { "--bg": "#f0fdff", "--text": "#334155", "--heading": "#164e63", "--accent": "#0891b2" },
    thumbnail: { primary: "#f0fdff", secondary: "#e0f7fa", accent: "#0891b2" },
  },
  "Dark Professional": {
    id: "dark-professional", name: "Dark Professional", description: "Dark mode with indigo accents and dot patterns",
    fonts: { heading: "Helvetica", body: "Helvetica" },
    colors: { background: "#0f172a", text: "#cbd5e1", heading: "#e2e8f0", accent: "#818cf8", chapterBg: "#1e293b", mutedText: "#64748b" },
    coverStyle: "geometric", chapterOpenerStyle: "bold-number", pageLayout: "single-column",
    cssVariables: { "--bg": "#0f172a", "--text": "#cbd5e1", "--heading": "#e2e8f0", "--accent": "#818cf8" },
    thumbnail: { primary: "#0f172a", secondary: "#1e293b", accent: "#818cf8" },
  },
  "Playful Creative": {
    id: "playful-creative", name: "Playful Creative", description: "Vibrant pink and purple with playful blobs",
    fonts: { heading: "Helvetica", body: "Helvetica" },
    colors: { background: "#fdf4ff", text: "#3b0764", heading: "#7c3aed", accent: "#ec4899", chapterBg: "#fce7f3", mutedText: "#a855f7" },
    coverStyle: "centered", chapterOpenerStyle: "centered", pageLayout: "single-column",
    cssVariables: { "--bg": "#fdf4ff", "--text": "#3b0764", "--heading": "#7c3aed", "--accent": "#ec4899" },
    thumbnail: { primary: "#fdf4ff", secondary: "#fce7f3", accent: "#ec4899" },
  },
  "Nature Zen": {
    id: "nature-zen", name: "Nature Zen", description: "Calming greens with organic shapes",
    fonts: { heading: "Times-Roman", body: "Helvetica" },
    colors: { background: "#f0fdf4", text: "#334155", heading: "#14532d", accent: "#16a34a", chapterBg: "#dcfce7", mutedText: "#6b7280" },
    coverStyle: "accent-bar", chapterOpenerStyle: "minimal", pageLayout: "wide-margins",
    cssVariables: { "--bg": "#f0fdf4", "--text": "#334155", "--heading": "#14532d", "--accent": "#16a34a" },
    thumbnail: { primary: "#f0fdf4", secondary: "#dcfce7", accent: "#16a34a" },
  },

  // ========== NEW THEMES ==========

  "Sunset Glow": {
    id: "sunset-glow", name: "Sunset Glow", description: "Warm orange and coral gradients with wave accents",
    fonts: { heading: "Helvetica", body: "Helvetica" },
    colors: { background: "#fffbeb", text: "#44403c", heading: "#7c2d12", accent: "#f97316", chapterBg: "#fed7aa", mutedText: "#a8a29e" },
    coverStyle: "full-bleed", chapterOpenerStyle: "stripe", pageLayout: "single-column",
    cssVariables: { "--bg": "#fffbeb", "--text": "#44403c", "--heading": "#7c2d12", "--accent": "#f97316" },
    thumbnail: { primary: "#fffbeb", secondary: "#fed7aa", accent: "#f97316" },
  },
  "Midnight Luxe": {
    id: "midnight-luxe", name: "Midnight Luxe", description: "Deep navy with gold geometric accents",
    fonts: { heading: "Times-Roman", body: "Helvetica" },
    colors: { background: "#0f172a", text: "#d1d5db", heading: "#fef3c7", accent: "#d4a853", chapterBg: "#1e293b", mutedText: "#6b7280" },
    coverStyle: "geometric", chapterOpenerStyle: "bold-number", pageLayout: "wide-margins",
    cssVariables: { "--bg": "#0f172a", "--text": "#d1d5db", "--heading": "#fef3c7", "--accent": "#d4a853" },
    thumbnail: { primary: "#0f172a", secondary: "#1e293b", accent: "#d4a853" },
  },
  "Pastel Dreams": {
    id: "pastel-dreams", name: "Pastel Dreams", description: "Soft pink and lavender with floating blobs",
    fonts: { heading: "Helvetica", body: "Helvetica" },
    colors: { background: "#fdf2f8", text: "#6b7280", heading: "#831843", accent: "#e879a8", chapterBg: "#fce7f3", mutedText: "#9ca3af" },
    coverStyle: "centered", chapterOpenerStyle: "centered", pageLayout: "single-column",
    cssVariables: { "--bg": "#fdf2f8", "--text": "#6b7280", "--heading": "#831843", "--accent": "#e879a8" },
    thumbnail: { primary: "#fdf2f8", secondary: "#fce7f3", accent: "#e879a8" },
  },
  "Tech Grid": {
    id: "tech-grid", name: "Tech Grid", description: "Dark background with cyan grid lines and dot patterns",
    fonts: { heading: "Helvetica", body: "Helvetica" },
    colors: { background: "#0c1222", text: "#94a3b8", heading: "#e2e8f0", accent: "#06b6d4", chapterBg: "#1a2332", mutedText: "#475569" },
    coverStyle: "geometric", chapterOpenerStyle: "bold-number", pageLayout: "single-column",
    cssVariables: { "--bg": "#0c1222", "--text": "#94a3b8", "--heading": "#e2e8f0", "--accent": "#06b6d4" },
    thumbnail: { primary: "#0c1222", secondary: "#1a2332", accent: "#06b6d4" },
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
