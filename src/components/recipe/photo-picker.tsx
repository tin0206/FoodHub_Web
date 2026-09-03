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
  size = 'sm',
}: {
  preview: string
  onPick: (file: File) => void
  onClear: () => void
  theme?: RecipeCardTheme
  /** 'lg' matches the aspect-4/3 box the recipe detail view displays the photo at
   * (used on wide desktop forms, where the old fixed 140px strip cropped photos hard). */
  size?: 'sm' | 'lg'
}) {
  const dark = useDarkMode()
  const t = useStrings()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const large = size === 'lg'

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
          className={`relative w-full block ${large ? 'aspect-4/3' : ''}`}
          style={large ? undefined : { height: 140 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="" className="w-full h-full object-cover" />
          <span
            className="absolute inset-0 flex items-center justify-center gap-1.5"
            style={{ backgroundColor: 'rgba(0,0,0,0.25)' }}
          >
            <ImagePlus size={large ? 18 : 15} color="white" />
            <span className={`font-semibold text-white ${large ? 'text-sm' : 'text-xs'}`}>{t.changePhoto}</span>
          </span>
          <span
            onClick={e => {
              e.stopPropagation()
              onClear()
            }}
            className="absolute top-2 right-2 rounded-full flex items-center justify-center"
            style={{ width: large ? 32 : 26, height: large ? 32 : 26, backgroundColor: 'rgba(0,0,0,0.55)' }}
            role="button"
            aria-label="Remove photo"
          >
            <X size={large ? 16 : 13} color="white" />
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`w-full flex flex-col items-center justify-center gap-1 rounded-xl ${theme ? '' : 'border-2 border-dashed'} ${large ? 'aspect-4/3' : ''}`}
          style={{
            height: large ? undefined : 100,
            ...(theme
              ? { background: `linear-gradient(135deg, ${theme.start}, ${theme.end})`, color: 'rgba(255,255,255,0.9)' }
              : {
                  backgroundColor: dark ? 'var(--tm-subtle)' : '#FAFBFA',
                  borderColor: 'var(--tm-border-i)',
                  color: dark ? 'var(--tm-text-3)' : '#9CA3AF',
                }),
          }}
        >
          <ImagePlus size={large ? 40 : 26} />
          <span className={large ? 'text-sm' : 'text-xs'}>{t.addPhoto}</span>
        </button>
      )}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
    </div>
  )
}
