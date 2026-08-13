'use client'
import { useMemo } from 'react'
import { useLang } from './use-lang'
import { getStrings } from './strings'

export function useStrings() {
  const lang = useLang()
  return useMemo(() => getStrings(lang), [lang])
}
