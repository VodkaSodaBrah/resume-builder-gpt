# Guided Mode Redesign

**Date**: 2026-02-13
**Branch**: main
**Previous Reference**: feat/store-predictions (empirical-testing-framework)

## Overview

Transformed the resume builder's Classic mode into the default "Guided" experience -- a structured, hand-holding flow designed for non-technical users who may have never written a resume. The AI free-form conversation mode remains accessible via `?mode=ai` URL parameter.

## Problem Statement

The resume builder defaulted to an AI-driven free-form conversation mode that was unpredictable and confusing for non-technical users. The structured "Classic" mode existed but was hidden behind a URL parameter. Users who have never made a resume needed a deterministic, step-by-step experience.

## Changes from Previous feat/store-predictions Branch

The feat/store-predictions branch focused on empirical testing framework and store prediction patterns. This redesign builds on that foundation with the following net-new capabilities:

| Feature | feat/store-predictions | This Redesign |
|---------|----------------------|---------------|
| Default mode | AI (free-form) | Guided (structured) |
| Section summaries | None | Summary card after each section with confirm/add/edit |
| Onboarding | None | 3-message welcome sequence for new users |
| AI coaching | None | "Help Me Write This" button on hard questions |
| Section confirmation | None | sectionConfirmed state tracking with visual indicators |
| Progress bar | Basic position-based | Position + confirmation-aware with checkmarks |

## Architecture Decision

Evolved Classic mode in place rather than creating a third mode. The Classic mode already had the right foundation: `questions[]` array, `currentQuestionIndex` cursor, `confirm` input type with Yes/No buttons, `ADD_MORE_SECTION_MAP` for loops, `skipCondition` gates, and `transformFieldPath` for multi-entry sections.

## Implementation Phases

### Phase 1: State Machine Extensions

**Files modified**: `src/types/index.ts`, `src/stores/conversationStore.ts`, `src/stores/aiConversationStore.ts`

Extended `ConversationState` with five new fields:

```typescript
sectionPhase: 'questioning' | 'summary';
onboardingComplete: boolean;
helpMeWriteActive: boolean;
helpMeWriteQuestionId: string | null;
sectionConfirmed: Record<string, boolean>;
```

Added six new store actions: `setSectionPhase`, `setOnboardingComplete`, `startHelpMeWrite`, `endHelpMeWrite`, `confirmSection`, `unconfirmSection`.

Updated `partialize` to persist `sectionPhase`, `onboardingComplete`, and `sectionConfirmed` across page refreshes.

**Tests**: `tests/sectionLoop.test.ts` (24 tests)

### Phase 2: Section Summary Card

**Files created**: `src/components/chat/SectionSummaryCard.tsx`
**Files modified**: `src/components/chat/ChatContainer.tsx`

Renders a formatted card after each section showing all collected data, with three action buttons:

- **"Looks Good, Continue"** (primary/green) -- confirms section, advances to next
- **"Add Another [type]"** (secondary) -- loops back for another entry (only for multi-entry sections: work, education, volunteering, references)
- **"Edit Something"** (ghost/outline) -- returns to first question of the section

Section-specific data renderers handle personal info fields, work experience entries, education entries, volunteering entries, skills sub-lists, and references.

Integration uses `__SECTION_SUMMARY__` marker string in the messages array. `ChatContainer` detects this marker in the message map and renders `SectionSummaryCard` instead of a `ChatBubble`. The `ChatInput` is hidden when `sectionPhase === 'summary'`.

Summarizable categories: personal, work, education, volunteering, skills, references.
Non-summarizable (bypass): language, intro, review, complete.

**Tests**: `tests/sectionSummaryCard.test.tsx` (20 tests)

### Phase 3: Onboarding Messages

**Files created**: `src/lib/onboarding.ts`
**Files modified**: `src/components/chat/ChatContainer.tsx`

Three assistant messages shown before the language selection question for new users:

1. Explains what a resume is and why it matters
2. Describes the step-by-step guided process
3. Outlines what will be covered and estimated time (10-15 minutes)

After the messages, a "Yes, let's go!" confirm button and a "Skip Intro" link appear. Answering sets `onboardingComplete = true` in the persisted store, so returning users skip the onboarding.

Handled in `ChatContainer` initialization. Before showing the first question, if `!onboardingComplete`, the three onboarding messages are pushed with typing delays (800ms between each), ending with the confirm buttons.

**Tests**: `tests/onboarding.test.ts` (12 tests)

### Phase 4: "Help Me Write This" AI Coaching

**Files created**: `src/components/chat/HelpMeWriteFlow.tsx`, `src/lib/helpMeWrite.ts`, `api/help-write.ts`
**Files modified**: `src/components/chat/ChatInput.tsx`, `src/lib/questions.ts`, `api/_lib/openai.ts`, `src/components/chat/ChatContainer.tsx`

