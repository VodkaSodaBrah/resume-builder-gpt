# Widget Router Context Fix

**Date**: 2026-01-22
**Commit**: b99fb7d
**Issue**: Widget shows blank screen with console error

## Problem

When embedding the Resume Builder widget on external sites (e.g., childressdigital.com/apps/resume-builder), the widget displayed a blank screen with the following console error:

```
Uncaught Error: useNavigate() may be used only in the context of a <Router> component.
```

## Root Cause Analysis

The widget uses several components that call `useNavigate()` from react-router-dom:

| File | Line | Component |
|------|------|-----------|
| `src/components/chat/ChatContainer.tsx` | 29 | ChatContainer |
| `src/components/chat/InlinePreviewCard.tsx` | 15 | InlinePreviewCard |
| `src/components/chat/ExportOptionsCard.tsx` | 18 | ExportOptionsCard |
| `src/components/chat/AIChatContainer.tsx` | 45 | AIChatContainer |

These components were designed for the main application which wraps everything in `BrowserRouter`. However, the widget (`src/widget/Widget.tsx`) was missing any Router provider, causing the `useNavigate()` calls to fail.

## Solution

Wrapped the widget content in `MemoryRouter` from react-router-dom. `MemoryRouter` was chosen because:

1. **Isolation**: It manages navigation history in memory without affecting the parent site's URL
2. **No URL side effects**: Embedded widgets should not modify the host page's address bar
3. **Full compatibility**: Provides complete Router context for all react-router hooks

## Changes Made

### File: `src/widget/Widget.tsx`

**Added import**:
```tsx
import { MemoryRouter } from 'react-router-dom';
```

**Modified `WidgetWithClerk` component** to wrap both code paths:

1. When `useParentAuth` is true (embedded with parent auth):
```tsx
return (
  <MemoryRouter>
    <QueryClientProvider client={queryClient}>
      <WidgetContent config={config} />
    </QueryClientProvider>
  </MemoryRouter>
);
```

2. When using standalone Clerk auth:
```tsx
return (
  <MemoryRouter>
    <ClerkProvider publishableKey={pubKey}>
      <QueryClientProvider client={queryClient}>
        <WidgetContent config={config} />
      </QueryClientProvider>
    </ClerkProvider>
  </MemoryRouter>
);
```

## Diff Summary

```diff
+import { MemoryRouter } from 'react-router-dom';

 const WidgetWithClerk = ({ config }) => {
   if (config.useParentAuth) {
     return (
+      <MemoryRouter>
         <QueryClientProvider client={queryClient}>
           <WidgetContent config={config} />
         </QueryClientProvider>
+      </MemoryRouter>
     );
   }

   return (
+    <MemoryRouter>
       <ClerkProvider publishableKey={pubKey}>
         <QueryClientProvider client={queryClient}>
           <WidgetContent config={config} />
         </QueryClientProvider>
       </ClerkProvider>
+    </MemoryRouter>
   );
 };
```

## Deployment

1. Changes committed and pushed to `main` branch
2. Vercel auto-deploys from main
3. Widget served from `https://resume-builder-gpt-rho.vercel.app/widget.js`
4. Childress Digital site already configured correctly (v4, useParentAuth=true)

## Verification Steps

1. Navigate to https://childressdigital.com/apps/resume-builder
2. Open browser console (F12)
3. Verify no `useNavigate()` errors appear
4. If signed in: Widget should display chat interface
5. If signed out: Widget should display Clerk sign-in form
6. Complete a conversation to test full functionality

## Related Configuration

The Childress Digital site embeds the widget with this configuration:

```javascript
config: {
  version: 'v4',
  useParentAuth: true,
  companyName: 'Childress Digital',
  primaryColor: '#22c55e'
}
```

The `useParentAuth: true` flag means the widget expects Clerk context from the parent site, which is why no Clerk sign-in errors appear - the parent page provides that context.
