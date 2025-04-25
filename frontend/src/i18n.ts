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






// // src/i18n.ts
// import { createI18n } from 'vue-i18n'
// import es from './locales/es.json'
// import en from './locales/en.json'
// import hy from './locales/hy.json'

// // Idiomas soportados
// const supportedLanguages = ['en', 'hy', 'es'] as const
// type Lang = typeof supportedLanguages[number]

// // Helpers
// const browserLanguage = navigator.language.split('-')[0] as Lang
// const storageKey = 'language'

// // Obtiene el idioma por defecto en localStorage o navegador
// function getDefaultBrowserLang(): Lang {
//   const saved = localStorage.getItem(storageKey) as Lang | null
//   if (saved && supportedLanguages.includes(saved)) {
//     return saved
//   }
//   if (supportedLanguages.includes(browserLanguage)) {
//     return browserLanguage
//   }
//   return 'en'
// }

// // Creamos la instancia con un locale provisional; la vamos a reconfigurar
// const i18n = createI18n({
//   legacy: false,
//   locale: 'en',           // provisional
//   fallbackLocale: 'en',
//   messages: { en, es, hy }
// })

// // Actualiza <html lang="…">
// function updateHtmlLang(lang: Lang) {
//   document.documentElement.lang = lang
// }

// /**
//  * Inicializa el idioma de la app.
//  * @param favlang El idioma marcado en users.favlang (puede venir null o undefined).
//  */
// export function initLanguage(favlang?: string | null) {
//   let lang: Lang = 'en'

//   if (favlang && supportedLanguages.includes(favlang as Lang)) {
//     // 1) Usa el idioma preferido en la base de datos
//     lang = favlang as Lang
//   } else {
//     // 2) Si no, elige el browser o lo guardado en localStorage
//     lang = getDefaultBrowserLang()
//   }

//   i18n.global.locale.value = lang
//   localStorage.setItem(storageKey, lang)
//   updateHtmlLang(lang)
// }

// export default i18n