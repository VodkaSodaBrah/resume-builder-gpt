# Issue #13 - AI-Generated Responsibilities Edge Case

## Bug Description
When user asks AI to generate responsibilities instead of providing their own, the "add another" question doesn't trigger.

---

## Conversation Transcript 1 (FAILING - Before Fix)

This transcript shows the bug where AI skips to volunteering instead of asking "add another job?"

| Turn | Role | Message |
|------|------|---------|
| 1 | AI | What language would you like to use? English \| Espanol \| Francais \| Deutsch \| Portugues 中文 \| 日本語 \| 한국어 \| العربية \| हिन्दी Just type your preferred language! |
| 2 | User | English |
| 3 | AI | Perfect! I'm here to help you create a professional resume. What's your full name? |
| 4 | User | Rachel Green |
| 5 | AI | Great, Rachel! What's your email address? |
| 6 | User | rachel@example.com |
| 7 | AI | Thank you, Rachel! What's your phone number? |
| 8 | User | 5551112222 |
| 9 | AI | Perfect! What city and state do you live in? |
| 10 | User | New York, NY |
| 11 | AI | Thank you for that information, Rachel! Here's what we have so far: - Full Name: Rachel Green - Email: rachel@example.com - Phone: 5551112222 - City and State: New York, NY Now, do you have any work experience you'd like to include? (Yes or No) |
| 12 | User | yes |
| 13 | AI | Great! What company did you work for? |
| 14 | User | Central Perk Coffee |
| 15 | AI | Thank you! What was your job title at Central Perk Coffee? |
| 16 | User | Waitress |
| 17 | AI | Perfect! What dates did you work there? (You can provide specific dates or just the year.) |
| 18 | User | 2020 to 2024 |
| 19 | AI | Thank you! What were your responsibilities as a waitress at Central Perk Coffee? |
| 20 | User | create some responsibilities for a waitress |
| 21 | AI | Sure! Here are some common responsibilities for a waitress: 1. Greet and seat customers in a friendly manner. 2. Take customer orders accurately and efficiently. 3. Serve food and beverages to customers. 4. Ensure customer satisfaction by checking in regularly. 5. Handle cash and process payments. 6. Clean and organize the dining area and tables. 7. Assist with menu recommendations and answer questions about dishes. Would you like to include any of these, or do you have specific responsibilities in mind? |
| 22 | User | use all of them |
| 23 | AI | **BUG**: Great! I've recorded that information. Now, do you have any volunteer experience you'd like to include? (Yes or No) |

**Expected at Turn 23**: "Do you have another job you'd like to add?" (Yes or No)
**Actual at Turn 23**: Skipped to volunteering section

---

## Conversation Transcript 2 (FAILING - Different Variation)

This shows another failure mode where "organization" keyword caused wrong section detection.

| Turn | Role | Message |
|------|------|---------|
| 1 | AI | What language would you like to use? English \| Espanol \| Francais... |
| 2 | User | English |
| 3 | AI | Perfect! I'm here to help you create a professional resume. What's your full name? |
| 4 | User | Rachel Green |
| 5 | AI | Great, Rachel! What's your email address? |
| 6 | User | rachel@example.com |
| 7 | AI | Thank you, Rachel! What's your phone number? |
| 8 | User | 5551112222 |
| 9 | AI | Perfect! What city and state do you live in? |
| 10 | User | New York, NY |
| 11 | AI | Thank you for that information, Rachel! Now, do you have any work experience you'd like to include? (Yes or No) |
| 12 | User | yes |
| 13 | AI | Great! What company did you work for? |
| 14 | User | Central Perk Coffee |
| 15 | AI | Thank you! What was your job title there? |
| 16 | User | Waitress |
| 17 | AI | Perfect! What dates did you work there? (You can provide approximate dates if you're unsure.) |
| 18 | User | 2020 to 2024 |
| 19 | AI | Thank you! Now, what were your responsibilities in that role? |
| 20 | User | create some responsibilities for a waitress |
| 21 | AI | Sure! Here are some common responsibilities for a waitress: 1. Greet customers and take their orders. 2. Serve food and beverages to customers. 3. Provide excellent customer service and address any customer inquiries or complaints. 4. **Maintain cleanliness and organization of the dining area.** 5. Process payments and handle cash transactions. 6. Assist with setting up and clearing tables. Would you like to include any specific responsibilities from this list or add others? |
| 22 | User | use all of them |
| 23 | AI | **BUG**: Great! I've recorded that information. Do you have any other volunteer experience? (Yes or No) |

**Root Cause**: The word "organization" in responsibility #4 triggered `recentHasVolunteer` detection, causing wrong section identification.

---

## Conversation Transcript 3 (PASSING - After Fix)

| Turn | Role | Message |
|------|------|---------|
| 1 | AI | What language would you like to use? English \| Espanol \| Francais \| Deutsch \| Portugues 中文 \| 日本語 \| 한국어 \| العربية \| हिन्दी Just type your preferred language! |
| 2 | User | English |
| 3 | AI | Perfect! I'm here to help you create a professional resume. What's your full name? |
| 4 | User | Rachel Green |
| 5 | AI | Great, Rachel! What's your email address? |
| 6 | User | rachel@example.com |
| 7 | AI | Thank you, Rachel! What's your phone number? |
| 8 | User | 5551112222 |
| 9 | AI | Perfect! What city and state do you live in? |
| 10 | User | New York, NY |
| 11 | AI | Thank you for that information, Rachel! Now, do you have any work experience you'd like to include? (Yes or No) |
| 12 | User | yes |
| 13 | AI | Great! What company did you work for? |
| 14 | User | Central Perk Coffee |
| 15 | AI | Thank you! What was your job title there? |
| 16 | User | Waitress |
| 17 | AI | Perfect! What dates did you work there? |
| 18 | User | 2020 to 2024 |
| 19 | AI | Thank you! What were your responsibilities as a waitress at Central Perk Coffee? |
| 20 | User | create some responsibilities for a waitress |
| 21 | AI | Sure! Here are some common responsibilities for a waitress: 1. Greet customers and take their orders. 2. Serve food and beverages to customers. 3. Provide excellent customer service... Would you like to include any of these on your resume? |
| 22 | User | use all of them |
| 23 | AI | **FIXED**: Great! I've recorded that information. Do you have another job you'd like to add? (Yes or No) |

**Success**: Now correctly asks "Do you have another job?" instead of skipping to volunteering.

---

## Debug Logs (Before Fix)

```
[MULTI-ENTRY] Checking section: actualSection=volunteering, userSaidNoToSection=false
[MULTI-ENTRY] askedResp=true, providedResp=true, askedAddAnother=false
[MULTI-ENTRY] lastAssistantMessage (first 200 chars): Sure! Here are some common responsibilities for a waitress:
[MULTI-ENTRY] userMessage: use all of them
```

**Problem**: `actualSection` was detected as `volunteering` instead of `work` because "organization" in the AI's responsibilities list matched the volunteer context detection.

---

## Debug Logs (After Fix)

```
[MULTI-ENTRY] Checking section: actualSection=work, userSaidNoToSection=false
[MULTI-ENTRY] askedResp=true, providedResp=true, askedAddAnother=false
[MULTI-ENTRY] lastAssistantMessage (first 200 chars): Sure! Here are some common responsibilities for a waitress:
[MULTI-ENTRY] userMessage: use all of them
```

**Fixed**: `actualSection` is now correctly detected as `work`.
