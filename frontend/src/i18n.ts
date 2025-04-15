import { createI18n } from 'vue-i18n';
import es from './locales/es.json';
import en from './locales/en.json';
import hy from './locales/hy.json';

// Obtener el idioma del navegador
const browserLanguage = navigator.language.split('-')[0]; // "es-ES" → "es"

// Definir los idiomas soportados
const supportedLanguages = ['en', 'hy', 'es'];

// Intentar usar el idioma guardado en localStorage o el del navegador
const savedLanguage = localStorage.getItem('language');
const defaultLanguage = savedLanguage || (supportedLanguages.includes(browserLanguage) ? browserLanguage : 'en');

const i18n = createI18n({
  legacy: false,
  locale: defaultLanguage,
  fallbackLocale: 'en',
  messages: {
    en,
    es,
    hy
  }
});

// 🔹 Función para actualizar el atributo lang del HTML
const updateHtmlLang = (lang: string) => {
  document.documentElement.lang = lang;
};

// Establecer el idioma inicial en el HTML
updateHtmlLang(defaultLanguage);

// 🔹 Función para cambiar el idioma y actualizar el HTML
export function setLanguage(lang: string) {
  if (supportedLanguages.includes(lang as any))
    i18n.global.locale.value = lang as "en" | "hy" | "es";
  localStorage.setItem('language', lang);
  updateHtmlLang(lang);
}

export default i18n;