'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ChefHat, ArrowLeft, MailCheck } from 'lucide-react'

function MailIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7" />
    </svg>
  )
}

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  function validateEmail() {
    if (!email.trim()) return 'Please enter your email.'
    if (!isValidEmail(email)) return 'Please enter a valid email.'
    return ''
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    const err = validateEmail()
    if (err) { setEmailError(err); return }
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 800))
    setLoading(false)
    setEmailSent(true)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ backgroundColor: '#F3F4F6' }}>
      <div className="w-full max-w-90">

        <div className="flex items-center justify-center gap-2 mb-5">
          <ChefHat size={28} color="#059669" />
          <span className="text-[17px] font-bold" style={{ color: '#0F172A' }}>FoodHub</span>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-xl font-bold mb-2" style={{ color: '#0F172A' }}>Forgot password?</h1>
          <p className="text-sm" style={{ color: '#475569' }}>
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>

        <div className="bg-white p-5 rounded-[14px] border" style={{ borderColor: '#D1D5DB' }}>
          {emailSent ? (
            /* Success state */
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3.5" style={{ backgroundColor: '#D1FAE5' }}>
                <MailCheck size={28} color="#059669" />
              </div>
              <p className="text-base font-bold mb-1.5" style={{ color: '#0F172A' }}>
                Check your inbox
              </p>
              <p className="text-[13px] mb-5" style={{ color: '#475569' }}>
                We sent a reset link to<br />{email}
              </p>
              <Link
                href="/login"
                className="w-full h-12 flex items-center justify-center text-white text-base font-semibold rounded-lg"
                style={{ backgroundColor: '#059669' }}
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              {/* Email */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2" style={{ color: '#0F172A' }}>
                  Email address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none" style={{ color: emailError ? '#f87171' : '#9ca3af' }}>
                    <MailIcon />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); if (emailError) setEmailError('') }}
                    onBlur={() => setEmailError(validateEmail())}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-3 py-2.5 border rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ borderColor: emailError ? '#f87171' : '#D1D5DB', '--tw-ring-color': '#059669' } as React.CSSProperties}
                  />
                </div>
                {emailError && <p className="mt-1.5 text-xs text-red-500">{emailError}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-white text-base font-semibold rounded-lg transition-opacity disabled:opacity-60 disabled:cursor-not-allowed mb-2.5"
                style={{ backgroundColor: '#059669' }}
              >
                {loading ? 'Sending…' : 'Send reset link'}
              </button>

              {/* Back to sign in — Link instead of button */}
              <div className="flex items-center justify-center">
                <Link
                  href="/login"
                  className="flex items-center gap-1 text-sm font-medium hover:underline"
                  style={{ color: '#059669' }}
                >
                  <ArrowLeft size={16} />
                  Back to sign in
                </Link>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  )
}
