# Widget Container Height Fix - 2026-01-22

## Problem

The embedded resume builder widget on childressdigital.com/apps/resume-builder loaded correctly but did not expand to fill its container. The container showed a large dark area (~calc(100vh - 180px)), but the widget remained at its default fixed size (~380x580px).

## Root Cause Analysis

The CSS rule `.resume-builder-widget-embedded .widget-container { height: 100% }` existed but did not work because:

1. **WidgetContent component** (Widget.tsx) rendered `.widget-container` with classes `widget-compact` or `widget-expanded`, but **no `h-full` class** for height inheritance
2. The CSS selector relied on the parent chain having explicit heights, but the Tailwind class chain was incomplete
3. The loading state used a fixed `h-96` class instead of `h-full`, creating inconsistency

## Solution

Added `h-full` class to the widget-container div in WidgetContent to ensure it fills its parent height in embedded mode.

## Files Modified

### `/src/widget/Widget.tsx`

**Change 1: Loading State (line 85)**
```tsx
// Before:
<div className="widget-container bg-[#0a0a0a] border border-[#27272a] rounded-xl shadow-2xl overflow-hidden flex items-center justify-center h-96">

// After:
<div className="widget-container h-full bg-[#0a0a0a] border border-[#27272a] rounded-xl shadow-2xl overflow-hidden flex items-center justify-center">
```

**Change 2: Main Widget Container (line 93)**
```tsx
// Before:
className={`widget-container bg-[#0a0a0a] border border-[#27272a] rounded-xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${
  isExpanded ? 'widget-expanded' : 'widget-compact'
}`}

// After:
className={`widget-container h-full bg-[#0a0a0a] border border-[#27272a] rounded-xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${
  isExpanded ? 'widget-expanded' : 'widget-compact'
}`}
```

## Height Chain Explanation

For the widget to fill its container, the height must flow through the entire parent chain:

```
.resume-builder-widget-embedded (100% via inline style)
  └── WidgetWithClerk
       └── WidgetContent
            └── .widget-container (now has h-full class)
```

The `h-full` Tailwind class translates to `height: 100%`, allowing the widget container to inherit the full height from its parent elements.

## Deployment

1. Committed to resume_builderGPT repo: `cf6d569`
2. Pushed to origin/main - Vercel auto-deploys
3. Bumped version in childress-digital from v6 to v7 to bust CSS/JS cache

## Verification Steps

1. Open https://childressdigital.com/apps/resume-builder
2. Hard refresh (Cmd+Shift+R) to bypass cache
3. Widget should fill the entire container area
4. Chat interface should have full height for the workflow
5. Test on mobile viewport to ensure responsive behavior still works

## Related Changes

This fix builds on previous work:
- `widget-router-context-fix-2026-01-22.md`: Fixed MemoryRouter context for embedded widget
- Version history: v5 (initial fix) -> v6 (container height CSS) -> v7 (h-full class fix)

## Commit Details

```
fix: widget container now fills parent height in embedded mode

Add h-full class to widget-container div to ensure proper height
inheritance when embedded. Removes fixed h-96 from loading state.
```

---

# Auto-Scroll Fix - 2026-01-22 (Follow-up)

## Problem

After the height fix, clicking inside the widget caused the parent page to auto-scroll to the bottom. Every interaction scrolled the entire page, not just the chat messages area.

## Root Cause

Two scroll-triggering behaviors:

1. **ChatContainer.tsx line 109**: `scrollIntoView({ behavior: 'smooth' })` - scrolls ALL ancestors by default
2. **ChatInput.tsx lines 32-34**: `focus()` calls on input elements can scroll the page to ensure the focused element is visible

## Solution

### `/src/components/chat/ChatContainer.tsx`
```tsx
// Before:
messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

// After:
messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
```

The `block: 'nearest'` option tells the browser to scroll just enough to bring the element into view, without scrolling parent containers unnecessarily.

### `/src/components/chat/ChatInput.tsx`
```tsx
// Before:
textareaRef.current?.focus();
inputRef.current?.focus();

// After:
textareaRef.current?.focus({ preventScroll: true });
inputRef.current?.focus({ preventScroll: true });
```

The `preventScroll: true` option prevents the browser from scrolling to bring the focused element into view.

## Deployment

1. Committed to resume_builderGPT repo: `9969888`
2. Pushed to origin/main - Vercel auto-deploys
3. Bumped version in childress-digital from v7 to v8

## Version History

- v5: Initial embedded widget support
- v6: Container height CSS rules
- v7: h-full class for height inheritance
- v8: Prevent parent page scroll on focus/message updates
