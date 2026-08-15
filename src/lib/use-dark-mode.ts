'use client'
import { useState, useEffect, useContext } from 'react'
import { readStoredTheme } from '@/lib/theme'
import { ForceLightContext } from '@/lib/force-light-context'

export function useDarkMode(): boolean {
  const forceLight = useContext(ForceLightContext)
  const [dark, setDark] = useState(false)

  useEffect(() => {
    if (forceLight) return
    setDark(readStoredTheme())

    function onThemeChange(e: Event) {
      setDark((e as CustomEvent<{ dark: boolean }>).detail.dark)
    }
    window.addEventListener('themechange', onThemeChange)
    return () => window.removeEventListener('themechange', onThemeChange)
  }, [forceLight])

  return forceLight ? false : dark
}
