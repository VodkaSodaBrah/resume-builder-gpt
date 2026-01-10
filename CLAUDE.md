# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Resume Builder GPT is an AI-powered resume builder with a conversational interface. Users answer questions one at a time through a chat-like UI, and the app generates professional, ATS-friendly resumes with AI-enhanced job descriptions.

## Development Commands

```bash
# Install dependencies (both frontend and API)
npm install
cd api && npm install && cd ..

# Start frontend dev server (port 3000)
npm run dev

# Start API (Azure Functions, port 7071) - run in separate terminal
cd api && func start

# Build commands
npm run build           # Build main application
npm run build:widget    # Build embeddable widget
npm run build:all       # Build both

# Lint
npm run lint

# Preview production build
npm run preview
```

### Docker Development
```bash
docker-compose up dev    # Development with hot reload
docker-compose up app    # Production mode
```

## Architecture

### Frontend (React 19 + TypeScript + Vite)
- **State Management**: Zustand stores in `src/stores/`
  - `authStore.ts` - JWT auth with sessionStorage, auto-expiration checking
  - `conversationStore.ts` - Chat flow state, resume data collection with persistence
  - `analyticsStore.ts` - Event tracking
- **Routing**: React Router v7 with protected route wrappers in `App.tsx`
- **Styling**: Tailwind CSS v4 via Vite plugin
- **Path Alias**: `@/` maps to `src/`

### Backend (Azure Functions v4 + Node.js)
Located in `api/` with its own `package.json` and `tsconfig.json`.

**Endpoints**:
- `api/auth/` - signup, login, verify-email (rate-limited)
- `api/resume/` - save, list, get, enhance (AI-powered)
- `api/analytics/` - event tracking

**Shared Libraries** (`api/lib/`):
- `auth.ts` - JWT validation, password hashing, query sanitization
- `security.ts` - Rate limiting, CSRF protection, security logging
- `storage.ts` - Azure Table Storage + Blob Storage clients
- `openai.ts` - GPT-4o-mini integration for job description enhancement

### Data Flow
1. User answers questions via chat UI (managed by `conversationStore`)
2. Responses populate `ResumeData` structure (defined in `src/types/index.ts`)
3. Job descriptions can be AI-enhanced via `/api/resume/enhance`
4. Resume generation uses templates in `src/lib/resumeGenerator.ts`
5. Export to PDF (jspdf + html2canvas) or DOCX (docx package)

### Embeddable Widget
Self-contained widget build in `src/widget/` for third-party embedding:
- Entry: `src/widget/widget-entry.tsx`
- Build config: `vite.widget.config.ts`
- Output: `dist/widget/` (IIFE + ES module formats)

## Key Type Definitions

All in `src/types/index.ts`:
- `ResumeData` - Complete resume structure
- `Question` - Chat flow question config (see `src/lib/questions.ts`)
- `ConversationState` - Chat session state

## Security Considerations

See `SECURITY.md` for full details. Key points:
- JWT_SECRET must be 32+ characters (app fails to start otherwise)
- Rate limiting on auth endpoints (5 attempts/minute)
- Tokens stored in sessionStorage (not localStorage)
- All user IDs validated as UUIDs before database queries

## Azure Deployment

Scripts in `scripts/`:
- `azure-setup.sh prod` - Create Azure resources
- `azure-configure-env.sh prod` - Set environment variables
- `azure-deploy.sh prod` - Deploy application
- `azure-teardown.sh prod` - Delete resources

GitHub Actions workflow: `.github/workflows/azure-static-web-apps.yml`
