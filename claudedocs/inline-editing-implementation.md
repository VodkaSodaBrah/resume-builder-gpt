# Inline Editing + AI Rewrite on Preview Page

## Summary

Added click-to-edit on every field of the Preview page plus an AI "improve" button on content fields (responsibilities, job titles, volunteer roles). Previously, the only way to fix a typo or tweak a bullet point was to navigate back to the Builder and re-answer guided questions.

## Changes from Previous State

### New Files Created

| File | Purpose |
|------|---------|
| `src/lib/objectUtils.ts` | Extracted `setNestedValue` utility from conversationStore for shared use |
| `src/components/preview/EditableField.tsx` | Generic click-to-edit wrapper. Renders any HTML tag in read mode; switches to input/textarea on click |
| `src/components/preview/AIRewriteButton.tsx` | Sparkle icon that calls AI rewrite API, shows suggestion popover |
| `src/components/preview/AIRewriteSuggestion.tsx` | Inline popover showing original vs. suggested text with Accept/Reject |
| `src/hooks/usePreviewEditor.ts` | Manages dual state: local resumeData (immediate UI) + conversationStore (persistence) |
| `src/lib/rewriteApi.ts` | Client-side API helper for `/api/resume/rewrite` endpoint |
| `api/resume/rewrite.ts` | Serverless endpoint for single-field AI rewriting (Zod validated, security-checked) |

### Modified Files

| File | Change |
|------|--------|
| `src/stores/conversationStore.ts` | Removed inline `setNestedValue`, now imports from `objectUtils.ts` |
| `src/pages/Preview.tsx` | All text fields wrapped with `EditableField`, AI buttons on eligible fields, uses `usePreviewEditor` hook |
| `api/_lib/openai.ts` | Added `rewriteFieldContent` function with field-type-specific prompts |

### New Test Files

| File | Test Count |
|------|-----------|
| `tests/objectUtils.test.ts` | 11 tests |
| `tests/components/editableField.test.tsx` | 18 tests |
| `tests/components/aiRewriteSuggestion.test.tsx` | 5 tests |
| `tests/components/aiRewriteButton.test.tsx` | 7 tests |
| `tests/hooks/usePreviewEditor.test.ts` | 8 tests |
| `tests/rewriteApi.test.ts` | 6 tests |
| `tests/pages/Preview.inlineEdit.test.tsx` | 11 tests |
| **Total new tests** | **66** |

## Architecture Decisions

### Dual State Pattern (usePreviewEditor)
The hook maintains a local `useState` for immediate UI feedback and synchronizes edits to the conversation store for persistence. This avoids the lag of a round-trip through Zustand for every keystroke while ensuring data survives navigation.

### Unconditional Hook Call
Since `Preview.tsx` has early returns for loading/no-data states, the `usePreviewEditor` hook is called with an `EMPTY_RESUME` fallback to satisfy React's rules of hooks. The actual `displayData` is only used when `resumeData` is non-null.

### Bullet Reconstruction
Work experience responsibilities are stored as newline-delimited strings. When a single bullet is edited, the `onBulletSave` helper splits the full string, replaces the target bullet, and rejoins with newlines.

### AI-Eligible Fields
AI rewrite buttons appear on:
- Work experience bullets (responsibility fieldType)
- Job titles (job_title fieldType)
- Volunteer roles (role fieldType)
- Volunteer responsibilities (responsibility fieldType)

NOT on: names, email, phone, dates, school names, company names, reference info, skills lists.

### Field-Specific Prompts
The API uses different prompts depending on `fieldType`:
- `responsibility` -> existing `RESUME_ENHANCEMENT_PROMPT` (optimized for bullet points)
- `job_title` / `role` -> `JOB_TITLE_REWRITE_PROMPT` (standardize/professionalize)
- `summary` and other -> `FIELD_REWRITE_PROMPT` (general improvement)

## Verification Results

- 653 tests pass (587 original + 66 new)
- TypeScript: `npx tsc --noEmit` passes cleanly
- Production build: `npm run build` succeeds
- Zero regressions in existing functionality
