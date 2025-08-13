import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Import translation files
import en from "../locales/en.json";
import ru from "../locales/ru.json";
import es from "../locales/es.json";
import zh from "../locales/zh.json";
import ar from "../locales/ar.json";

const resources = {
  en: { translation: en },
  ru: { translation: ru },
  es: { translation: es },
  zh: { translation: zh },
  ar: { translation: ar },
};

// Detect language from various sources
const detectLanguage = (): string => {
  // 1. Check localStorage
  const storedLanguage = localStorage.getItem('showpls-language');
  if (storedLanguage && Object.keys(resources).includes(storedLanguage)) {
    return storedLanguage;
  }

  // 2. Check Telegram WebApp language
  if (typeof window !== 'undefined' && window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code) {
    const telegramLang = window.Telegram.WebApp.initDataUnsafe.user.language_code;
    if (Object.keys(resources).includes(telegramLang)) {
      return telegramLang;
    }
  }

  // 3. Check browser language
  const browserLang = navigator.language.split('-')[0];
  if (Object.keys(resources).includes(browserLang)) {
    return browserLang;
  }

  // 4. Default to English
  return 'en';
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: detectLanguage(),
    fallbackLng: 'en',
    
    interpolation: {
      escapeValue: false, // React already escapes values
    },

    // Additional options for better UX
    react: {
      useSuspense: false,
    },

    // Debug in development
    debug: process.env.NODE_ENV === 'development',
  });

// Update HTML dir attribute for RTL languages
i18n.on('languageChanged', (lng) => {
  document.documentElement.setAttribute('dir', lng === 'ar' ? 'rtl' : 'ltr');
  document.documentElement.setAttribute('lang', lng);
});

// Set initial direction
document.documentElement.setAttribute('dir', i18n.language === 'ar' ? 'rtl' : 'ltr');
document.documentElement.setAttribute('lang', i18n.language);

export default i18n;

// Extend Window interface for Telegram WebApp
declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initDataUnsafe?: {
          user?: {
            language_code?: string;
          };
        };
      };
    };
  }
}
