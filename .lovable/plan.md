

# Fix Logo Sizing in Header and Dashboard Sidebar

## Problem
1. **Landing page header**: The logo at `w-40` (10rem) overflows the `h-16` (4rem) header height
2. **Dashboard sidebar**: The logo container has `p-5` padding, creating excessive white space around the logo

## Changes

### 1. Landing Page Header (`src/components/landing/Header.tsx`)
- Increase header height from `h-16` to `h-20` (5rem) so the logo fits comfortably

### 2. Dashboard Sidebar (`src/pages/Dashboard.tsx`)
- Reduce the logo container padding from `p-5` to `p-3` to minimize white space around the logo
- This same change applies to all other dashboard-style pages that share the same sidebar layout

### Files to Update

| File | Change |
|------|--------|
| `src/components/landing/Header.tsx` | `h-16` to `h-20` on the container div |
| `src/pages/Dashboard.tsx` | Logo wrapper `p-5` to `p-3` |
| All other sidebar pages (~12 files) | Same `p-5` to `p-3` change on the logo container |

