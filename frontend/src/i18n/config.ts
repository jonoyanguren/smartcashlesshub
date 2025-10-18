import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import commonEN from '../locales/en/common.json';
import authEN from '../locales/en/auth.json';
import landingEN from '../locales/en/landing.json';
import dashboardEN from '../locales/en/dashboard.json';

import commonES from '../locales/es/common.json';
import authES from '../locales/es/auth.json';
import landingES from '../locales/es/landing.json';
import dashboardES from '../locales/es/dashboard.json';

// Get the user's preferred language from localStorage or browser
const getDefaultLanguage = (): string => {
  const savedLanguage = localStorage.getItem('language');
  if (savedLanguage) {
    return savedLanguage;
  }

  // Get browser language
  const browserLanguage = navigator.language.split('-')[0];
  return ['en', 'es'].includes(browserLanguage) ? browserLanguage : 'en';
};

const resources = {
  en: {
    common: commonEN,
    auth: authEN,
    landing: landingEN,
    dashboard: dashboardEN,
  },
  es: {
    common: commonES,
    auth: authES,
    landing: landingES,
    dashboard: dashboardES,
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getDefaultLanguage(),
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'auth', 'landing', 'dashboard'],
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;