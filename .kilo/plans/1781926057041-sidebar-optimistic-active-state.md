# Sidebar Optimistic Active State

## Problem

When clicking a sidebar navigation item, the active highlight doesn't update until the route transition completes, making the UI feel slow. This happens because the active state is based solely on `usePathname()`, which only updates after the route transition commits in Next.js App Router.

## File to Modify

- `src/features/dashboard/components/sidebar-nav.tsx`

## Plan

### 1. Add optimistic state to `SidebarNav`

Add `useState` import and create `pendingHref` state:

```tsx
const [pendingHref, setPendingHref] = useState<string | null>(null);
```

Add `useEffect` to clear pending state when `pathname` catches up:

```tsx
useEffect(() => {
  setPendingHref(null);
}, [pathname]);
```

Compute `activePath`:

```tsx
const activePath = pendingHref ?? pathname;
```

### 2. Pass click handler to `SidebarLink`

Update the `SidebarLink` interface to accept an `onClick` prop:

```tsx
interface SidebarLinkProps {
  item: NavItem;
  active: boolean;
  onClick?: () => void;
}
```

Pass `onClick` through to the `<Link>` element inside `SidebarLink`.

In the `SidebarNav` map, pass an `onClick` that sets `pendingHref` only when clicking a different route:

```tsx
onClick={() => {
  if (activePath !== item.href) {
    setPendingHref(item.href);
  }
}}
```

### 3. Update active check to use `activePath`

Replace `pathname` with `activePath` in the active logic:

```tsx
active={
  item.href === "/dashboard"
    ? activePath === "/dashboard"
    : activePath === item.href || activePath.startsWith(item.href + "/")
}
```

### 4. Sign Out stays unchanged

The Sign Out button (lines 106-119) does not use `SidebarLink` and has no active state. It remains untouched.

### 5. Prefetching already handled

The existing `prefetch={true}` on `<Link>` and `router.prefetch()` on hover/focus are already in place. No changes needed.

## What Does NOT Change

- No layout or color changes
- No `router.push()` — still uses `<Link>`
- No prefetch loop on sidebar load
- Sign Out behavior unchanged
- No new dependencies

## Validation

1. `npm run typecheck` — zero errors
2. `npm run lint` — zero errors
3. `npm run build` — successful
4. Manual: click each sidebar route, confirm highlight moves immediately
5. Manual: page content loads normally with loading skeleton
6. Manual: refresh page, correct item highlighted
7. Manual: Sign Out still works
