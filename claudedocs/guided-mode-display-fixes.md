# Guided Mode Data Display & Formatting Fixes

**Date:** 2026-02-13
**Previous PR:** Guided Mode Redesign (commits `c33b628` through `65da997`)

## Summary

Six bugs surfaced during E2E testing after the guided mode redesign. All were related to data handling and display in the Live Preview panel, full Preview page, and Help Me Write flow.

---

## Fix 1: Location Missing from LivePreviewPanel

**File:** `src/components/chat/LivePreviewPanel.tsx`

**Problem:** The `workExperience` type cast omitted `location`. The render block never displayed it, even though the `WorkExperience` type in `src/types/index.ts` already had `location: string`.

**Change:**
- Added `location?: string` to the type cast (line 38)
- Added conditional `<p>` element rendering location below company name

---

## Fix 2: Double Bullet Rendering in Preview.tsx

**File:** `src/pages/Preview.tsx`

**Problem:** The `<ul>` had no `list-disc` class, so `<li>` elements showed browser default disc bullets. Then the code prepended `- ` to each line, creating `disc + dash + text` double markers.

**Change:**
- Added `list-disc` class to `<ul>` for explicit CSS bullets
- Removed the hardcoded `- ` prefix from `<li>` content
- Kept the `point.replace(/^[-\u2022*]\s*/, '').trim()` stripping for pasted bullet characters

---

## Fix 3: Strip Bullet Characters at Storage Time

**File:** `src/lib/formatters.ts`

**Problem:** No formatter existed for `responsibilities` fields. When users pasted `\u2022 Bullet text` from Help Me Write suggestions, the `\u2022` characters persisted in stored data, causing rendering issues across all views.

**Change:**
- Added `cleanBulletText()` function that strips leading `\u2022`, `-`, `*` from each line
- Registered in `getFormatterForField()` for paths containing `responsibilities`
- This ensures all downstream renderers receive clean text

---

## Fix 4: Date Capitalization and Year-Only Input

**File:** `src/lib/formatters.ts`

**Problem:** Dates like "may 2023" were stored lowercase. Year-only "2022" was accepted but displayed inconsistently.

**Change:**
- Added `formatDate()` function that capitalizes the first letter: "may 2023" -> "May 2023"
- Year-only input passes through unchanged ("2022" stays "2022")
- Registered in `getFormatterForField()` for paths containing `startdate` or `enddate`

---

## Fix 5: LivePreviewPanel Responsibilities Rendering

**File:** `src/components/chat/LivePreviewPanel.tsx`

**Problem:** Responsibilities showed as a raw text blob in a `<p>` element with `line-clamp-2`.

**Change:**
- Replaced `<p>` with `<ul className="list-disc">` containing `<li>` elements
- Split on newlines, strip bullet prefixes, limit to 3 items for the compact preview
- Consistent with full Preview page rendering

---

## Fix 6: Selectable UI for Help Me Write Suggestions

**File:** `src/components/chat/HelpMeWriteFlow.tsx`

**Problem:** Users had to copy-paste all bullets or click "Use This" for the entire block. No way to select individual suggestions.

**Change:**
- Added `selectedBullets` state (boolean array, all `true` by default)
- Parsed `generatedContent` into individual bullet items
- Rendered each bullet as a toggleable checkbox row
- Replaced "Use This" with "Use Selected (N)" showing count
- Deselected bullets show strikethrough styling
- Empty selection disables the submit button

---

## Files Modified

| File | Changes |
|------|---------|
| `src/lib/formatters.ts` | Added `cleanBulletText()`, `formatDate()`, registered both in `getFormatterForField()` |
| `src/components/chat/LivePreviewPanel.tsx` | Added `location` to type + rendering; responsibilities as `<ul>/<li>` list |
| `src/pages/Preview.tsx` | Added `list-disc` to `<ul>`, removed `- ` prefix from `<li>` |
| `src/components/chat/HelpMeWriteFlow.tsx` | Selectable bullet checkboxes with toggle, count, strikethrough |

## Tests Added

| File | Tests | Description |
|------|-------|-------------|
| `tests/formatters.test.ts` | 22 new | `cleanBulletText`, `formatDate`, `formatFieldValue` routing |
| `tests/livePreviewPanel.test.tsx` | 6 new | Location rendering, responsibilities list, bullet stripping, 3-item limit |
| `tests/helpMeWriteFlow.test.tsx` | 8 new | Checkbox rendering, toggle, selected count, strikethrough, "Use Selected" callback |

**Total tests:** 587 (up from 551)
**Build status:** Clean (no TypeScript errors)
