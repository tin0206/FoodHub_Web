'use client'

import type { ReactNode } from 'react'
import { useState, useEffect } from 'react'
import { User, Target, Bell, Palette } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { applyTheme } from '@/lib/theme'

interface ProfileData {
  fullName: string
  age: string
  weight: string
  primaryGoal: string
  dailyCalories: string
  targetProtein: string
  dietaryRestrictions: string[]
  notifyRecipes: boolean
  notifyUpdates: boolean
  notifyWeekly: boolean
  theme: 'light' | 'dark'
}

interface FieldErrors {
  age: string
  weight: string
  dailyCalories: string
  targetProtein: string
}

const PRIMARY_GOALS = ['Balanced Nutrition', 'Weight Loss', 'Muscle Gain', 'High Protein']
const DIETARY_OPTIONS = ['Dairy Free', 'Egg Free', 'Gluten Free', 'Nut Free', 'Vegan', 'Vegetarian', 'Pescetarian']

const DEFAULT_PROFILE: ProfileData = {
  fullName: '',
  age: '',
  weight: '',
  primaryGoal: 'Balanced Nutrition',
  dailyCalories: '2000',
  targetProtein: '120',
  dietaryRestrictions: [],
  notifyRecipes: true,
  notifyUpdates: true,
  notifyWeekly: false,
  theme: 'light',
}

const NO_ERRORS: FieldErrors = { age: '', weight: '', dailyCalories: '', targetProtein: '' }

function isPositiveNumber(v: string) {
  if (!v.trim()) return true // optional
  const n = Number(v)
  return !isNaN(n) && n > 0
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="relative w-10 h-6 rounded-full transition-colors shrink-0"
      style={{ backgroundColor: checked ? '#059669' : 'var(--tm-border-i)' }}
    >
      <span
        className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform"
        style={{ transform: checked ? 'translateX(16px)' : 'translateX(0)' }}
      />
    </button>
  )
}

