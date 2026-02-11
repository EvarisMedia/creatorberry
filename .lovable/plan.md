

# Rebrand App to "CreatorBerry"

## Overview
Rename the entire app from "Creator OS" to "CreatorBerry", add the uploaded logo, and update the color palette to match the logo's strawberry pink and purple tones.

## Brand Colors (from logo)
- **Primary**: Strawberry Pink -- `hsl(340, 82%, 65%)` (the pink from the berry/text)
- **Secondary**: Berry Purple -- `hsl(270, 65%, 55%)` (the purple "Creator" text)
- Gradient: Pink-to-Purple (strawberry theme)
- Keep the warm, playful feel consistent with the kawaii strawberry mascot

## Changes

### 1. Add Logo Asset
- Copy `user-uploads://image-2.png` to `src/assets/creatorberry-logo.png`
- Use as an imported asset in React components

### 2. Update Color Palette (`src/index.css`)
- **Primary**: Shift from coral `hsl(0, 100%, 71%)` to strawberry pink `hsl(340, 82%, 65%)`
- **Secondary**: Adjust purple to `hsl(270, 65%, 55%)` to match logo
- **Ring/Accent**: Update to match new primary
- Update gradient utilities (`.bg-creator-gradient`, `.text-creator-gradient`) to use strawberry-pink-to-berry-purple
- Update dark mode variants accordingly
- Rename gradient classes from `creator-gradient` to `berry-gradient`

### 3. Update `index.html`
- Title: "CreatorBerry - Build, Validate & Launch Digital Products"
- Meta author: "CreatorBerry"
- OG tags: Update all "Creator OS" references to "CreatorBerry"

### 4. Replace All "Creator OS" Text References (28 files)
Key files with brand name occurrences:
- `src/components/landing/Header.tsx` -- Replace Sparkles icon with logo image, rename text
- `src/components/landing/Footer.tsx` -- Replace icon and text
- `src/components/landing/HeroSection.tsx` -- Update gradient class names
- `src/components/landing/CTASection.tsx` -- Update text
- `src/components/landing/PricingSection.tsx` -- Update gradient classes
- `src/components/landing/FAQSection.tsx` -- Update gradient classes
- `src/components/landing/ProblemSolutionSection.tsx` -- Update gradient classes
- `src/components/landing/CreatorsSection.tsx` -- Update gradient classes
- `src/components/landing/UseCasesSection.tsx` -- Update text
- `src/pages/Dashboard.tsx` -- Replace sidebar logo (Sparkles icon to logo image), rename text
- `src/pages/Auth.tsx` -- Replace logo and text
- `src/pages/PendingApproval.tsx` -- Replace logo and text
- `src/pages/Help.tsx` -- Replace logo and all documentation references
- `src/pages/Analytics.tsx` -- Replace logo and text
- `src/pages/ProductOutline.tsx` -- Replace logo and text
- All other pages with sidebar logos (same pattern)

### 5. Update Gradient Class Names (`src/index.css` + all component files)
- `.bg-creator-gradient` becomes `.bg-berry-gradient`
- `.text-creator-gradient` becomes `.text-berry-gradient`
- `.bg-creator-gradient-hover` becomes `.bg-berry-gradient-hover`
- `.bg-hero-gradient` -- adjust hues to pink/purple
- `.bg-mesh-gradient` -- adjust radial gradient colors
- Update all component files referencing these classes

### 6. Update `tailwind.config.ts`
- No structural changes needed (colors come from CSS variables)

## Files Modified

| File | Change |
|------|--------|
| `src/assets/creatorberry-logo.png` | **New** -- logo asset |
| `index.html` | Update title, meta tags |
| `src/index.css` | Update color variables, rename gradient utilities |
| `src/components/landing/Header.tsx` | Logo image + "CreatorBerry" + gradient classes |
| `src/components/landing/Footer.tsx` | Logo image + "CreatorBerry" |
| `src/components/landing/HeroSection.tsx` | Gradient classes |
| `src/components/landing/CTASection.tsx` | Text + gradient classes |
| `src/components/landing/PricingSection.tsx` | Gradient classes |
| `src/components/landing/FAQSection.tsx` | Gradient classes |
| `src/components/landing/ProblemSolutionSection.tsx` | Gradient classes |
| `src/components/landing/CreatorsSection.tsx` | Gradient classes |
| `src/components/landing/UseCasesSection.tsx` | Text |
| `src/pages/Dashboard.tsx` | Sidebar logo + text |
| `src/pages/Auth.tsx` | Logo + text |
| `src/pages/PendingApproval.tsx` | Logo + text |
| `src/pages/Help.tsx` | Logo + all doc text references |
| `src/pages/Analytics.tsx` | Logo + text |
| `src/pages/ProductOutline.tsx` | Logo + text |
| All remaining pages with sidebar pattern | Logo + text |

## No Database Changes
This is a purely frontend/visual rebrand.

