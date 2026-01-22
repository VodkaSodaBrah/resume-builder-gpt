import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  ClerkProvider,
  SignIn,
  SignUp,
  SignedIn,
  SignedOut,
  RedirectToSignIn,
  useUser,
  useClerk,
} from '@clerk/clerk-react';
import {
  DevAuthProvider,
  DevSignIn,
  DevSignUp,
  useDevAuth,
  isDevMode,
} from '@/contexts/DevAuthContext';

// Pages
import { Dashboard } from '@/pages/Dashboard';
import { Builder } from '@/pages/Builder';
import { Preview } from '@/pages/Preview';

const queryClient = new QueryClient();

// Get Clerk publishable key from environment
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Check if we're in dev mode (localhost)
const DEV_MODE = isDevMode();

// Check if this is a widget embed (not direct URL access)
const isWidgetEmbed = (): boolean => {
  // Check if loaded in an iframe
  if (window.self !== window.top) {
    return true;
  }
  // Check for widget-specific query parameter
  if (new URLSearchParams(window.location.search).has('widget')) {
    return true;
  }
  return false;
};

// Target URL for redirects
const REDIRECT_URL = 'https://childressdigital.com';

// Allowed hostnames for direct access
const ALLOWED_HOSTS = [
  'localhost',
  '127.0.0.1',
  'childressdigital.com',
  'www.childressdigital.com',
];

// Protected Route wrapper for development mode
const DevProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isSignedIn, isLoaded } = useDevAuth();

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />;
  }

  return <>{children}</>;
};

// Protected Route wrapper using Clerk (production)
const ClerkProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
};

// Use appropriate protected route based on mode
const ProtectedRoute = DEV_MODE ? DevProtectedRoute : ClerkProtectedRoute;

// Auth Layout for sign-in/sign-up pages
const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-green-500 font-mono text-2xl">&lt;</span>
            <span className="text-white font-bold text-2xl">Resume Builder</span>
            <span className="text-green-500 font-mono text-2xl">/&gt;</span>
          </div>
          <p className="text-[#a1a1aa]">
            Create professional resumes with AI assistance
          </p>
          {DEV_MODE && (
            <p className="text-yellow-500 text-sm mt-2">
              Development Mode (localhost)
            </p>
          )}
        </div>
        <div className="flex justify-center">
          {children}
        </div>
        <p className="text-center text-xs text-[#71717a] mt-8">
          Powered by{' '}
          <a
            href="https://childressdigital.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-500 hover:text-green-400"
          >
            Childress Digital
          </a>
        </p>
      </div>
    </div>
  );
};

