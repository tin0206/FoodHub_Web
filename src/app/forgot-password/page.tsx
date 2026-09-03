'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ChefHat, Mail } from 'lucide-react'
import { forgotPassword } from '@/lib/auth'
import { AuthField, AuthPrimaryButton } from '@/components/auth/auth-widgets'
import { authDisplay, authSans } from '../auth-fonts'
import '../auth.css'

const isValidEmail = (v: string) => v.includes('@')

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [authError, setAuthError] = useState('')
  const [loading, setLoading] = useState(false)

  function validateEmail() {
    if (!email.trim()) return 'Please enter your email.'
    if (!isValidEmail(email)) return 'Please enter a valid email.'
    return ''
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const err = validateEmail()
    setEmailError(err)
    if (err) return

    try {
      setLoading(true)
      setAuthError('')
      const trimmedEmail = email.trim()
      const result = await forgotPassword(trimmedEmail)
      const params = new URLSearchParams({ email: trimmedEmail })
      if (result.otp) params.set('otp', result.otp)
      router.push(`/reset-password?${params.toString()}`)
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Unable to send reset code.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`${authDisplay.variable} ${authSans.variable} auth-root`}>
      <Link href="/" className="auth-brand">
        <ChefHat size={22} color="#059669" />
        <span>FoodHub</span>
      </Link>

      <div className="auth-card">
        <h1 className="auth-heading">Forgot password?</h1>
        <p className="auth-sub">Enter your email and we&apos;ll send a 6-digit code.</p>

        <form onSubmit={handleSubmit} noValidate className="auth-form">
          {authError && <p className="auth-error-banner">{authError}</p>}

          <AuthField
            label="Email address"
            icon={Mail}
            type="email"
            value={email}
            onChange={e => {
              setEmail(e.target.value)
              if (emailError) setEmailError('')
            }}
            onBlur={() => setEmailError(validateEmail())}
            placeholder="you@example.com"
            error={emailError}
          />

          <AuthPrimaryButton label="Send code" loading={loading} disabled={loading} />
        </form>

        <Link href="/login" className="auth-back-link">
          <ArrowLeft size={15} />
          Back to sign in
        </Link>
      </div>
    </div>
  )
}
