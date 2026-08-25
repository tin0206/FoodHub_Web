'use client'

import Link from 'next/link'
import { Suspense, useState } from 'react'
import type { FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, ChefHat, Lock, CheckCircle2 } from 'lucide-react'
import { resetPassword } from '@/lib/auth'
import { AuthField, AuthPrimaryButton } from '@/components/auth/auth-widgets'
import { PasswordRequirements, isPasswordValid } from '@/components/auth/password-requirements'
import { authDisplay, authSans } from '../auth-fonts'
import '../auth.css'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') ?? ''
  const token = searchParams.get('token') ?? ''
  const from = searchParams.get('from')

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [confirmError, setConfirmError] = useState('')
  const [authError, setAuthError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  if (!email || !token) {
    return (
      <div className="auth-card">
        <h1 className="auth-heading">Invalid link</h1>
        <p className="auth-sub">This password reset link is invalid or has expired.</p>
        <Link href="/forgot-password" className="auth-btn-primary" style={{ textDecoration: 'none', display: 'block', textAlign: 'center' }}>
          Request a new link
        </Link>
      </div>
    )
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const pwErr = isPasswordValid(password) ? '' : 'Password must be at least 6 characters and contain a letter and a number.'
    const confirmErr = password !== confirm ? 'Passwords do not match.' : ''
    setPasswordError(pwErr)
    setConfirmError(confirmErr)
    if (pwErr || confirmErr) return

    try {
      setLoading(true)
      setAuthError('')
      await resetPassword({ email, token, newPassword: password })
      setDone(true)
      setTimeout(() => {
        router.replace(from === 'profile' ? '/profile' : '/login')
      }, 1200)
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Unable to reset password.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="auth-card">
        <div className="auth-success">
          <div className="auth-success-icon">
            <CheckCircle2 size={28} color="white" />
          </div>
          <h2>Password reset</h2>
          <p>Your password has been updated.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-card">
      <h1 className="auth-heading">Reset password</h1>
      <p className="auth-sub">Enter a new password for your account.</p>

      <form onSubmit={handleSubmit} noValidate className="auth-form">
        {authError && <p className="auth-error-banner">{authError}</p>}

        <div>
          <AuthField
            label="New password"
            icon={Lock}
            isPassword
            value={password}
            onChange={e => {
              setPassword(e.target.value)
              if (passwordError) setPasswordError('')
            }}
            placeholder="••••••••"
            error={passwordError}
          />
          <PasswordRequirements password={password} />
        </div>

        <AuthField
          label="Confirm new password"
          icon={Lock}
          isPassword
          value={confirm}
          onChange={e => {
            setConfirm(e.target.value)
            if (confirmError) setConfirmError('')
          }}
          placeholder="••••••••"
          error={confirmError}
        />

        <AuthPrimaryButton label="Reset password" loading={loading} disabled={loading} />
      </form>

      {from !== 'profile' && (
        <Link href="/login" className="auth-back-link">
          <ArrowLeft size={15} />
          Back to sign in
        </Link>
      )}
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className={`${authDisplay.variable} ${authSans.variable} auth-root`}>
      <Link href="/" className="auth-brand">
        <ChefHat size={22} color="#059669" />
        <span>FoodHub</span>
      </Link>
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  )
}
