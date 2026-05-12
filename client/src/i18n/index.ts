import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { translations } from './translations'

export type { Language } from './translations'
export { translations }

i18n.use(initReactI18next).init({
  resources: {
    ar: { translation: translations.ar },
    fr: { translation: translations.fr },
    en: { translation: translations.en },
  },
  lng: localStorage.getItem('language') || 'ar',
  fallbackLng: 'ar',
  interpolation: { escapeValue: false },
})

i18n.on('languageChanged', (lng) => {
  localStorage.setItem('language', lng)
  document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr'
  document.documentElement.lang = lng
})

const dir = i18n.language === 'ar' ? 'rtl' : 'ltr'
document.documentElement.dir = dir
document.documentElement.lang = i18n.language

export default i18n
