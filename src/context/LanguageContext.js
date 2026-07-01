import { createContext, useContext, useMemo, useState } from 'react';
import { translations } from '../i18n/translations';

const LanguageContext = createContext(null);

function getNestedValue(source, path) {
  return path.split('.').reduce((acc, key) => (acc && acc[key] ? acc[key] : undefined), source);
}

function replaceParams(template, params = {}) {
  return Object.entries(params).reduce(
    (result, [key, value]) => result.replaceAll(`{{${key}}}`, String(value)),
    template
  );
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en');

  const value = useMemo(() => {
    const dictionary = translations[language] || translations.en;

    const t = (key, params) => {
      const resolved = getNestedValue(dictionary, key);
      if (typeof resolved !== 'string') {
        return key;
      }
      return replaceParams(resolved, params);
    };

    return {
      language,
      setLanguage,
      toggleLanguage: () => setLanguage((prev) => (prev === 'en' ? 'bg' : 'en')),
      t,
    };
  }, [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
