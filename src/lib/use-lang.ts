'use client'
import { useState, useEffect } from 'react'
import { getLang, type Lang } from './i18n'

export function useLang(): Lang {
  const [lang, setLangState] = useState<Lang>('en')

  useEffect(() => {
    setLangState(getLang())

    function onLangChange(e: Event) {
      setLangState((e as CustomEvent<{ lang: Lang }>).detail.lang)
    }
    window.addEventListener('langchange', onLangChange)
    return () => window.removeEventListener('langchange', onLangChange)
  }, [])

  return lang
}
