// i18n Translation System
// Supports 10 languages: en, es, fr, de, pt, zh, ja, ko, ar, hi

export type SupportedLanguage = 'en' | 'es' | 'fr' | 'de' | 'pt' | 'zh' | 'ja' | 'ko' | 'ar' | 'hi';

export interface LanguageOption {
  code: SupportedLanguage;
  label: string;
  nativeLabel: string;
  direction: 'ltr' | 'rtl';
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', direction: 'ltr' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Espanol', direction: 'ltr' },
  { code: 'fr', label: 'French', nativeLabel: 'Francais', direction: 'ltr' },
  { code: 'de', label: 'German', nativeLabel: 'Deutsch', direction: 'ltr' },
  { code: 'pt', label: 'Portuguese', nativeLabel: 'Portugues', direction: 'ltr' },
  { code: 'zh', label: 'Chinese', nativeLabel: '中文', direction: 'ltr' },
  { code: 'ja', label: 'Japanese', nativeLabel: '日本語', direction: 'ltr' },
  { code: 'ko', label: 'Korean', nativeLabel: '한국어', direction: 'ltr' },
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية', direction: 'rtl' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी', direction: 'ltr' },
];

// Translation type definition
export interface Translations {
  // UI Elements
  ui: {
    send: string;
    skip: string;
    yes: string;
    no: string;
    back: string;
    next: string;
    save: string;
    download: string;
    downloadPdf: string;
    downloadDocx: string;
    preview: string;
    edit: string;
    delete: string;
    cancel: string;
    confirm: string;
    loading: string;
    error: string;
    success: string;
    retry: string;
    backToDashboard: string;
    createNewResume: string;
    selectTemplate: string;
    enhanceWithAi: string;
    enhancing: string;
  };
  // Categories
  categories: {
    intro: string;
    language: string;
    personal: string;
    work: string;
    education: string;
    volunteering: string;
    skills: string;
    references: string;
    review: string;
    complete: string;
  };
  // Questions
  questions: {
    language_select: string;
    welcome: string;
    full_name: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
    website: string;
    summary: string;
    has_work_experience: string;
    job_title: string;
    company: string;
    work_location: string;
    work_start_date: string;
    work_end_date: string;
    work_current: string;
    job_description: string;
    add_another_job: string;
    has_education: string;
    degree: string;
    school: string;
    education_location: string;
    graduation_date: string;
    education_current: string;
    field_of_study: string;
    gpa: string;
    add_another_education: string;
    has_volunteering: string;
    volunteer_role: string;
    volunteer_organization: string;
    volunteer_description: string;
    volunteer_start_date: string;
    volunteer_end_date: string;
    add_another_volunteer: string;
    skills: string;
    certifications: string;
    has_references: string;
    reference_name: string;
    reference_title: string;
    reference_company: string;
    reference_email: string;
    reference_phone: string;
    reference_relationship: string;
    add_another_reference: string;
    template_style: string;
    review_complete: string;
    final_confirmation: string;
  };
  // Placeholders
  placeholders: {
    full_name: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
    website: string;
    summary: string;
    job_title: string;
    company: string;
    work_location: string;
    date: string;
    job_description: string;
    degree: string;
    school: string;
    field_of_study: string;
    gpa: string;
    volunteer_role: string;
    volunteer_organization: string;
    volunteer_description: string;
    skills: string;
    certifications: string;
    reference_name: string;
    reference_title: string;
    reference_company: string;
    reference_email: string;
    reference_phone: string;
    reference_relationship: string;
  };
  // Template options
  templates: {
    modern: string;
    classic: string;
    professional: string;
  };
  // Messages
  messages: {
    resumeComplete: string;
    savingResume: string;
    resumeSaved: string;
    downloadStarted: string;
    errorSaving: string;
    errorLoading: string;
    noResume: string;
    aiEnhanceSuccess: string;
    aiEnhanceError: string;
  };
}

// Lazy-load translations to avoid bundling all languages
const translationCache: Partial<Record<SupportedLanguage, Translations>> = {};

export async function loadTranslations(language: SupportedLanguage): Promise<Translations> {
  if (translationCache[language]) {
    return translationCache[language]!;
  }

  try {
    const translations = await import(`./translations/${language}.json`);
    translationCache[language] = translations.default || translations;
    return translationCache[language]!;
  } catch (error) {
    console.error(`Failed to load translations for ${language}, falling back to English:`, error);
    if (language !== 'en') {
      return loadTranslations('en');
    }
    throw error;
  }
}

// Synchronous getter for already-loaded translations
export function getTranslations(language: SupportedLanguage): Translations | null {
  return translationCache[language] || null;
}

// Preload a language
export async function preloadLanguage(language: SupportedLanguage): Promise<void> {
  await loadTranslations(language);
}

// Get nested value from object using dot notation
function getNestedValue(obj: Record<string, unknown>, path: string): string | undefined {
  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }

  return typeof current === 'string' ? current : undefined;
}

// Translation function factory
export function createTranslator(translations: Translations) {
  return function t(key: string, fallback?: string): string {
    const value = getNestedValue(translations as unknown as Record<string, unknown>, key);
    return value || fallback || key;
  };
}

// Get language direction
export function getLanguageDirection(language: SupportedLanguage): 'ltr' | 'rtl' {
  const lang = SUPPORTED_LANGUAGES.find(l => l.code === language);
  return lang?.direction || 'ltr';
}

// Get language display name
export function getLanguageDisplayName(language: SupportedLanguage): string {
  const lang = SUPPORTED_LANGUAGES.find(l => l.code === language);
  return lang ? `${lang.nativeLabel} (${lang.label})` : language;
}

// Default export for convenience
export default {
  SUPPORTED_LANGUAGES,
  loadTranslations,
  getTranslations,
  preloadLanguage,
  createTranslator,
  getLanguageDirection,
  getLanguageDisplayName,
};
