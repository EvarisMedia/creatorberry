
# Clean Up Settings Page

## Problem
The Settings page has an outdated left sidebar with old navigation links (Content, Sources, Images, Schedule, Analytics) that don't match the current app navigation. It also contains many settings sections that are irrelevant to this product-building app (RSS management, scheduling preferences, multi-type generation, image preferences, notifications).

## Changes

### 1. Replace the old sidebar with the current app sidebar
Remove the hardcoded old sidebar (lines 204-323) and replace it with the same sidebar used in Dashboard.tsx, which includes: Dashboard, Product Ideas, Outlines, Templates, Image Studio, Export Center, KDP Publisher, Sales Pages, Launch Toolkit, Sources, Settings.

### 2. Remove irrelevant settings sections
Remove the following cards that are leftover from a social media content tool and not relevant:
- **Content Generation** (posts per source, post length, post type, media format, creativity, CTA toggle)
- **Multi-Type Generation** (mixed types, enabled post types)
- **Scheduling Preferences** (posting times, posts per week, auto-schedule, weekends)
- **Source Management** (RSS refresh, max items, auto-generate, freshness)
- **Image Preferences** (image style, image type, auto-generate images)
- **Notifications** (email notifications, weekly digest, reminders, alerts)

### 3. Keep these sections
- **Profile** -- name, email, account created
- **AI Configuration** -- Gemini API key, model selection, connection test
- **Account** -- sign out button

### Technical Details
- **File modified:** `src/pages/Settings.tsx`
- Remove unused imports: `useUserSettings`, `ALL_POST_TYPES`, `ALL_MEDIA_FORMATS`, `useBrands`, `Slider`, `Checkbox`, `Switch`, various icon imports, `DropdownMenu` components, and constants (`POST_LENGTHS`, `IMAGE_STYLES`, `IMAGE_TYPES`, `RSS_REFRESH_OPTIONS`, `FRESHNESS_OPTIONS`, `POSTING_TIMES`, `REMINDER_OPTIONS`)
- Replace old `sidebarItems` array with the Dashboard's navigation items
- Add brand switcher dropdown matching Dashboard layout
- Add active route highlighting using `useLocation`
- The page will go from ~983 lines to approximately 350 lines
