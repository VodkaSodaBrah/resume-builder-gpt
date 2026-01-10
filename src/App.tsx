import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Pages
import { Dashboard } from '@/pages/Dashboard';
import { Builder } from '@/pages/Builder';
import { Preview } from '@/pages/Preview';

// Auth Components
import { LoginForm } from '@/components/auth/LoginForm';
import { SignupForm } from '@/components/auth/SignupForm';

// Stores
import { useAuthStore } from '@/stores/authStore';

const queryClient = new QueryClient();

// Protected Route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// Auth Route wrapper (redirects to dashboard if already logged in)
const AuthRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (isAuthenticated) {
    const from = (location.state as { from?: Location })?.from?.pathname || '/dashboard';
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
};

// Auth Layout
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
            Build a resume that gets you noticed
          </p>
        </div>
        {children}
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

// Landing Page
const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

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

          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Build a Resume That
            <br />
            <span className="bg-gradient-to-r from-green-500 to-cyan-500 bg-clip-text text-transparent">
              Gets You Hired
            </span>
          </h1>

          <p className="text-xl text-[#a1a1aa] mb-8 max-w-2xl mx-auto">
            Answer a few simple questions and we'll create a polished,
            professional resume that stands out to employers.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/signup"
              className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-all shadow-lg shadow-green-500/25"
            >
              Get Started Free
            </a>
            <a
              href="/login"
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
              <span className="text-2xl">💬</span>
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
              <span className="text-2xl">✨</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Polished, Professional Writing
            </h3>
            <p className="text-[#a1a1aa]">
              We help turn your experience into compelling descriptions that
              impress hiring managers.
            </p>
          </div>

          <div className="p-6 bg-[#111111] border border-[#27272a] rounded-xl">
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">📄</span>
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

// Email Verification Page
const VerifyEmail: React.FC = () => {
  const [status, setStatus] = React.useState<'loading' | 'success' | 'error'>('loading');
  const location = useLocation();
  const { verifyEmail } = useAuthStore();

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    if (token) {
      verifyEmail(token)
        .then(() => setStatus('success'))
        .catch(() => setStatus('error'));
    } else {
      setStatus('error');
    }
  }, [location, verifyEmail]);

  return (
    <AuthLayout>
      <div className="terminal-window max-w-md mx-auto">
        <div className="terminal-header">
          <div className="terminal-dot red" />
          <div className="terminal-dot yellow" />
          <div className="terminal-dot green" />
          <span className="terminal-title">verify.sh</span>
        </div>
        <div className="p-6 text-center">
          {status === 'loading' && (
            <>
              <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white">Verifying your email...</p>
            </>
          )}
          {status === 'success' && (
            <>
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✓</span>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Email Verified!</h2>
              <p className="text-[#a1a1aa] mb-6">
                Your account is now active. You can start building your resume.
              </p>
              <a
                href="/dashboard"
                className="inline-block px-6 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
              >
                Go to Dashboard
              </a>
            </>
          )}
          {status === 'error' && (
            <>
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">!</span>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Verification Failed</h2>
              <p className="text-[#a1a1aa] mb-6">
                The verification link is invalid or has expired.
              </p>
              <a
                href="/login"
                className="inline-block px-6 py-3 bg-[#1a1a1a] border border-[#27272a] text-white rounded-lg font-medium hover:bg-[#27272a] transition-colors"
              >
                Back to Login
              </a>
            </>
          )}
        </div>
      </div>
    </AuthLayout>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />

          {/* Auth Routes */}
          <Route
            path="/login"
            element={
              <AuthRoute>
                <AuthLayout>
                  <LoginForm />
                </AuthLayout>
              </AuthRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <AuthRoute>
                <AuthLayout>
                  <SignupForm />
                </AuthLayout>
              </AuthRoute>
            }
          />
          <Route path="/verify-email" element={<VerifyEmail />} />

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
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
