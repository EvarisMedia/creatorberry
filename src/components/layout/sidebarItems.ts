import {
  LayoutDashboard,
  Lightbulb,
  FileText,
  Library,
  Palette,
  Download,
  BookOpen,
  ShoppingCart,
  Rocket,
  HelpCircle,
  Settings,
} from "lucide-react";

export const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Lightbulb, label: "Product Ideas", href: "/product-ideas" },
  { icon: FileText, label: "Outlines", href: "/outlines" },
  { icon: Library, label: "Templates", href: "/templates" },
  { icon: Palette, label: "Image Studio", href: "/image-studio" },
  { icon: Download, label: "Export Center", href: "/export-center" },
  { icon: BookOpen, label: "KDP Publisher", href: "/kdp" },
  { icon: ShoppingCart, label: "Sales Pages", href: "/sales-pages" },
  { icon: Rocket, label: "Launch Toolkit", href: "/launch-toolkit" },
  { icon: HelpCircle, label: "Help & Resources", href: "/help" },
  { icon: Settings, label: "Settings", href: "/settings" },
];
