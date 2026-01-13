import { useState, useEffect, useCallback } from 'react';
import { useConversationStore } from '@/stores/conversationStore';
import {
  loadTranslations,
  getTranslations,
  createTranslator,
  getLanguageDirection,
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
  type Translations,
} from '@/lib/i18n';

// Parse language selection from user input (e.g., "English (English)" -> "en")
export function parseLanguageSelection(selection: string): SupportedLanguage {
  // Check each language option
  for (const lang of SUPPORTED_LANGUAGES) {
    const optionText = `${lang.nativeLabel} (${lang.label})`;
    if (selection === optionText || selection.toLowerCase() === lang.code) {
      return lang.code;
    }
  }
  // Default to English if not found
  return 'en';
}

export function useTranslation() {
  const resumeData = useConversationStore((state) => state.resumeData);
  const [translations, setTranslations] = useState<Translations | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get language from resume data or default to English
  const languageSelection = (resumeData as { language?: string })?.language;
  const language: SupportedLanguage = languageSelection
    ? parseLanguageSelection(languageSelection)
    : 'en';

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setIsLoading(true);
      try {
        // Check cache first
        const cached = getTranslations(language);
        if (cached) {
          setTranslations(cached);
          setIsLoading(false);
          return;
        }

        // Load translations
        const loaded = await loadTranslations(language);
        if (mounted) {
          setTranslations(loaded);
        }
      } catch (error) {
        console.error('Failed to load translations:', error);
        // Fall back to English
        if (mounted && language !== 'en') {
          const fallback = await loadTranslations('en');
          setTranslations(fallback);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [language]);

  // Create translation function
  const t = useCallback(
    (key: string, fallback?: string): string => {
      if (!translations) {
        return fallback || key;
      }
      const translator = createTranslator(translations);
      return translator(key, fallback);
    },
    [translations]
  );

  // Get text direction for RTL languages
  const direction = getLanguageDirection(language);

  return {
    t,
    language,
    direction,
    isLoading,
    translations,
  };
}

// Hook to get just the current language code
export function useCurrentLanguage(): SupportedLanguage {
  const resumeData = useConversationStore((state) => state.resumeData);
  const languageSelection = (resumeData as { language?: string })?.language;
  return languageSelection ? parseLanguageSelection(languageSelection) : 'en';
}

export default useTranslation;
