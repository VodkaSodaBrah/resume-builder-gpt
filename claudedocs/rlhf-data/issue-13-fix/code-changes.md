# Issue #13 - Code Changes

## Files Modified

1. `api/chat/index.ts` - Section detection and multi-entry enforcement
2. `api/lib/conversationAI.ts` - Detection functions
3. `e2e/conversation-flow.spec.ts` - E2E test patterns

---

## Change 1: Fixed `recentHasVolunteer` Detection

**File**: `api/chat/index.ts` (lines 151-161)

**Before**:
```typescript
// Also check recent context for section keywords (helps with generic follow-up questions)
const recentHasVolunteer = recentContext.includes('volunteer') || recentContext.includes('organization');
const recentHasWork = recentContext.includes('company') || recentContext.includes('job title');
const recentHasEducation = recentContext.includes('school') || recentContext.includes('degree') || recentContext.includes('field of study');
```

**After**:
```typescript
// Also check recent context for section keywords (helps with generic follow-up questions)
// NOTE: "organization" alone is too generic (e.g., "organization of the dining area" in job responsibilities)
// Use more specific patterns like "volunteer organization" or just "volunteer"
const recentHasVolunteer = recentContext.includes('volunteer') ||
                           recentContext.includes('volunteer organization') ||
                           recentContext.includes('volunteering');
const recentHasWork = recentContext.includes('company') || recentContext.includes('job title') ||
                      recentContext.includes('worked') || recentContext.includes('work experience') ||
                      recentContext.includes('position') || recentContext.includes('duties') ||
                      recentContext.includes('job') || recentContext.includes('employer');
const recentHasEducation = recentContext.includes('school') || recentContext.includes('degree') || recentContext.includes('field of study');
```

**Reason**: The word "organization" in "Maintain cleanliness and organization of the dining area" was triggering false volunteer context detection.

---

## Change 2: Added AI-Generated Responsibilities Detection

**File**: `api/chat/index.ts` (lines 189-195)

**Added**:
```typescript
// AI-generated responsibilities detection: when AI offers generated content
// and the message contains responsibilities without volunteer context
(!recentHasVolunteer && lowerLastMessage.includes('responsibilities') &&
 (lowerLastMessage.includes('would you like to use') ||
  lowerLastMessage.includes('would you like to include') ||
  lowerLastMessage.includes('from this list') ||
  lowerLastMessage.includes('any of these'))) ||
```

**Reason**: When AI generates responsibilities and asks "Would you like to include any of these?", we need to detect this as still being in the work section.

---

## Change 3: Expanded `detectAskedForResponsibilities` Patterns

**File**: `api/lib/conversationAI.ts` (lines 1320-1336)

**Before**:
```typescript
export function detectAskedForResponsibilities(aiMessage: string): boolean {
  const lower = aiMessage.toLowerCase();
  return (
    lower.includes('responsibilities') ||
    lower.includes('duties') ||
    lower.includes('what did you do') ||
    lower.includes('main responsibilities') ||
    lower.includes('key responsibilities')
  );
}
```

**After**:
```typescript
export function detectAskedForResponsibilities(aiMessage: string): boolean {
  const lower = aiMessage.toLowerCase();
  return (
    lower.includes('responsibilities') ||
    lower.includes('duties') ||
    lower.includes('what did you do') ||
    lower.includes('main responsibilities') ||
    lower.includes('key responsibilities') ||
    // AI-generated content patterns (when AI offers suggestions for user to accept)
    lower.includes('would you like to use these') ||
    lower.includes('use these or modify') ||
    lower.includes('modify them') ||
    lower.includes('would you like these') ||
    // Additional AI response variations for generated content
    lower.includes('from this list') ||
    lower.includes('include any specific') ||
    lower.includes('want to add more')
  );
}
```

---

## Change 4: Expanded `detectProvidedResponsibilities` Patterns

**File**: `api/lib/conversationAI.ts` (lines 1341-1359)

**Before**:
```typescript
export function detectProvidedResponsibilities(userMessage: string): boolean {
  const trimmed = userMessage.trim();
  return trimmed.length > 15 && !/^(yes|no|yeah|nope|skip|none|n\/a)\.?$/i.test(trimmed);
}
```

**After**:
```typescript
export function detectProvidedResponsibilities(userMessage: string): boolean {
  const trimmed = userMessage.trim();
  const lower = trimmed.toLowerCase();

  // Selection/affirmation patterns for AI-generated content
  const selectionPatterns = [
    /use\s+(\d+|all|some|those|these|them)/i,
    /^(perfect|great|good|fine|those work|those are good)/i,
    /i('ll| will)?\s*(take|pick|use|go with)/i,
  ];

  const isSelection = selectionPatterns.some(p => p.test(lower));

  return (
    isSelection ||
    (trimmed.length > 15 && !/^(yes|no|yeah|nope|skip|none|n\/a)\.?$/i.test(trimmed))
  );
}
```

**Reason**: Need to detect when user accepts AI-generated content with phrases like "use all of them", "those are good", etc.

---

## Change 5: Fixed E2E Test Detection Patterns

**File**: `e2e/conversation-flow.spec.ts` (lines 296-303)

**Before**:
```typescript
// Check if we're asked about another job (success case)
if (messageText.includes('another job') || messageText.includes('other job') ||
    (messageText.includes('another') && messageText.includes('work'))) {
  sawAddAnotherJob = true;
  break;
}
```

**After**:
```typescript
// Check if we're asked about another job (success case)
// AI may phrase this as "another job", "other job", "other work experience", etc.
if (messageText.includes('another job') || messageText.includes('other job') ||
    messageText.includes('other work') || messageText.includes('another work') ||
    messageText.includes('add another') || messageText.includes('add any other')) {
  sawAddAnotherJob = true;
  break;
}
```

**Reason**: AI may phrase the question as "Would you like to add any other work experience?" which wasn't being detected.

---

## Test Results

**Before Fix**: Test failing - AI skipped to volunteering section
**After Fix**: All 15 E2E tests passing

```
  15 passed (6.0m)
```
