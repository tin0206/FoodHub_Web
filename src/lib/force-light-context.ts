'use client'
import { createContext } from 'react'

/** Set by <ForceLightTheme> on public/guest pages so every descendant's
 * useDarkMode() resolves to light, no matter what's in localStorage. */
export const ForceLightContext = createContext(false)
