import es from '../locales/es.json';
import en from '../locales/en.json';
import { useConfig } from './useConfig';

const translations = { es, en };

export function useTranslation() {
  const [config] = useConfig();
  const lang = config.language || 'es';
  const ns = translations[lang] || translations.es;

  // Helper to get nested value by dot notation
  const get = (path, defaultValue = '') => {
    const parts = path.split('.');
    let current = ns;
    for (const part of parts) {
      if (current === undefined || current === null) return defaultValue;
      current = current[part];
    }
    return current !== undefined && current !== null ? current : defaultValue;
  };

  // Function to translate with optional interpolation
  const t = (path, values = {}) => {
    let text = get(path, path); // fallback to path if not found
    // Replace placeholders like {speed}
    Object.keys(values).forEach(key => {
      const regex = new RegExp(`{${key}}`, 'g');
      text = text.replace(regex, values[key]);
    });
    return text;
  };

  return { t, lang };
}