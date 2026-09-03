'use client'

import Link from 'next/link'
import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { FormEvent } from 'react'
import { verifySignupOtp, resendSignupOtp, getPostLoginPath } from '@/lib/auth'
import { ChefHat, KeyRound, ArrowLeft } from 'lucide-react'
import { AuthField, AuthPrimaryButton } from '@/components/auth/auth-widgets'
import { authDisplay, authSans } from '../auth-fonts'
import '../auth.css'

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailInner />
    </Suspense>
  )
}

function VerifyEmailInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const emailParam = searchParams.get('email') ?? ''
  const otpParam = searchParams.get('otp') ?? ''

  const [otp, setOtp] = useState(otpParam)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)

  async function handleVerify(e: FormEvent) {
    e.preventDefault()
    const code = otp.trim()
    if (code.length < 4) {
      setError('Please enter the verification code.')
      return
    }
    try {
      setLoading(true)
      setError('')
      const user = await verifySignupOtp({ email: emailParam, otp: code })
      router.replace(getPostLoginPath(user))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to verify code.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    try {
      setResending(true)
      setError('')
      const result = await resendSignupOtp(emailParam)
      if (result.otp) setOtp(result.otp)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to resend code.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className={`${authDisplay.variable} ${authSans.variable} auth-root`}>
      <Link href="/" className="auth-brand">
        <ChefHat size={22} color="#059669" />
        <span>FoodHub</span>
      </Link>

      <div className="auth-card">
        <h1 className="auth-heading">Verify your email</h1>
        <p className="auth-sub">
          Enter the 6-digit code sent to <strong>{emailParam}</strong>
        </p>

        <form onSubmit={handleVerify} noValidate className="auth-form">
          {error && <p className="auth-error-banner">{error}</p>}

          <AuthField
            label="Verification code"
            icon={KeyRound}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={otp}
            onChange={e => {
              setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
              if (error) setError('')
            }}
            placeholder="000000"
            error=""
          />

          <AuthPrimaryButton label="Verify email" loading={loading} disabled={loading} />

          <button
            type="button"
            className="auth-back-link"
            onClick={handleResend}
            disabled={resending}
            style={{ background: 'none', border: 'none', cursor: resending ? 'default' : 'pointer' }}
          >
            {resending ? 'Sending…' : "Didn't get a code? Resend"}
          </button>

          <Link href="/login" className="auth-back-link" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <ArrowLeft size={15} />
            Back to sign in
          </Link>
        </form>
      </div>
    </div>
  )
}
