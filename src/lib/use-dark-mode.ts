'use client'
import { useState, useEffect } from 'react'

export function useDarkMode(): boolean {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    try {
      const profile = JSON.parse(localStorage.getItem('fh_profile') ?? '{}')
      setDark(profile.theme === 'dark')
    } catch {}

    function onThemeChange(e: Event) {
      setDark((e as CustomEvent<{ dark: boolean }>).detail.dark)
    }
    window.addEventListener('themechange', onThemeChange)
    return () => window.removeEventListener('themechange', onThemeChange)
  }, [])

  return dark
}