function SectionCard({ children, icon, iconBg, title, subtitle }: {
  children: ReactNode
  icon: ReactNode
  iconBg: string
  title: string
  subtitle: string
}) {
  return (
    <div className="border rounded-xl p-5 mb-4" style={{ backgroundColor: 'var(--tm-surface)', borderColor: 'var(--tm-border)' }}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: iconBg }}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-bold" style={{ color: 'var(--tm-text)' }}>{title}</p>
          <p className="text-xs" style={{ color: 'var(--tm-text-3)' }}>{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

const inputCls = 'w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent'

export default function ProfilePage() {
  const [savedData, setSavedData] = useState<ProfileData>(DEFAULT_PROFILE)
  const [formData, setFormData] = useState<ProfileData>(DEFAULT_PROFILE)
  const [loaded, setLoaded] = useState(false)
  const [email, setEmail] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>(NO_ERRORS)

  // Apply theme live as user toggles
  useEffect(() => {
    applyTheme(formData.theme === 'dark')
  }, [formData.theme])

  useEffect(() => {
    const user = getCurrentUser()
    if (user) setEmail(user.email)
    try {
      const stored = localStorage.getItem('fh_profile')
      if (stored) {
        const parsed = JSON.parse(stored) as ProfileData
        setSavedData(parsed)
        setFormData({ ...parsed, fullName: parsed.fullName || user?.name || '' })
      } else {
        const init = { ...DEFAULT_PROFILE, fullName: user?.name ?? '' }
        setSavedData(init)
        setFormData(init)
      }
    } catch {
      const init = { ...DEFAULT_PROFILE, fullName: user?.name ?? '' }
      setSavedData(init)
      setFormData(init)
    }
    setLoaded(true)
  }, [])

  function set<K extends keyof ProfileData>(key: K, value: ProfileData[K]) {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  function clearError(field: keyof FieldErrors) {
    setFieldErrors(prev => ({ ...prev, [field]: '' }))
  }

  function toggleDietary(opt: string) {
    setFormData(prev => ({
      ...prev,
      dietaryRestrictions: prev.dietaryRestrictions.includes(opt)
        ? prev.dietaryRestrictions.filter(d => d !== opt)
        : [...prev.dietaryRestrictions, opt],
    }))
  }

  function handleSave() {
    const errors: FieldErrors = {
      age:           !isPositiveNumber(formData.age)           ? 'Please enter a valid positive number.' : '',
      weight:        !isPositiveNumber(formData.weight)        ? 'Please enter a valid positive number.' : '',
      dailyCalories: !isPositiveNumber(formData.dailyCalories) ? 'Please enter a valid positive number.' : '',
      targetProtein: !isPositiveNumber(formData.targetProtein) ? 'Please enter a valid positive number.' : '',
    }
    setFieldErrors(errors)
    if (Object.values(errors).some(Boolean)) return

    localStorage.setItem('fh_profile', JSON.stringify(formData))
    setSavedData(formData)
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 1500)
  }

  function handleCancel() {
    setFormData(savedData)
    setFieldErrors(NO_ERRORS)
  }

  const isDirty = JSON.stringify(formData) !== JSON.stringify(savedData)

  if (!loaded) return null

  const inputStyle = { borderColor: 'var(--tm-border-i)', color: 'var(--tm-text)', backgroundColor: 'var(--tm-surface)' }
  const labelStyle = { color: 'var(--tm-text-2)' }
  const errStyle = { color: '#f87171' }

  return (
    <div className="h-full overflow-y-auto" style={{ backgroundColor: 'var(--tm-bg)' }}>
      <div className="p-4 md:p-6 pb-28">
        <h1 className="text-xl font-bold mb-0.5" style={{ color: 'var(--tm-text)' }}>Profile Settings</h1>
        <p className="text-sm mb-5" style={{ color: 'var(--tm-text-2)' }}>Manage your account and nutrition preferences</p>

        {/* Appearance */}
        <SectionCard icon={<Palette size={18} color="#7C3AED" />} iconBg="#EDE9FE" title="Appearance" subtitle="Theme & display preferences">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--tm-text-2)' }}>Theme</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--tm-text-3)' }}>
                {formData.theme === 'dark' ? 'Dark mode active' : 'Light mode active'}
              </p>
            </div>
            <Toggle checked={formData.theme === 'dark'} onChange={v => set('theme', v ? 'dark' : 'light')} />
          </div>
        </SectionCard>

        {/* Personal Information */}
        <SectionCard icon={<User size={18} color="#059669" />} iconBg="#ECFDF5" title="Personal Information" subtitle="Update your profile details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={labelStyle}>Full Name</label>
              <input value={formData.fullName} onChange={e => set('fullName', e.target.value)} className={inputCls} style={inputStyle} placeholder="John Doe" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={labelStyle}>Email</label>
              <input value={email} readOnly className={inputCls} style={{ ...inputStyle, backgroundColor: 'var(--tm-subtle)', color: 'var(--tm-text-3)' }} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={labelStyle}>Age</label>
              <input
                type="text"
                value={formData.age}
                onChange={e => { set('age', e.target.value); clearError('age') }}
                className={inputCls}
                style={{ ...inputStyle, borderColor: fieldErrors.age ? '#f87171' : 'var(--tm-border-i)' }}
                placeholder="28"
              />
              {fieldErrors.age && <p className="mt-1 text-xs" style={errStyle}>{fieldErrors.age}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={labelStyle}>Weight (kg)</label>
              <input
                type="text"
                value={formData.weight}
                onChange={e => { set('weight', e.target.value); clearError('weight') }}
                className={inputCls}
                style={{ ...inputStyle, borderColor: fieldErrors.weight ? '#f87171' : 'var(--tm-border-i)' }}
                placeholder="75"
              />
              {fieldErrors.weight && <p className="mt-1 text-xs" style={errStyle}>{fieldErrors.weight}</p>}
            </div>
          </div>
        </SectionCard>

        {/* Nutrition Goals */}
        <SectionCard icon={<Target size={18} color="#7C3AED" />} iconBg="#EDE9FE" title="Nutrition Goals" subtitle="Set your dietary objectives">
          <div className="mb-4">
            <p className="text-xs font-medium mb-2" style={labelStyle}>Primary Goal</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRIMARY_GOALS.map(goal => {
                const active = formData.primaryGoal === goal
                return (
                  <button
                    key={goal}
                    onClick={() => set('primaryGoal', goal)}
                    className="py-2.5 px-3 rounded-lg border text-sm text-left transition-colors"
                    style={{
                      backgroundColor: active ? '#ECFDF5' : 'var(--tm-surface)',
                      borderColor: active ? '#059669' : 'var(--tm-border)',
                      color: active ? '#059669' : 'var(--tm-text-2)',
                      fontWeight: active ? 500 : 400,
                    }}
                  >
                    {goal}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={labelStyle}>Daily Calorie Target</label>
              <input
                type="text"
                value={formData.dailyCalories}
                onChange={e => { set('dailyCalories', e.target.value); clearError('dailyCalories') }}
                className={inputCls}
                style={{ ...inputStyle, borderColor: fieldErrors.dailyCalories ? '#f87171' : 'var(--tm-border-i)' }}
                placeholder="2000"
              />
              {fieldErrors.dailyCalories && <p className="mt-1 text-xs" style={errStyle}>{fieldErrors.dailyCalories}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={labelStyle}>Target Protein (g/day)</label>
              <input
                type="text"
                value={formData.targetProtein}
                onChange={e => { set('targetProtein', e.target.value); clearError('targetProtein') }}
                className={inputCls}
                style={{ ...inputStyle, borderColor: fieldErrors.targetProtein ? '#f87171' : 'var(--tm-border-i)' }}
                placeholder="120"
              />
              {fieldErrors.targetProtein && <p className="mt-1 text-xs" style={errStyle}>{fieldErrors.targetProtein}</p>}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium mb-2" style={labelStyle}>Dietary Restrictions</p>
            <div className="flex flex-wrap gap-2">
              {DIETARY_OPTIONS.map(opt => {
                const active = formData.dietaryRestrictions.includes(opt)
                return (
                  <button
                    key={opt}
                    onClick={() => toggleDietary(opt)}
                    className="text-xs px-3 py-1.5 rounded-lg border transition-colors"
                    style={{
                      backgroundColor: active ? '#ECFDF5' : 'var(--tm-surface)',
                      borderColor: active ? '#059669' : 'var(--tm-border)',
                      color: active ? '#059669' : 'var(--tm-text-2)',
                    }}
                  >
                    {opt}
                  </button>
                )
              })}
            </div>
          </div>
        </SectionCard>

        {/* Notifications */}
        <SectionCard icon={<Bell size={18} color="#2563EB" />} iconBg="#DBEAFE" title="Notifications" subtitle="Manage your notification preferences">
          <div className="space-y-4">
            {(
              [
                ['notifyRecipes', 'Recipe recommendations'],
                ['notifyUpdates', 'New features & updates'],
                ['notifyWeekly', 'Weekly nutrition summary'],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between">
                <p className="text-sm" style={{ color: 'var(--tm-text-2)' }}>{label}</p>
                <Toggle checked={formData[key] as boolean} onChange={v => set(key, v)} />
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Sticky save bar */}
      <div className="sticky bottom-0 border-t px-4 py-3 flex gap-3" style={{ backgroundColor: 'var(--tm-surface)', borderColor: 'var(--tm-border)' }}>
        <button
          onClick={handleCancel}
          disabled={!isDirty}
          className="flex-1 py-2.5 border rounded-lg text-sm font-medium transition-opacity disabled:opacity-40"
          style={{ borderColor: 'var(--tm-border)', color: 'var(--tm-text-2)' }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!isDirty}
          className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-40"
          style={{ backgroundColor: saveSuccess ? '#10B981' : '#059669' }}
        >
          {saveSuccess ? 'Saved!' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}
