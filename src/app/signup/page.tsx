'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { signup, FieldError } from '@/lib/auth'
import { ChefHat } from 'lucide-react'

function UserIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M20 21a8 8 0 10-16 0" />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  )
}

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())

type Errors = { name: string; email: string; password: string }

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  // tracks whether user has typed anything in the password field (for live check)
  const [passwordTouched, setPasswordTouched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [authError, setAuthError] = useState('')
  const [errors, setErrors] = useState<Errors>({ name: '', email: '', password: '' })

  function getNameError(val = name) {
    if (!val.trim()) return 'Please enter your full name.'
    return ''
  }

  function getEmailError(val = email) {
    if (!val.trim()) return 'Please enter your email.'
    if (!isValidEmail(val)) return 'Please enter a valid email.'
    return ''
  }

  function getPasswordError(val = password) {
    if (!val) return 'Please enter your password.'
    if (val.length < 6) return 'Password must be at least 6 characters.'
    return ''
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const nameValue = name.trim()
    const emailValue = email.trim()
    const passwordValue = password

    const nameErr = getNameError(nameValue)
    const emailErr = getEmailError(emailValue)
    const passwordErr = passwordTouched ? '' : getPasswordError(passwordValue)
    setErrors({ name: nameErr, email: emailErr, password: passwordErr })
    if (nameErr || emailErr || passwordErr || (passwordTouched && passwordValue.length < 6)) return

    try {
      setLoading(true)
      setAuthError('')
      await signup({ name: nameValue, email: emailValue, password: passwordValue })
      router.replace('/')
    } catch (err: unknown) {
      if (err instanceof FieldError) {
        setErrors(prev => ({ ...prev, [err.field]: err.message }))
      } else {
        setAuthError(err instanceof Error ? err.message : 'Sign up failed')
      }
    } finally {
      setLoading(false)
    }
  }

  function inputBorder(hasError: boolean) {
    return hasError ? '#f87171' : '#D1D5DB'
  }

  function iconColor(hasError: boolean) {
    return hasError ? '#f87171' : '#9ca3af'
  }

  const passwordOk = password.length >= 6

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ backgroundColor: '#F3F4F6' }}>
      <div className="w-full max-w-90">

        <div className="flex items-center justify-center gap-2 mb-5">
          <ChefHat size={32} color="#059669" />
          <span className="text-[17px] font-bold" style={{ color: '#0F172A' }}>FoodHub</span>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-xl font-bold mb-2" style={{ color: '#0F172A' }}>Create your account</h1>
          <p className="text-base" style={{ color: '#475569' }}>Start your journey to healthier eating</p>
        </div>

        <div className="bg-white p-5 rounded-[14px] border" style={{ borderColor: '#D1D5DB' }}>
          <form onSubmit={handleSubmit} noValidate>
            {authError && (
              <p className="text-red-400 text-sm text-center mb-4">{authError}</p>
            )}

            {/* Full name */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" style={{ color: '#0F172A' }}>
                Full name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none" style={{ color: iconColor(!!errors.name) }}>
                  <UserIcon />
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={e => {
                    setName(e.target.value)
                    if (errors.name) setErrors(prev => ({ ...prev, name: getNameError(e.target.value) }))
                  }}
                  onBlur={() => setErrors(prev => ({ ...prev, name: getNameError() }))}
                  placeholder="John Doe"
                  className="w-full pl-10 pr-3 py-2.5 border rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                  style={{ borderColor: inputBorder(!!errors.name) }}
                />
              </div>
              {errors.name && (
                <p className="mt-1.5 text-xs" style={{ color: '#f87171' }}>{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" style={{ color: '#0F172A' }}>
                Email address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none" style={{ color: iconColor(!!errors.email) }}>
                  <MailIcon />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value)
                    if (errors.email) setErrors(prev => ({ ...prev, email: getEmailError(e.target.value) }))
                  }}
                  onBlur={() => setErrors(prev => ({ ...prev, email: getEmailError() }))}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-3 py-2.5 border rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                  style={{ borderColor: inputBorder(!!errors.email) }}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs" style={{ color: '#f87171' }}>{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="mb-5">
              <label className="block text-sm font-medium mb-2" style={{ color: '#0F172A' }}>
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none" style={{ color: iconColor(!!errors.password || (passwordTouched && !passwordOk)) }}>
                  <LockIcon />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value)
                    setPasswordTouched(true)
                    if (errors.password) setErrors(prev => ({ ...prev, password: '' }))
                  }}
                  onBlur={() => {
                    if (!passwordTouched) return
                    // live check covers validation when touched; only clear submit-triggered error
                    setErrors(prev => ({ ...prev, password: '' }))
                  }}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-2.5 border rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                  style={{ borderColor: inputBorder(!!errors.password || (passwordTouched && !passwordOk)) }}
                />
              </div>

              {/* Live check: shown once user starts typing */}
              {passwordTouched && (
                <p className="mt-1.5 text-xs" style={{ color: passwordOk ? '#059669' : '#f87171' }}>
                  {passwordOk ? '✓' : '✗'} At least 6 characters
                </p>
              )}

              {/* Error for empty password when never touched */}
              {errors.password && !passwordTouched && (
                <p className="mt-1.5 text-xs" style={{ color: '#f87171' }}>{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 text-white text-base font-semibold rounded-lg transition-opacity disabled:opacity-60 disabled:cursor-not-allowed mb-2.5"
              style={{ backgroundColor: '#059669' }}
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>

            <div className="flex items-center justify-center gap-1 text-[15px]">
              <span style={{ color: '#475569' }}>Already have an account?</span>
              <Link href="/login" className="font-medium hover:underline" style={{ color: '#059669' }}>
                Sign in
              </Link>
            </div>
          </form>
        </div>

      </div>
    </div>
  )
}