// Development Landing Page
const DevLandingPage: React.FC = () => {
  const { isSignedIn } = useDevAuth();

  if (isSignedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  return <LandingPageContent />;
};

// Clerk Landing Page
const ClerkLandingPage: React.FC = () => {
  const { isSignedIn } = useUser();

  if (isSignedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  return <LandingPageContent />;
};

// Landing Page Content (shared)
const LandingPageContent: React.FC = () => {
  useEffect(() => {
    // In production, redirect direct visitors to the main website
    // unless they're accessing via widget embed or from allowed hosts
    if (!DEV_MODE && !isWidgetEmbed()) {
      const hostname = window.location.hostname;
      const isAllowedHost = ALLOWED_HOSTS.some(allowed =>
        hostname === allowed || hostname.endsWith(`.${allowed}`)
      );

      if (!isAllowedHost) {
        // Redirect to main website
        window.location.href = REDIRECT_URL;
        return;
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-8">
            <span className="text-green-500 font-mono text-3xl">&lt;</span>
            <span className="text-white font-bold text-3xl">Resume Builder</span>
            <span className="text-green-500 font-mono text-3xl">/&gt;</span>
          </div>

          {DEV_MODE && (
            <div className="mb-4 px-4 py-2 bg-yellow-500/20 border border-yellow-500/50 rounded-lg inline-block">
              <p className="text-yellow-500 text-sm">
                Development Mode - Clerk auth bypassed for localhost
              </p>
            </div>
          )}

          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Create Professional Resumes
            <br />
            <span className="bg-gradient-to-r from-green-500 to-cyan-500 bg-clip-text text-transparent">
              With AI Assistance
            </span>
          </h1>

          <p className="text-xl text-[#a1a1aa] mb-8 max-w-2xl mx-auto">
            Answer simple questions, and our AI will help you create a
            professional, ATS-friendly resume that gets you noticed.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/sign-up"
              className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-all shadow-lg shadow-green-500/25"
            >
              Get Started Free
            </a>
            <a
              href="/sign-in"
              className="px-8 py-4 bg-[#1a1a1a] border border-[#27272a] text-white rounded-xl font-semibold hover:bg-[#27272a] transition-all"
            >
              Sign In
            </a>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
          <div className="p-6 bg-[#111111] border border-[#27272a] rounded-xl">
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">&#128172;</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Guided Conversation
            </h3>
            <p className="text-[#a1a1aa]">
              Just answer simple questions one at a time. No complicated forms or
              confusing interfaces.
            </p>
          </div>

          <div className="p-6 bg-[#111111] border border-[#27272a] rounded-xl">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">&#10024;</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              AI-Enhanced Writing
            </h3>
            <p className="text-[#a1a1aa]">
              Our AI improves your job descriptions to sound professional and
              impressive to employers.
            </p>
          </div>

          <div className="p-6 bg-[#111111] border border-[#27272a] rounded-xl">
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">&#128196;</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              ATS-Friendly Templates
            </h3>
            <p className="text-[#a1a1aa]">
              Download in PDF or Word format. Our templates pass through
              applicant tracking systems.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#27272a] py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-[#71717a]">
            Powered by{' '}
            <a
              href="https://childressdigital.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-500 hover:text-green-400"
            >
              Childress Digital
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
};

// Use appropriate landing page based on mode
const LandingPage = DEV_MODE ? DevLandingPage : ClerkLandingPage;

// Development Routes
const DevAppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />

      {/* Auth Routes - Development mode */}
      <Route
        path="/sign-in/*"
        element={
          <AuthLayout>
            <DevSignIn afterSignInUrl="/dashboard" />
          </AuthLayout>
        }
      />
      <Route
        path="/sign-up/*"
        element={
          <AuthLayout>
            <DevSignUp afterSignUpUrl="/dashboard" />
          </AuthLayout>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/builder"
        element={
          <ProtectedRoute>
            <Builder />
          </ProtectedRoute>
        }
      />
      <Route
        path="/builder/:resumeId"
        element={
          <ProtectedRoute>
            <Builder />
          </ProtectedRoute>
        }
      />
      <Route
        path="/preview"
        element={
          <ProtectedRoute>
            <Preview />
          </ProtectedRoute>
        }
      />
      <Route
        path="/preview/:resumeId"
        element={
          <ProtectedRoute>
            <Preview />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// Clerk Routes (production)
const ClerkAppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />

      {/* Auth Routes - Clerk handles these */}
      <Route
        path="/sign-in/*"
        element={
          <AuthLayout>
            <SignIn
              routing="path"
              path="/sign-in"
              signUpUrl="/sign-up"
              afterSignInUrl="/dashboard"
              appearance={{
                elements: {
                  rootBox: 'mx-auto',
                  card: 'bg-[#111111] border border-[#27272a]',
                  headerTitle: 'text-white',
                  headerSubtitle: 'text-[#a1a1aa]',
                  socialButtonsBlockButton: 'bg-[#1a1a1a] border-[#27272a] text-white hover:bg-[#27272a]',
                  formFieldLabel: 'text-[#a1a1aa]',
                  formFieldInput: 'bg-[#0a0a0a] border-[#27272a] text-white',
                  formButtonPrimary: 'bg-green-500 hover:bg-green-600',
                  footerActionLink: 'text-green-500 hover:text-green-400',
                },
              }}
            />
          </AuthLayout>
        }
      />
      <Route
        path="/sign-up/*"
        element={
          <AuthLayout>
            <SignUp
              routing="path"
              path="/sign-up"
              signInUrl="/sign-in"
              afterSignUpUrl="/dashboard"
              appearance={{
                elements: {
                  rootBox: 'mx-auto',
                  card: 'bg-[#111111] border border-[#27272a]',
                  headerTitle: 'text-white',
                  headerSubtitle: 'text-[#a1a1aa]',
                  socialButtonsBlockButton: 'bg-[#1a1a1a] border-[#27272a] text-white hover:bg-[#27272a]',
                  formFieldLabel: 'text-[#a1a1aa]',
                  formFieldInput: 'bg-[#0a0a0a] border-[#27272a] text-white',
                  formButtonPrimary: 'bg-green-500 hover:bg-green-600',
                  footerActionLink: 'text-green-500 hover:text-green-400',
                },
              }}
            />
          </AuthLayout>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/builder"
        element={
          <ProtectedRoute>
            <Builder />
          </ProtectedRoute>
        }
      />
      <Route
        path="/builder/:resumeId"
        element={
          <ProtectedRoute>
            <Builder />
          </ProtectedRoute>
        }
      />
      <Route
        path="/preview"
        element={
          <ProtectedRoute>
            <Preview />
          </ProtectedRoute>
        }
      />
      <Route
        path="/preview/:resumeId"
        element={
          <ProtectedRoute>
            <Preview />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// Development App (without Clerk)
const DevApp: React.FC = () => {
  return (
    <DevAuthProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <DevAppRoutes />
        </BrowserRouter>
      </QueryClientProvider>
    </DevAuthProvider>
  );
};

// Production App (with Clerk)
const ClerkApp: React.FC = () => {
  if (!clerkPubKey) {
    throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY environment variable');
  }

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/dashboard"
    >
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ClerkAppRoutes />
        </BrowserRouter>
      </QueryClientProvider>
    </ClerkProvider>
  );
};

function App() {
  // Use dev mode on localhost, Clerk in production
  if (DEV_MODE) {
    console.log('Running in Development Mode - Clerk auth bypassed');
    return <DevApp />;
  }

  return <ClerkApp />;
}

export default App;
