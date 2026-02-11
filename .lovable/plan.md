
# Admin Panel Overhaul: User & Plan Management

## Overview
Rebuild the admin panel with updated navigation, enhanced user management (edit users, assign plans), and a new Plan Management page where admins create pricing plans with feature limits. Plans are one-time payments only.

## What Changes

### 1. Database: New `plans` table
Store plan definitions that admins create and assign to users.

| Column | Type | Default |
|--------|------|---------|
| id | uuid | gen_random_uuid() |
| name | text | required |
| price | numeric | 0 |
| description | text | nullable |
| features | jsonb | '{}' (feature limits like max_products, max_exports, etc.) |
| is_active | boolean | true |
| sort_order | integer | 0 |
| created_at | timestamptz | now() |
| updated_at | timestamptz | now() |

RLS: Admins can do everything; authenticated users can read active plans.

### 2. Database: Add `plan_id` to `profiles` table
Add a nullable `plan_id` column to profiles so admins can assign a plan to each user.

```sql
ALTER TABLE public.profiles ADD COLUMN plan_id uuid REFERENCES public.plans(id) ON DELETE SET NULL;
```

### 3. Seed default plans
Insert the three pricing tiers from your business model:
- Starter ($49) -- basic feature limits
- Pro ($149) -- expanded limits
- Unlimited ($299) -- no limits

### 4. Updated Admin Sidebar Navigation
Replace the old 4-item sidebar across all admin pages with:
- Dashboard (link to /dashboard)
- Users (/admin/users)
- Plans (/admin/plans) -- NEW
- AI Training (/admin/training)
- AI Settings (/admin/settings)

Use `useLocation()` for active state instead of hardcoded `active: true`.

### 5. Enhanced User Management (`AdminUsers.tsx`)
Current page only shows approve/revoke. Upgrade to:
- **Edit user dialog** -- edit full name, email display, toggle approval
- **Plan assignment dropdown** -- select from available plans directly in the user row
- **Delete user** button (with confirmation) -- removes from profiles
- **Filter/search** -- filter by status (all, pending, approved) and search by name/email
- Show assigned plan name in each user row

### 6. New Plan Management Page (`AdminPlans.tsx`)
Route: `/admin/plans`
Features:
- List all plans with name, price, feature limits, user count
- **Create Plan dialog** -- name, price (one-time), description, feature limits (max products, max outlines, max exports, max images, copilot access, sales page access, KDP access)
- **Edit Plan** -- update any field
- **Deactivate Plan** -- soft delete (set is_active = false)
- Show how many users are on each plan

### 7. Files Summary

**New files:**
- `src/pages/AdminPlans.tsx` -- Plan management page
- `src/hooks/usePlans.tsx` -- Hook for CRUD on plans table

**Modified files:**
- `src/pages/AdminUsers.tsx` -- Add edit dialog, plan assignment, search/filter, delete, updated sidebar
- `src/pages/AdminSettings.tsx` -- Updated sidebar with active state
- `src/pages/AdminTrainingLibrary.tsx` -- Updated sidebar with active state
- `src/App.tsx` -- Add route for `/admin/plans`
- `src/hooks/useAuth.tsx` -- Add plan_id to Profile interface

## Technical Details

### Database Migration

```sql
-- Plans table
CREATE TABLE public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  description text,
  features jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage plans" ON public.plans
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can read active plans" ON public.plans
  FOR SELECT USING (is_active = true AND auth.role() = 'authenticated');

CREATE TRIGGER update_plans_updated_at
  BEFORE UPDATE ON public.plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add plan_id to profiles
ALTER TABLE public.profiles ADD COLUMN plan_id uuid REFERENCES public.plans(id) ON DELETE SET NULL;

-- Seed default plans
INSERT INTO public.plans (name, price, description, features, sort_order) VALUES
('Starter', 49, 'Essential tools to get started', '{"max_products": 3, "max_outlines": 5, "max_exports": 10, "max_images": 20, "copilot": false, "sales_pages": false, "kdp": false, "launch_toolkit": false}'::jsonb, 1),
('Pro', 149, 'Full toolkit for serious creators', '{"max_products": 15, "max_outlines": 30, "max_exports": 50, "max_images": 100, "copilot": true, "sales_pages": true, "kdp": true, "launch_toolkit": false}'::jsonb, 2),
('Unlimited', 299, 'No limits, lifetime access to everything', '{"max_products": -1, "max_outlines": -1, "max_exports": -1, "max_images": -1, "copilot": true, "sales_pages": true, "kdp": true, "launch_toolkit": true}'::jsonb, 3);
```

### Feature Limits Schema (inside `features` jsonb)
- `max_products` -- max product ideas (-1 = unlimited)
- `max_outlines` -- max outlines
- `max_exports` -- max exports per month
- `max_images` -- max image generations
- `copilot` -- boolean, AI Copilot access
- `sales_pages` -- boolean, Sales Page Builder access
- `kdp` -- boolean, KDP Publisher access
- `launch_toolkit` -- boolean, Launch Toolkit access

### Admin Sidebar (shared across all admin pages)
```typescript
const adminSidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Users, label: "Users", href: "/admin/users" },
  { icon: CreditCard, label: "Plans", href: "/admin/plans" },
  { icon: Brain, label: "AI Training", href: "/admin/training" },
  { icon: Settings, label: "Settings", href: "/admin/settings" },
];
```

### User Edit Dialog Fields
- Full Name (text input)
- Approval Status (toggle)
- Assigned Plan (dropdown from plans table)

### `usePlans` Hook
- `plans` -- query all plans ordered by sort_order
- `createPlan` -- mutation to insert
- `updatePlan` -- mutation to update
- `deletePlan` -- mutation to set is_active = false
- `assignPlan(userId, planId)` -- update profiles.plan_id