Questions eligible for coaching (flagged with `helpMeWriteEligible: true`):
- `work_responsibilities_1`
- `volunteering_responsibilities`
- `skills_technical`
- `skills_soft`

When a user clicks "Help Me Write This" (purple button with sparkle icon), a coaching sub-conversation appears with 2-3 simple questions tailored to the context:

- **Work responsibilities**: "What did you do on a typical day?", "Did you work with customers or a team?", "Did anything save time/money or improve things?"
- **Volunteering**: "What did you usually do?", "How many people did you help?"
- **Technical skills**: "What computer programs or tools do you use?", "What machines or equipment can you operate?"
- **Soft skills**: "What are you really good at?", "What do people compliment you on at work?"

After answering, the app calls the `/api/help-write` endpoint which uses GPT-4.1-mini with context-specific coaching prompts to generate professional content. The user sees a preview and can "Use This" (submits as answer), "Let Me Edit" (populates textarea), or "Try Again" (re-generates).

**Tests**: `tests/helpMeWrite.test.ts` (22 tests)

### Phase 5: Default Mode Flip + Progress Bar Polish

**Files modified**: `src/pages/Builder.tsx`, `src/components/ui/SectionProgressBar.tsx`, `src/components/chat/ChatContainer.tsx`

Default mode flip in `Builder.tsx`:
```typescript
// Before (AI was default):
const [useAIMode, setUseAIMode] = useState(modeParam !== 'classic');
// After (Guided is default):
const [useAIMode, setUseAIMode] = useState(modeParam === 'ai');
```

Progress bar now accepts `sectionConfirmed` prop and uses it alongside position-based completion. A section shows as completed (green checkmark) if either its index is before the current index OR it has been explicitly confirmed via the summary card flow.

**Tests**: `tests/defaultMode.test.ts` (5 tests)

## File Change Summary

### Files Created (8)
| File | Purpose |
|------|---------|
| `src/components/chat/SectionSummaryCard.tsx` | Section summary card with confirm/add/edit buttons |
| `src/components/chat/HelpMeWriteFlow.tsx` | AI coaching sub-conversation component |
| `src/lib/onboarding.ts` | Onboarding messages and skip logic |
| `src/lib/helpMeWrite.ts` | Coaching questions, context mapping, API client |
| `api/help-write.ts` | Vercel serverless function for coaching-to-content |
| `tests/sectionLoop.test.ts` | 24 tests for state machine extensions |
| `tests/sectionSummaryCard.test.tsx` | 20 tests for summary card component |
| `tests/onboarding.test.ts` | 12 tests for onboarding flow |
| `tests/helpMeWrite.test.ts` | 22 tests for help-me-write feature |
| `tests/defaultMode.test.ts` | 5 tests for default mode selection |

### Files Modified (8)
| File | Changes |
|------|---------|
| `src/types/index.ts` | Added sectionPhase, onboardingComplete, helpMeWriteActive, sectionConfirmed to ConversationState; helpMeWriteEligible to Question; HelpMeWrite types |
| `src/stores/conversationStore.ts` | Added 5 state fields, 6 action methods, updated persist partialize |
| `src/stores/aiConversationStore.ts` | Added guided mode field defaults to satisfy ConversationState interface |
| `src/components/chat/ChatContainer.tsx` | Onboarding init, section summary intercept, summary card rendering, help-me-write integration |
| `src/components/chat/ChatInput.tsx` | "Help Me Write This" button on eligible textarea questions |
| `src/lib/questions.ts` | Set helpMeWriteEligible on 4 questions |
| `api/_lib/openai.ts` | Added generateFromCoaching function with coaching prompts |
| `src/pages/Builder.tsx` | Flipped default mode from AI to Guided |
| `src/components/ui/SectionProgressBar.tsx` | Added sectionConfirmed-aware completion indicator |

### Files Unchanged
All AI mode files (`AIChatContainer`, `aiConversationStore` logic), `answerParser`, formatters, `ChatBubble`, `resumeGenerator`, existing API endpoints, export components.

## Test Results

```
Test Files  9 passed (9)
     Tests  534 passed (534)
```

All 83 new tests pass (24 + 20 + 12 + 22 + 5) with zero regressions on the existing 451 tests. TypeScript compilation is clean. Production build succeeds.

## User Flow (Before vs After)

### Before
1. User lands on `/builder` -> AI free-form chat (unpredictable)
2. No explanation of what a resume is or what to expect
3. No section summaries or confirmation points
4. No help writing professional content
5. Classic mode hidden behind `?mode=classic`

### After
1. User lands on `/builder` -> Guided structured flow (default)
2. Welcome onboarding explains what a resume is and the process (skippable, remembered)
3. After each section, a summary card shows collected data with confirm/add/edit buttons
4. "Help Me Write This" button on hard questions provides AI coaching with simple prompts
5. AI mode still accessible via `?mode=ai`
6. Progress bar shows confirmed sections with green checkmarks
