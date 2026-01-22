import React, { useState, useEffect } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  ClerkProvider,
  SignIn,
  SignedIn,
  SignedOut,
  useUser,
} from '@clerk/clerk-react';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { useConversationStore } from '@/stores/conversationStore';
import { useAnalyticsStore, AnalyticsEvents } from '@/stores/analyticsStore';
import { createResume, type ResumeData } from '@/lib/supabase';
import { X, Maximize2, Minimize2 } from 'lucide-react';

const queryClient = new QueryClient();

// Get Clerk publishable key from environment
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

export interface WidgetConfig {
  apiUrl?: string;
  primaryColor?: string;
  companyName?: string;
  companyLogo?: string;
  allowSignup?: boolean;
  defaultLanguage?: string;
  onComplete?: (resumeData: unknown) => void;
  onClose?: () => void;
  clerkPublishableKey?: string; // Allow override for embedded use
  useParentAuth?: boolean; // Skip ClerkProvider, use parent's auth context
}

interface WidgetProps {
  config?: WidgetConfig;
  isOpen?: boolean;
  onToggle?: () => void;
}

const WidgetContent: React.FC<{ config: WidgetConfig }> = ({ config }) => {
  const { user, isLoaded } = useUser();
  const { trackEvent } = useAnalyticsStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    trackEvent(AnalyticsEvents.WIDGET_OPENED, {
      companyName: config.companyName,
    });
  }, []);

  const handleClose = () => {
    trackEvent(AnalyticsEvents.WIDGET_CLOSED);
    config.onClose?.();
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    trackEvent(isExpanded ? AnalyticsEvents.WIDGET_MINIMIZED : AnalyticsEvents.WIDGET_EXPANDED);
  };

  const handleComplete = async (data: unknown) => {
    trackEvent(AnalyticsEvents.RESUME_COMPLETED);

    // Save to Supabase if user is authenticated
    if (user && data) {
      setIsSaving(true);
      try {
        const resumeData = data as ResumeData;
        const name = resumeData.personalInfo?.fullName || 'Untitled Resume';
        await createResume(user.id, name, resumeData);
      } catch (error) {
        console.error('Failed to save resume:', error);
      } finally {
        setIsSaving(false);
      }
    }

    config.onComplete?.(data);
  };

  if (!isLoaded) {
    return (
      <div className="widget-container bg-[#0a0a0a] border border-[#27272a] rounded-xl shadow-2xl overflow-hidden flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      className={`widget-container bg-[#0a0a0a] border border-[#27272a] rounded-xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${
        isExpanded ? 'widget-expanded' : 'widget-compact'
      }`}
      style={{
        '--widget-primary': config.primaryColor || '#22c55e',
      } as React.CSSProperties}
    >
      {/* Widget Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#111111] border-b border-[#27272a]">
        <div className="flex items-center gap-2">
          {config.companyLogo ? (
            <img
              src={config.companyLogo}
              alt={config.companyName || 'Logo'}
              className="w-6 h-6 object-contain"
            />
          ) : (
            <span className="text-green-500 font-mono text-sm">&lt;/&gt;</span>
          )}
          <span className="text-white text-sm font-medium">
            {config.companyName || 'Resume Builder'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleExpand}
            className="p-1.5 text-[#71717a] hover:text-white hover:bg-[#27272a] rounded transition-colors"
            title={isExpanded ? 'Minimize' : 'Expand'}
          >
            {isExpanded ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={handleClose}
            className="p-1.5 text-[#71717a] hover:text-white hover:bg-[#27272a] rounded transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Widget Content */}
      <div className="flex-1 overflow-hidden">
        <SignedOut>
          <div className="h-full overflow-y-auto p-4 flex items-center justify-center">
            <SignIn
              routing="hash"
              signUpUrl={config.allowSignup !== false ? undefined : '/sign-in'}
              appearance={{
                elements: {
                  rootBox: 'w-full',
                  card: 'bg-[#111111] border border-[#27272a] shadow-none',
                  headerTitle: 'text-white text-lg',
                  headerSubtitle: 'text-[#a1a1aa]',
                  socialButtonsBlockButton: 'bg-[#1a1a1a] border-[#27272a] text-white hover:bg-[#27272a]',
                  formFieldLabel: 'text-[#a1a1aa]',
                  formFieldInput: 'bg-[#0a0a0a] border-[#27272a] text-white',
                  formButtonPrimary: 'bg-green-500 hover:bg-green-600',
                  footerActionLink: 'text-green-500 hover:text-green-400',
                },
              }}
            />
          </div>
        </SignedOut>

        <SignedIn>
          {isSaving ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-[#a1a1aa]">Saving your resume...</p>
              </div>
            </div>
          ) : (
            <ChatContainer
              isWidget
              onComplete={handleComplete}
            />
          )}
        </SignedIn>
      </div>
    </div>
  );
};

const WidgetWithClerk: React.FC<{ config: WidgetConfig }> = ({ config }) => {
  // When useParentAuth is true, skip ClerkProvider and use parent's auth context
  if (config.useParentAuth) {
    return (
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <WidgetContent config={config} />
        </QueryClientProvider>
      </MemoryRouter>
    );
  }

  const pubKey = config.clerkPublishableKey || clerkPubKey;

  if (!pubKey) {
    return (
      <div className="widget-container bg-[#0a0a0a] border border-[#27272a] rounded-xl p-4 text-center">
        <p className="text-red-400">Missing Clerk configuration</p>
      </div>
    );
  }

  return (
    <MemoryRouter>
      <ClerkProvider publishableKey={pubKey}>
        <QueryClientProvider client={queryClient}>
          <WidgetContent config={config} />
        </QueryClientProvider>
      </ClerkProvider>
    </MemoryRouter>
  );
};

export const Widget: React.FC<WidgetProps> = ({
  config = {},
  isOpen = true,
  onToggle,
}) => {
  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="widget-trigger fixed bottom-4 right-4 w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
        style={{
          backgroundColor: config.primaryColor || '#22c55e',
        }}
      >
        <span className="text-white font-mono text-lg">&lt;/&gt;</span>
      </button>
    );
  }

  return <WidgetWithClerk config={config} />;
};

// Floating widget wrapper for embed
export const FloatingWidget: React.FC<{ config?: WidgetConfig }> = ({
  config = {},
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="resume-builder-widget">
      {isOpen ? (
        <div className="fixed bottom-4 right-4 z-[9999]">
          <Widget
            config={{
              ...config,
              onClose: () => setIsOpen(false),
            }}
            isOpen={true}
          />
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 z-[9999] w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
          style={{
            backgroundColor: config.primaryColor || '#22c55e',
          }}
        >
          <span className="text-white font-mono text-lg">&lt;/&gt;</span>
        </button>
      )}
    </div>
  );
};

// Embedded widget - renders directly in container (not floating)
export const EmbeddedWidget: React.FC<{ config?: WidgetConfig }> = ({
  config = {},
}) => {
  return (
    <div className="resume-builder-widget-embedded w-full h-full min-h-[500px]">
      <WidgetWithClerk config={config} />
    </div>
  );
};

export default Widget;
