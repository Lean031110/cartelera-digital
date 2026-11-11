import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import es from './locales/es.json';

/**
 * UI texts always go through i18n (spec §3.2 rule 11). Spanish by default;
 * English will land as a second locale before v1.0.
 */
export function initI18n(): typeof i18next {
  if (!i18next.isInitialized) {
    void i18next.use(initReactI18next).init({
      lng: 'es',
      fallbackLng: 'es',
      resources: { es: { translation: es } },
      interpolation: { escapeValue: false },
    });
  }
  return i18next;
}
