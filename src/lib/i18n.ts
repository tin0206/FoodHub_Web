export type Lang = 'en' | 'vi'

const LANG_KEY = 'fh_lang'

export function getLang(): Lang {
  if (typeof window === 'undefined') return 'en'
  try {
    return localStorage.getItem(LANG_KEY) === 'vi' ? 'vi' : 'en'
  } catch {
    return 'en'
  }
}

/** Sets the active language and notifies every `useLang()` consumer in the tab. */
export function setLang(lang: Lang) {
  if (typeof window === 'undefined') return
  localStorage.setItem(LANG_KEY, lang)
  window.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }))
}
