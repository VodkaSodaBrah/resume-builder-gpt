import { create } from 'zustand';
import type { AnalyticsEvent } from '@/types';

interface AnalyticsStore {
  sessionId: string;
  events: AnalyticsEvent[];
  trackEvent: (eventType: string, eventData?: Record<string, unknown>) => void;
  getSessionId: () => string;
  flushEvents: () => Promise<void>;
}

const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};

const API_BASE = '/api';

export const useAnalyticsStore = create<AnalyticsStore>((set, get) => ({
  sessionId: generateSessionId(),
  events: [],

  getSessionId: () => get().sessionId,

  trackEvent: (eventType: string, eventData: Record<string, unknown> = {}) => {
    const event: AnalyticsEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      userId: '', // Will be set when user is authenticated
      eventType,
      eventData,
      timestamp: new Date().toISOString(),
      sessionId: get().sessionId,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      language: typeof navigator !== 'undefined' ? navigator.language : undefined,
    };

    set((state) => ({
      events: [...state.events, event],
    }));

    // Auto-flush every 10 events
    if (get().events.length >= 10) {
      get().flushEvents();
    }
  },

  flushEvents: async () => {
    const { events } = get();
    if (events.length === 0) return;

    try {
      await fetch(`${API_BASE}/analytics/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events }),
      });

      set({ events: [] });
    } catch (error) {
      console.error('Failed to flush analytics events:', error);
    }
  },
}));

// Analytics event types for consistent tracking
export const AnalyticsEvents = {
  // Session events
  SESSION_START: 'session_start',
  SESSION_END: 'session_end',

  // Auth events
  SIGNUP_START: 'signup_start',
  SIGNUP_COMPLETE: 'signup_complete',
  SIGNUP_ERROR: 'signup_error',
  LOGIN_START: 'login_start',
  LOGIN_COMPLETE: 'login_complete',
  LOGIN_ERROR: 'login_error',
  LOGOUT: 'logout',
  EMAIL_VERIFIED: 'email_verified',

  // Resume building events
  RESUME_START: 'resume_start',
  QUESTION_ANSWERED: 'question_answered',
  QUESTION_SKIPPED: 'question_skipped',
  CATEGORY_COMPLETED: 'category_completed',
  RESUME_COMPLETE: 'resume_complete',
  RESUME_ABANDONED: 'resume_abandoned',

  // AI events
  AI_ENHANCEMENT_START: 'ai_enhancement_start',
  AI_ENHANCEMENT_COMPLETE: 'ai_enhancement_complete',
  AI_ENHANCEMENT_ERROR: 'ai_enhancement_error',

  // Download events
  DOWNLOAD_PDF: 'download_pdf',
  DOWNLOAD_DOCX: 'download_docx',
  TEMPLATE_SELECTED: 'template_selected',

  // Edit events
  RESUME_EDIT_START: 'resume_edit_start',
  RESUME_EDIT_COMPLETE: 'resume_edit_complete',

  // Error events
  ERROR_OCCURRED: 'error_occurred',
  API_ERROR: 'api_error',

  // Widget events
  WIDGET_OPENED: 'widget_opened',
  WIDGET_CLOSED: 'widget_closed',
  WIDGET_EXPANDED: 'widget_expanded',
  WIDGET_MINIMIZED: 'widget_minimized',
  RESUME_COMPLETED: 'resume_completed',
} as const;
