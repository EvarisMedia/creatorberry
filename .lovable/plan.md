
# Help & Resources Page

## Overview
Create a new `/help` page accessible from the sidebar that serves as a comprehensive in-app documentation and workflow guide for Creator OS. It will cover the full step-by-step workflow and document every module.

## Changes

### 1. New Page: `src/pages/Help.tsx`
A full documentation page using the existing sidebar layout pattern (matching Dashboard). Content organized with Accordion components for collapsible sections:

**Sections:**
- **Getting Started** -- Account setup, creating your first brand, understanding the dashboard
- **Step-by-Step Workflow** -- The 4-step process documented in detail:
  1. Set Up Your Brand -- Voice, audience, tone, beliefs, offers
  2. Generate Product Ideas -- Sources, AI ideation, PMF scoring explained
  3. Build Your Product -- Outlines, content expansion, image studio, templates
  4. Export & Launch -- Export center, KDP publisher, sales pages, launch toolkit
- **Modules Reference** -- One accordion item per module:
  - Dashboard, Product Ideas, Outlines, Templates, Image Studio, Export Center, KDP Publisher, Sales Pages, Launch Toolkit, Sources, Settings
- **FAQ** -- Common questions about using the app
- **Keyboard Shortcuts & Tips** -- Power-user tips

Uses `Accordion`, `Card`, and existing UI components. Same sidebar layout as Dashboard with the Help item highlighted.

### 2. Add Route: `src/App.tsx`
- Import and add `<Route path="/help" element={<Help />} />`

### 3. Add Sidebar Link: `src/pages/Dashboard.tsx`
- Add a `HelpCircle` icon item `{ icon: HelpCircle, label: "Help & Resources", href: "/help" }` to the `sidebarItems` array (before Settings)

## Technical Details
- No database changes needed -- purely static content page
- Reuses the sidebar layout pattern from Dashboard.tsx (copy the sidebar shell)
- Uses `Accordion` from `@radix-ui/react-accordion` (already installed)
- Uses `Card`, `Badge` components for visual structure
- Fully responsive with the existing sidebar collapse pattern
