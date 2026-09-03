'use client'

import Link from 'next/link'
import { Suspense, useState } from 'react'
import type { FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, ChefHat, KeyRound, Lock, CheckCircle2 } from 'lucide-react'
import { forgotPassword, resetPassword } from '@/lib/auth'
import { AuthField, AuthPrimaryButton } from '@/components/auth/auth-widgets'
import { PasswordRequirements, isPasswordValid } from '@/components/auth/password-requirements'
import { authDisplay, authSans } from '../auth-fonts'
import '../auth.css'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') ?? ''
  const from = searchParams.get('from')

  const [otp, setOtp] = useState(searchParams.get('otp') ?? '')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [otpError, setOtpError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [confirmError, setConfirmError] = useState('')
  const [authError, setAuthError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [done, setDone] = useState(false)

  if (!email) {
    return (
      <div className="auth-card">
        <h1 className="auth-heading">Missing email</h1>
        <p className="auth-sub">Request a new code to reset your password.</p>
        <Link href="/forgot-password" className="auth-btn-primary" style={{ textDecoration: 'none', display: 'block', textAlign: 'center' }}>
          Request a new code
        </Link>
      </div>
    )
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const code = otp.replace(/\s/g, '')
    const codeErr = /^\d{6}$/.test(code) ? '' : 'Enter the 6-digit code from your email.'
    const pwErr = isPasswordValid(password) ? '' : 'Password must be at least 6 characters and contain a letter and a number.'
    const confirmErr = password !== confirm ? 'Passwords do not match.' : ''
    setOtpError(codeErr)
    setPasswordError(pwErr)
    setConfirmError(confirmErr)
    if (codeErr || pwErr || confirmErr) return

    try {
      setLoading(true)
      setAuthError('')
      await resetPassword({ email, otp: code, newPassword: password })
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

  async function handleResend() {
    try {
      setResending(true)
      setAuthError('')
      const result = await forgotPassword(email)
      if (result.otp) setOtp(result.otp)
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Unable to send reset code.')
    } finally {
      setResending(false)
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
      <p className="auth-sub">Enter the 6-digit code sent to {email} and choose a new password.</p>

      <form onSubmit={handleSubmit} noValidate className="auth-form">
        {authError && <p className="auth-error-banner">{authError}</p>}

        <AuthField
          label="Reset code"
          icon={KeyRound}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={otp}
          onChange={e => {
            setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
            if (otpError) setOtpError('')
          }}
          placeholder="000000"
          error={otpError}
        />

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

      <button
        type="button"
        className="auth-back-link"
        onClick={handleResend}
        disabled={resending}
        style={{ background: 'none', border: 'none', cursor: resending ? 'default' : 'pointer' }}
      >
        {resending ? 'Sending…' : "Didn't get a code? Resend"}
      </button>

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
