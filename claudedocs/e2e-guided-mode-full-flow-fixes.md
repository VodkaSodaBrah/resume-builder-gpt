# E2E Guided Mode Full Flow: Test & Fixes

**Date**: 2026-02-13
**Related PR**: Follows guided mode redesign (c33b628)

## Overview

Created a comprehensive Playwright E2E test that walks through the entire guided mode flow with 2 entries per multi-entry section. The iterative test-and-fix process uncovered 3 bugs in the application code.

## Files Created

- `e2e/guided-mode-full-flow.spec.ts` -- Full flow E2E test (100 interaction steps)
- `tests/answerParserSkipLogic.test.ts` -- Unit tests for the multi-entry skip logic fix (8 tests)

## Files Fixed

### 1. `src/components/chat/ChatContainer.tsx` -- Multi-entry field path skip logic

**Bug**: When checking whether to skip a question for entry N (N > 0), the `shouldSkipQuestion` function received the raw field path (e.g., `workExperience[0].jobTitle`). Since entry 0 already had data, the function returned `true`, incorrectly skipping all questions for entry 1+.

**Symptom**: Adding a second work experience entry would skip title, location, and start date questions, jumping directly from company name to "Do you still work there?".

**Fix**: Transform the field path to use the correct entry index (`workExperience[1].jobTitle`) before checking `shouldSkipQuestion`. This uses the existing `transformFieldPath` function with the current section counts.

**Lines changed**: ~486-510 (skip loop in `handleSubmit`)

### 2. `src/components/chat/ChatContainer.tsx` -- Skills field comma splitting

**Bug**: The comma-splitting logic for skills used `currentQuestion.field.includes('Skills')` (capital S) and required `inputType === 'textarea'`. This missed:
- `skills.certifications` (lowercase 's', inputType `text`) -- stored as string instead of array
- `skills.languages` (lowercase 's', inputType `textarea`) -- stored as string instead of `{language, proficiency}[]`

**Symptom**: When the `SectionSummaryCard` rendered the skills summary, calling `.join(', ')` on a string threw `TypeError: s.items.join is not a function`, crashing the React app (blank page).

**Fix**:
- Changed condition from `field.includes('Skills')` to `field.startsWith('skills.')` for all skills fields
- Added separate parsing for `skills.languages` that extracts `"English (native)"` into `{language: 'English', proficiency: 'native'}`
- Excluded `skills.languages` from the generic comma-split (it needs object parsing)

**Lines changed**: ~216-226 (processedValue logic in `handleSubmit`)

### 3. `src/components/chat/SectionSummaryCard.tsx` -- Defensive skills rendering

**Bug**: The `renderSkills` function assumed all skills data was already in array format. It called `.join(', ')` directly on values that could be strings, and used `skills.languages?.map(l => ...)` which crashes on strings (strings don't have `.map`).

**Fix**:
- Added `normalizeToArray()` helper that handles both arrays and comma-separated strings
- Languages rendering explicitly checks `Array.isArray()` before calling `.map()`
- Falls back to comma-splitting raw strings for display

**Lines changed**: ~121-150 (renderSkills function)

## Test Structure

The E2E test is a single long test (300s timeout) that covers:
1. Onboarding (3 welcome messages + confirm)
2. Language selection (English)
3. Intro welcome (confirm)
4. Personal info (5 fields + summary card)
5. Work experience x2 (company, title, location, start, current, end, responsibilities, add more)
6. Education x2 (school, degree, field, current, start, end, add more)
7. Volunteering x2 (has, org, role, dates, responsibilities, add more)
8. Skills (4 sub-categories: technical, certifications, languages, soft)
9. References x2 (has, note, name, title, company, contact, relationship, add more)
10. Review (template selection + confirm)
11. Complete (no changes + export verification)

## Test Helpers

| Helper | Purpose |
|--------|---------|
| `waitForNextInteraction` | Waits for typing indicator to disappear + 300ms settle |
| `fillTextInput` | Fill text/email/tel input and submit |
| `fillTextarea` | Fill textarea and submit |
| `clickConfirm` | Click Yes or No button |
| `clickSelectOption` | Click select option by regex pattern |
| `waitForSummaryCard` | Wait for "Looks Good, Continue" button (last) |
| `confirmSummary` | Click "Looks Good, Continue" (last) |

## Verification

```bash
# Unit tests (542 passing, 8 new)
npm test

# E2E test (~1.5 minutes)
npx playwright test e2e/guided-mode-full-flow.spec.ts --project=chromium
```
