
# Standardize All Sidebar Menus Across the App

## Problem
Every page has its own copy of `sidebarItems` and they are all different. 10 out of 13 pages still include "Sources" (which was removed from the app). Several pages have completely outdated menus (Analytics has Content/Images/Schedule, ProductIdeas has Pins/Boards/Images from the old Pinterest era). Active item styling also varies between pages.

## Solution

### Step 1: Standardize all sidebar items

Every page will use the same menu items matching the Dashboard (the canonical version):

| # | Icon | Label | Route |
|---|------|-------|-------|
| 1 | LayoutDashboard | Dashboard | /dashboard |
| 2 | Lightbulb | Product Ideas | /product-ideas |
| 3 | FileText | Outlines | /outlines |
| 4 | Library | Templates | /templates |
| 5 | Palette | Image Studio | /image-studio |
| 6 | Download | Export Center | /export-center |
| 7 | BookOpen | KDP Publisher | /kdp |
| 8 | ShoppingCart | Sales Pages | /sales-pages |
| 9 | Rocket | Launch Toolkit | /launch-toolkit |
| 10 | HelpCircle | Help and Resources | /help |
| 11 | Settings | Settings | /settings |

### Step 2: Standardize active item styling

All pages will use the same active style from the Dashboard:
- Active: `bg-primary text-primary-foreground shadow-sm`
- Inactive: `text-muted-foreground hover:bg-accent hover:text-foreground`

Remove `bg-pinterest-gradient` from ProductIdeas.

### Step 3: Clean up unused imports

Remove `Rss` icon imports and any other icons no longer referenced (e.g., `Pin`, `LayoutGrid`, `Image` from ProductIdeas, `Calendar`, `BarChart3` from Analytics).

## Files to Update (12 files)

| File | What changes |
|------|-------------|
| `src/pages/Analytics.tsx` | Replace entire old sidebar list; fix imports |
| `src/pages/ContentEditor.tsx` | Replace sidebar list; remove Sources and Rss import |
| `src/pages/Help.tsx` | Remove Sources entry; remove Rss import |
| `src/pages/LaunchToolkit.tsx` | Remove Sources, add Help; remove Rss import |
| `src/pages/SalesPageBuilder.tsx` | Replace sidebar list (add Templates, Launch, Help; remove Sources); fix active style; remove Rss import |
| `src/pages/KDPPublisher.tsx` | Replace sidebar list (add Sales, Launch, Templates, Help; remove Sources); remove Rss import |
| `src/pages/ImageStudio.tsx` | Replace sidebar list (add missing items; remove Sources); remove Rss import |
| `src/pages/ProductIdeas.tsx` | Replace entire old Pinterest sidebar list; fix active style from `bg-pinterest-gradient` to `bg-primary`; fix imports |
| `src/pages/TemplateLibrary.tsx` | Remove Sources, add Help; fix active style; remove Rss import |
| `src/pages/Settings.tsx` | Remove Sources, add Help; remove Rss import |
| `src/pages/ExportCenter.tsx` | Replace sidebar list (add missing items; remove Sources); remove Rss import |
| `src/pages/ProductOutline.tsx` | Replace sidebar list; remove Rss import |

**No changes needed:** `src/pages/Dashboard.tsx` (already correct)
