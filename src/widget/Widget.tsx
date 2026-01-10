import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignupForm } from '@/components/auth/SignupForm';
import { useAuthStore } from '@/stores/authStore';
import { useConversationStore } from '@/stores/conversationStore';
import { useAnalyticsStore, AnalyticsEvents } from '@/stores/analyticsStore';
import { X, Maximize2, Minimize2 } from 'lucide-react';

const queryClient = new QueryClient();

export interface WidgetConfig {
  apiUrl?: string;
  primaryColor?: string;
  companyName?: string;
  companyLogo?: string;
  allowSignup?: boolean;
  defaultLanguage?: string;
  onComplete?: (resumeData: unknown) => void;
  onClose?: () => void;
}

interface WidgetProps {
  config?: WidgetConfig;
  isOpen?: boolean;
  onToggle?: () => void;
}

type WidgetView = 'login' | 'signup' | 'builder';

const WidgetContent: React.FC<{ config: WidgetConfig }> = ({ config }) => {
  const { isAuthenticated } = useAuthStore();
  const { trackEvent } = useAnalyticsStore();
  const [view, setView] = useState<WidgetView>('login');
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    trackEvent(AnalyticsEvents.WIDGET_OPENED, {
      companyName: config.companyName,
    });
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      setView('builder');
    }
  }, [isAuthenticated]);

  const handleClose = () => {
    trackEvent(AnalyticsEvents.WIDGET_CLOSED);
    config.onClose?.();
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    trackEvent(isExpanded ? AnalyticsEvents.WIDGET_MINIMIZED : AnalyticsEvents.WIDGET_EXPANDED);
  };

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
        {!isAuthenticated ? (
          <div className="h-full overflow-y-auto p-4">
            {view === 'login' ? (
              <div className="space-y-4">
                <LoginForm />
                {config.allowSignup !== false && (
                  <p className="text-center text-sm text-[#71717a]">
                    Don't have an account?{' '}
                    <button
                      onClick={() => setView('signup')}
                      className="text-green-500 hover:text-green-400"
                    >
                      Sign up
                    </button>
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <SignupForm />
                <p className="text-center text-sm text-[#71717a]">
                  Already have an account?{' '}
                  <button
                    onClick={() => setView('login')}
                    className="text-green-500 hover:text-green-400"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            )}
          </div>
        ) : (
          <ChatContainer
            onComplete={(data) => {
              trackEvent(AnalyticsEvents.RESUME_COMPLETED);
              config.onComplete?.(data);
            }}
          />
        )}
      </div>
    </div>
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

  return (
    <QueryClientProvider client={queryClient}>
      <WidgetContent config={config} />
    </QueryClientProvider>
  );
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

export default Widget;
