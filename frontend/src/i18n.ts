// src/i18n.ts
import { createI18n } from 'vue-i18n'
import es from './locales/es.json'
import en from './locales/en.json'
import hy from './locales/hy.json'
import { getUser } from './api'

type Lang = 'en' | 'es' | 'hy'
const supported: Lang[] = ['en', 'es', 'hy']
const storageKey = 'language'

async function loadUserAndLanguage(username: string) {
  try {
    const { user } = await getUser(username)
    const favlang = user.favlang ?? null  // puede venir vacío
    initLanguage(favlang)
    // aquí también puedes guardar el usuario en algún ref si quieres
  } catch (error) {
    console.error('Error al cargar usuario o idioma:', error)
    // Si falla todo, asegurarte que al menos inicializas el idioma
    initLanguage(null)
  }
}

// Detecta el idioma del navegador (la parte antes del guión)
const browserLang = (navigator.language.split('-')[0] as Lang)

// Elige idioma de localStorage o navegador, o 'en' si ninguno encaja
function pickBrowserOrStorage(): Lang {
  const stored = localStorage.getItem(storageKey) as Lang | null
  if (stored && supported.includes(stored)) return stored
  if (supported.includes(browserLang)) return browserLang
  return 'en'
}

// Crea la instancia de vue-i18n
const i18n = createI18n({
  legacy: false,
  locale: 'en',         // valor provisional; lo cambiaremos en initLanguage()
  fallbackLocale: 'en', // si no hay traducción
  messages: { en, es, hy }
})

// Inicializa el idioma según favlang → localStorage → navegador → 'en'
export function initLanguage(favlang?: string | null) {
  let lang: Lang
  if (favlang && supported.includes(favlang as Lang)) {
    lang = favlang as Lang
  } else {
    lang = pickBrowserOrStorage()
  }
  // Aplica y persiste
  i18n.global.locale.value = lang
  localStorage.setItem(storageKey, lang)
  document.documentElement.lang = lang
}

export default i18n
