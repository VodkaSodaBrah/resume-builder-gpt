# Resume Builder GPT

AI-powered resume builder with a conversational interface. Built with React 19, TypeScript, and Azure.

## Features

- **Conversational UI**: Answer questions one at a time to build your resume
- **AI Enhancement**: OpenAI-powered job description improvements
- **Multi-language Support**: Create resumes in any language
- **ATS-Friendly Templates**: 3 professional templates (Classic, Modern, Professional)
- **Multiple Export Formats**: Download as PDF or DOCX
- **User Accounts**: Save, edit, and manage multiple resumes
- **Embeddable Widget**: White-label widget for third-party websites
- **Analytics Tracking**: Track user engagement and completion rates

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Vite
- **Backend**: Azure Functions (Node.js)
- **Database**: Azure Table Storage
- **AI**: OpenAI API (GPT-4o-mini)
- **Hosting**: Azure Static Web Apps

## Quick Start

### Prerequisites

- Node.js 20+
- npm
- Azure CLI (for deployment)
- Docker (optional, for local development)

### Local Development

```bash
# Install dependencies
npm install
cd api && npm install && cd ..

# Start development servers
npm run dev

# In another terminal, start the API
cd api && func start
```

### Using Docker

```bash
# Development mode with hot reload
docker-compose up dev

# Production mode
docker-compose up app
```

The app will be available at:
- Frontend: http://localhost:3000
- API: http://localhost:7071

## Azure Deployment

### Initial Setup

1. **Login to Azure CLI**:
   ```bash
   az login
   ```

2. **Create Azure Resources**:
   ```bash
   ./scripts/azure-setup.sh prod
   ```
   This creates:
   - Resource Group
   - Storage Account with tables
   - Static Web App

3. **Configure Environment Variables**:
   ```bash
   ./scripts/azure-configure-env.sh prod
   ```
   You'll be prompted for:
   - JWT_SECRET
   - OPENAI_API_KEY
   - SENDGRID_API_KEY (optional)

4. **Add GitHub Secret**:
   Copy the deployment token from the setup output and add it to your GitHub repository:
   - Settings > Secrets > Actions
   - Name: `AZURE_STATIC_WEB_APPS_API_TOKEN`
   - Value: (deployment token)

5. **Push to Deploy**:
   ```bash
   git push origin main
   ```

### Manual Deployment

```bash
./scripts/azure-deploy.sh prod
```

### Teardown

```bash
./scripts/azure-teardown.sh prod
```

## Project Structure

```
resume-builder-gpt/
├── src/
│   ├── components/       # React components
│   │   ├── auth/        # Login, Signup forms
│   │   ├── chat/        # Chat interface
│   │   └── ui/          # Reusable UI components
│   ├── pages/           # Page components
│   ├── stores/          # Zustand state stores
│   ├── lib/             # Utilities and helpers
│   ├── widget/          # Embeddable widget
│   └── types/           # TypeScript interfaces
├── api/                 # Azure Functions backend
│   ├── auth/           # Authentication endpoints
│   ├── resume/         # Resume CRUD endpoints
│   ├── analytics/      # Analytics tracking
│   └── lib/            # Shared utilities
├── scripts/            # Deployment scripts
├── public/             # Static assets
└── dist/               # Build output
```

## Embeddable Widget

The widget can be embedded on any website:

```html
<!-- Auto-initialization -->
<div
  data-resume-builder-widget
  data-company-name="Your Company"
  data-primary-color="#22c55e"
></div>
<script src="https://your-app.azurestaticapps.net/widget/resume-builder-widget.iife.js"></script>
<link rel="stylesheet" href="https://your-app.azurestaticapps.net/widget/resume-builder-widget.css">
```

Or initialize programmatically:

```javascript
const widget = window.ResumeBuilderWidget.init({
  companyName: 'Your Company',
  primaryColor: '#22c55e',
  onComplete: (resumeData) => {
    console.log('Resume completed:', resumeData);
  }
});
```

See `/public/embed-example.html` for full documentation.

## Build Commands

```bash
npm run dev          # Start development server
npm run build        # Build main application
npm run build:widget # Build embeddable widget
npm run build:all    # Build both
npm run preview      # Preview production build
```

## Environment Variables

### Frontend (.env)
```
VITE_API_BASE_URL=/api
```

### Backend (Azure Portal or local.settings.json)
```
AZURE_STORAGE_CONNECTION_STRING=...
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
OPENAI_API_KEY=sk-...
SENDGRID_API_KEY=SG... (optional)
APP_URL=https://your-app.azurestaticapps.net
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/signup | Create new account |
| POST | /api/auth/login | Login |
| POST | /api/auth/verify-email | Verify email |
| POST | /api/resume/save | Save resume |
| POST | /api/resume/enhance | AI enhancement |
| GET | /api/resume/list | List user resumes |
| GET | /api/resume/get | Get single resume |
| POST | /api/analytics/events | Track events |

## License

MIT

## Credits

Powered by [Childress Digital](https://childressdigital.com)
