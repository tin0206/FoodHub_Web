'use client'
import { useState, useEffect } from 'react'
import { readStoredTheme } from '@/lib/theme'

export function useDarkMode(): boolean {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    setDark(readStoredTheme())

    function onThemeChange(e: Event) {
      setDark((e as CustomEvent<{ dark: boolean }>).detail.dark)
    }
    window.addEventListener('themechange', onThemeChange)
    return () => window.removeEventListener('themechange', onThemeChange)
  }, [])

  return dark
}
