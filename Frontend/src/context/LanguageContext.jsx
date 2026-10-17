import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import translations from "./translations";

const LanguageContext = createContext(null);

const SUPPORTED_LANGUAGES = ["en", "fa", "ps"];

const getInitialLanguage = () => {
  try {
    const savedLanguage = localStorage.getItem("compstore-language");

    return SUPPORTED_LANGUAGES.includes(savedLanguage) ? savedLanguage : "en";
  } catch {
    return "en";
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(getInitialLanguage);

  const direction = language === "en" ? "ltr" : "rtl";

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
    document.documentElement.dataset.language = language;
  }, [language, direction]);

  const changeLanguage = useCallback((nextLanguage) => {
    if (!SUPPORTED_LANGUAGES.includes(nextLanguage)) return;

    setLanguage(nextLanguage);

    try {
      localStorage.setItem("compstore-language", nextLanguage);
    } catch {
      // Language switching still works if storage is unavailable.
    }
  }, []);

  const t = useCallback(
    (key, fallback) => {
      const keys = key.split(".");

      const findTranslation = (source) =>
        keys.reduce((value, part) => value?.[part], source);

      const translatedValue = findTranslation(translations[language]);

      if (typeof translatedValue === "string") {
        return translatedValue;
      }

      const englishValue = findTranslation(translations.en);

      if (typeof englishValue === "string") {
        return englishValue;
      }

      return fallback ?? key;
    },
    [language],
  );

  const value = useMemo(
    () => ({
      language,
      direction,
      isRTL: direction === "rtl",
      changeLanguage,
      t,
    }),
    [language, direction, changeLanguage, t],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider.");
  }

  return context;
};
