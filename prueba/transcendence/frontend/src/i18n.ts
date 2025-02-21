import { createI18n } from 'vue-i18n';
import en from './locales/en.json';
import es from './locales/es.json';

// Obtener el idioma del navegador
const browserLanguage = navigator.language.split('-')[0]; // "es-ES" → "es"

// Definir los idiomas soportados
const supportedLanguages = ['en', 'es'];

// Intentar usar el idioma guardado en localStorage o el del navegador
const savedLanguage = localStorage.getItem('language');
const defaultLanguage = savedLanguage || (supportedLanguages.includes(browserLanguage) ? browserLanguage : 'en');

const i18n = createI18n({
  legacy: false,
  locale: defaultLanguage,
  fallbackLocale: 'en',
  messages: {
    en,
    es
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
  i18n.global.locale.value = lang;
  localStorage.setItem('language', lang);
  updateHtmlLang(lang);
}

export default i18n;