import { useTranslation as useI18nTranslation } from 'react-i18next'

export function useTranslation() {
  const { t: i18nT, i18n } = useI18nTranslation()

  const t = (key: string): string => {
    const result = i18nT(key)
    return result
  }

  return { t, language: i18n.language }
}
