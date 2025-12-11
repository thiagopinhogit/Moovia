import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'react-native-localize';
import en from './locales/en';
import pt from './locales/pt';
import es from './locales/es';
import fr from './locales/fr';
import de from './locales/de';
import it from './locales/it';
import zh from './locales/zh';
import ja from './locales/ja';
import ko from './locales/ko';
import ru from './locales/ru';

// Get device language
const deviceLanguage = getLocales()[0]?.languageCode || 'en';

const resources = {
  en: { translation: en },
  pt: { translation: pt },
  es: { translation: es },
  fr: { translation: fr },
  de: { translation: de },
  it: { translation: it },
  zh: { translation: zh },
  ja: { translation: ja },
  ko: { translation: ko },
  ru: { translation: ru },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: deviceLanguage,
    fallbackLng: 'en',
    compatibilityJSON: 'v4',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;

