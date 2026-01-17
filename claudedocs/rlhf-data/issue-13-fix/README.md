# RLHF Data: Issue #13 Fix

## Overview

This directory contains data from debugging and fixing Issue #13 in the Resume Builder GPT application.

**Issue**: When user asks AI to generate responsibilities instead of providing their own, the "add another" question doesn't trigger.

**Date Fixed**: 2026-01-13

## Files

| File | Description |
|------|-------------|
| `conversation-transcripts.md` | Full conversation transcripts showing before/after behavior |
| `code-changes.md` | Detailed code changes with before/after comparisons |
| `debug-logs.txt` | Raw debug logs from Docker container |
| `README.md` | This file |

## Key Learnings

1. **Generic keyword matching is dangerous**: The word "organization" in job responsibilities ("maintain cleanliness and organization of the dining area") was falsely triggering volunteer section detection.

2. **AI response variability matters**: AI may phrase the same question in multiple ways:
   - "Do you have another job?"
   - "Would you like to add any other work experience?"
   - "Do you have other work to add?"

   Tests must account for all variations.

3. **Section detection complexity**: When AI generates content (like responsibilities), the conversation context changes and may not include the expected section keywords anymore.

4. **Multi-step debugging approach**:
   - Added console.log debug statements
   - Traced through section detection logic
   - Identified false positive in volunteer detection
   - Fixed the root cause, not just the symptom

## Test Results

- Before fix: 14/15 tests passing (Issue #13 test failing)
- After fix: 15/15 tests passing
