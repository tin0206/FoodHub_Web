'use client'

import { useRef } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { useDarkMode } from '@/lib/use-dark-mode'
import { useStrings } from '@/lib/use-strings'
import type { RecipeCardTheme } from './recipe-card-theme'

export function PhotoPicker({
  preview,
  onPick,
  onClear,
  theme,
}: {
  preview: string
  onPick: (file: File) => void
  onClear: () => void
  theme?: RecipeCardTheme
}) {
  const dark = useDarkMode()
  const t = useStrings()
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) onPick(file)
  }

  return (
    <div className="rounded-xl overflow-hidden">
      {preview ? (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="relative w-full h-35 block"
          style={{ height: 140 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="" className="w-full h-full object-cover" />
          <span
            className="absolute inset-0 flex items-center justify-center gap-1.5"
            style={{ backgroundColor: 'rgba(0,0,0,0.25)' }}
          >
            <ImagePlus size={15} color="white" />
            <span className="text-xs font-semibold text-white">{t.changePhoto}</span>
          </span>
          <span
            onClick={e => {
              e.stopPropagation()
              onClear()
            }}
            className="absolute top-2 right-2 w-6.5 h-6.5 rounded-full flex items-center justify-center"
            style={{ width: 26, height: 26, backgroundColor: 'rgba(0,0,0,0.55)' }}
            role="button"
            aria-label="Remove photo"
          >
            <X size={13} color="white" />
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`w-full h-25 flex flex-col items-center justify-center gap-1 rounded-xl ${theme ? '' : 'border-2 border-dashed'}`}
          style={
            theme
              ? { height: 100, background: `linear-gradient(135deg, ${theme.start}, ${theme.end})`, color: 'rgba(255,255,255,0.9)' }
              : {
                  height: 100,
                  backgroundColor: dark ? '#1E1E1E' : '#FAFBFA',
                  borderColor: dark ? '#3A3A3A' : 'var(--tm-border-i)',
                  color: dark ? '#64748B' : '#9CA3AF',
                }
          }
        >
          <ImagePlus size={26} />
          <span className="text-xs">{t.addPhoto}</span>
        </button>
      )}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
    </div>
  )
}
