# Widget CSS Isolation + Stale State Fix

**Date**: 2026-01-26
**Branch**: `feat/production-fixes-jan2026`
**Related**: Previous production fixes in this branch (commit `46bb27b`)

---

## Problems Identified

### Problem 1: Widget CSS Leaking into Parent Site

The widget's CSS entry point (`widget-entry.tsx`) imported `../index.css`, which contained:

- `@import "tailwindcss"` -- full Tailwind preflight that resets `body`, `*`, `h1-h6`, `p`, margins, padding globally
- `body { background-color: #0a0a0a; ... }` -- overrides parent page body styles
- `* { box-sizing: border-box; }` -- universal reset affecting all elements
- `:root { --bg-primary: #0a0a0a; ... }` -- overrides CSS custom properties site-wide
- `::-webkit-scrollbar { ... }` -- changes all scrollbars globally

When childressdigital.com loaded `resume-builder-widget.css` via `<link>` in `<head>`, all these global styles leaked into the parent site, breaking its layout and appearance.

### Problem 2: Widget Shows Stale State Across Hard Refreshes

Two Zustand stores persisted to `localStorage` without version fields:
- `conversationStore.ts` -- key `resume-builder-conversation`
- `aiConversationStore.ts` -- key `resume-builder-ai-conversation`

Hard refresh clears HTTP cache but NOT localStorage. Without a `version` field, there was no mechanism to invalidate stale state when the widget was updated. Users would see "question 4 of 48" after a hard refresh instead of starting fresh.

Additionally, `vercel.json` set `Cache-Control: public, max-age=3600, stale-while-revalidate=86400`, meaning Vercel CDN could serve stale JS/CSS for up to 24 hours after deployment.

---

## Changes Made

### 1. `src/widget/widget-entry.tsx` -- Swapped CSS Import

```diff
- import '../index.css';
+ import './widget-index.css';
```

This is the key change. It stops the widget build from bundling the global `index.css` with its Tailwind preflight and body/root styles.

### 2. NEW: `src/widget/widget-index.css` -- Scoped Tailwind Entry

Created a widget-specific CSS entry that imports only Tailwind's theme and utility layers, explicitly **skipping** the preflight layer (which is what resets `body`, `*`, `h1-h6`, etc.):

```css
@import "tailwindcss/theme" layer(theme);
@import "tailwindcss/utilities" layer(utilities);
@import "./widget.css";
@import "./widget-components.css";
```

### 3. NEW: `src/widget/widget-components.css` -- Scoped Component Styles

Moved all component classes from `index.css` (terminal, chat bubble, progress bar, input, button, card, animation, typing indicator, widget-mode styles) and scoped them under `.resume-builder-widget-root`. CSS custom properties (previously on `:root`) are now properties of `.resume-builder-widget-root`.

**Explicitly excluded from widget build:**
- `@import "tailwindcss"` (full import with preflight)
- `* { box-sizing: border-box; }` (already in `widget.css` scoped to `.resume-builder-widget-root *`)
- `body { ... }` (must not touch host body)
- Global `::-webkit-scrollbar` rules (widget.css already has scoped `.widget-container ::-webkit-scrollbar`)

### 4. `src/stores/conversationStore.ts` -- Persist Version + Migration

Added `version: 1` and `migrate: () => ({})` to the persist config. Bumping from implicit version 0 to 1 triggers the migrate function, which returns an empty object to clear all stale state. Users get a fresh start.

### 5. `src/stores/aiConversationStore.ts` -- Persist Version + Migration

Same pattern as conversationStore -- `version: 1` with a clearing migration.

### 6. `vercel.json` -- Reduced Stale Cache Window

```diff
- "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400"
+ "Cache-Control": "public, max-age=300, s-maxage=600, stale-while-revalidate=3600"
```

- Browser cache: 5 min (was 1 hour)
- CDN cache: 10 min (new, explicit)
- Stale window: 1 hour (was 24 hours)

New assets propagate within minutes after redeployment instead of up to 24 hours.

---

## Files Changed

| File | Type | Change |
|------|------|--------|
| `src/widget/widget-entry.tsx` | Modified | CSS import path changed |
| `src/widget/widget-index.css` | **New** | Widget-specific Tailwind entry (no preflight) |
| `src/widget/widget-components.css` | **New** | Component styles scoped under `.resume-builder-widget-root` |
| `src/stores/conversationStore.ts` | Modified | Added persist version + migration |
| `src/stores/aiConversationStore.ts` | Modified | Added persist version + migration |
| `vercel.json` | Modified | Reduced cache TTLs |

---

## Build Verification

- `npm run build:widget` -- succeeds, produces `dist/widget/resume-builder-widget.css` (45.20 kB)
- Output CSS verified:
  - 0 `body {}` rules (previously leaked body background/font styles)
  - 0 `:root { --bg-primary }` rules (custom vars now on `.resume-builder-widget-root`)
  - All scrollbar rules scoped to `.widget-container`
  - `.resume-builder-widget-root` contains custom CSS variables
- `npm test` -- all 451 tests pass (4 test files)

---

## Verification Checklist

1. **CSS isolation**: `<body>` on childressdigital.com should NOT have `background-color: #0a0a0a` or `font-family: 'Inter'` from widget CSS
2. **Fresh state**: Widget starts at question 1, not question 4
3. **Widget styling**: Chat UI, inputs, buttons all styled correctly inside widget container
4. **Mobile nav**: Hamburger menu overlay still works (previous fix preserved)
5. **Scrollbars**: Host page scrollbars use parent site styles, not widget dark theme
6. **All tests pass**: 451/451 tests green

---

## Improvements Over Previous State

| Before | After |
|--------|-------|
| Widget CSS reset all host page elements via Tailwind preflight | Only Tailwind theme + utilities loaded, no preflight |
| `body` and `:root` styles leaked globally | Styles scoped to `.resume-builder-widget-root` |
| Global scrollbar styling overrode host page | Scrollbar styling scoped to `.widget-container` |
| localStorage state persisted indefinitely with no versioning | Persist version 1 clears stale state on upgrade |
| CDN could serve stale assets for 24 hours | Stale window reduced to 1 hour, browser cache to 5 min |
