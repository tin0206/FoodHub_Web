'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { signup, resendSignupOtp, verifySignupOtp, loginWithGoogle, FieldError, getPostSignupPath } from '@/lib/auth'
import { requestGoogleAccessToken } from '@/lib/google-auth'
import { ChefHat, Mail, Lock, User, Check, X, KeyRound, ArrowLeft } from 'lucide-react'
import { AuthField, AuthPrimaryButton, AuthDivider, AuthSocialButton } from '@/components/auth/auth-widgets'
import { isPasswordValid } from '@/components/auth/password-requirements'
import { authDisplay, authSans } from '../auth-fonts'
import '../auth.css'

const NAME_PATTERN = /^[a-zA-ZÀ-ỹ\s'-]+$/
const EMAIL_PATTERN = /^[\w.+-]+@[\w-]+(\.[\w-]+)*\.[a-zA-Z]{2,}$/

type Errors = { name: string; email: string; password: string; confirmPassword: string }

function Requirement({ met, label }: { met: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-[11.5px]" style={{ color: met ? "#059669" : "var(--tm-text-3)" }}>
      {met ? <Check size={12} /> : <X size={12} />}
      {label}
    </div>
  )
}

// Always English, independent of the app's language setting — a brand-new visitor
// hasn't chosen a language yet, and shouldn't inherit whatever an earlier session
// on this browser left in localStorage (unlike the rest of this English-only page).
function SignupPasswordRequirements({ password }: { password: string }) {
  if (!password) return null
  const hasLength = password.length >= 6
  const hasLetter = /[a-zA-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  return (
    <div className="mt-2 space-y-1">
      <Requirement met={hasLength} label="At least 6 characters" />
      <Requirement met={hasLetter} label="Contains a letter" />
      <Requirement met={hasNumber} label="Contains a number" />
    </div>
  )
}

function browserLanguage(): string {
  if (typeof navigator === 'undefined') return 'en'
  return navigator.language.toLowerCase().startsWith('vi') ? 'vi' : 'en'
}

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState('')
  const [awaitingOtp, setAwaitingOtp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [authError, setAuthError] = useState('')
  const [errors, setErrors] = useState<Errors>({ name: '', email: '', password: '', confirmPassword: '' })

  function getNameError(val = name) {
    const trimmed = val.trim()
    if (!trimmed) return 'Please enter your full name.'
    if (trimmed.length < 2) return 'Name must be at least 2 characters.'
    if (trimmed.length > 50) return 'Name must be under 50 characters.'
    if (!NAME_PATTERN.test(trimmed)) return 'Name can only contain letters and spaces.'
    return ''
  }

  function getEmailError(val = email) {
    const trimmed = val.trim()
    if (!trimmed) return 'Please enter your email.'
    if (!EMAIL_PATTERN.test(trimmed)) return 'Please enter a valid email address.'
    return ''
  }

  function getPasswordError(val = password) {
    if (!val) return 'Please enter your password.'
    if (!isPasswordValid(val)) return 'Password must be at least 6 characters and contain a letter and a number.'
    return ''
  }

  function getConfirmPasswordError(val = confirmPassword, pwd = password) {
    if (!val) return 'Please confirm your password.'
    if (val !== pwd) return 'Passwords do not match.'
    return ''
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const nameValue = name.trim()
    const emailValue = email.trim()
    const passwordValue = password

    const nameErr = getNameError(nameValue)
    const emailErr = getEmailError(emailValue)
    const passwordErr = getPasswordError(passwordValue)
    const confirmPasswordErr = getConfirmPasswordError(confirmPassword, passwordValue)
    setErrors({ name: nameErr, email: emailErr, password: passwordErr, confirmPassword: confirmPasswordErr })
    if (nameErr || emailErr || passwordErr || confirmPasswordErr) return

    try {
      setLoading(true)
      setAuthError('')
      const result = await signup({
        name: nameValue,
        email: emailValue,
        password: passwordValue,
        language: browserLanguage(),
      })
      setOtp(result.otp ?? '')
      setAwaitingOtp(true)
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

  async function handleVerifyOtp(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const code = otp.replace(/\s/g, '')
    const codeErr = /^\d{6}$/.test(code) ? '' : 'Enter the 6-digit code from your email.'
    setOtpError(codeErr)
    if (codeErr) return
    try {
      setLoading(true)
      setAuthError('')
      const user = await verifySignupOtp({ email: email.trim(), otp: code })
      router.replace(getPostSignupPath(user))
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Unable to verify code.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResendOtp() {
    try {
      setResending(true)
      setAuthError('')
      const result = await resendSignupOtp(email.trim())
      if (result.otp) setOtp(result.otp)
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Unable to send verification code.')
    } finally {
      setResending(false)
    }
  }

  async function handleGoogleSignUp() {
    if (loading || googleLoading) return
    try {
      setGoogleLoading(true)
      setAuthError('')
      const accessToken = await requestGoogleAccessToken()
      const user = await loginWithGoogle(accessToken)
      router.replace(getPostSignupPath(user))
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Google sign-up failed.')
    } finally {
      setGoogleLoading(false)
    }
  }

  const isLoading = loading || googleLoading

  return (
    <div className={`${authDisplay.variable} ${authSans.variable} auth-root`}>
      <Link href="/" className="auth-brand">
        <ChefHat size={22} color="#059669" />
        <span>FoodHub</span>
      </Link>

      <div className="auth-card">
        <h1 className="auth-heading">{awaitingOtp ? 'Verify your email' : 'Create account'}</h1>
        <p className="auth-sub">
          {awaitingOtp
            ? `Enter the 6-digit code sent to ${email.trim()}`
            : 'Start your healthier eating journey'}
        </p>

        {!awaitingOtp && (
          <>
            <AuthSocialButton label="Sign up with Google" onClick={handleGoogleSignUp} loading={googleLoading} disabled={isLoading} />
            <AuthDivider />
          </>
        )}

        {awaitingOtp ? (
          <form onSubmit={handleVerifyOtp} noValidate className="auth-form">
            {authError && <p className="auth-error-banner">{authError}</p>}
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
                if (otpError) setOtpError('')
              }}
              placeholder="000000"
              error={otpError}
            />
            <AuthPrimaryButton label="Verify email" loading={loading} disabled={loading} />
            <button
              type="button"
              className="auth-back-link"
              onClick={handleResendOtp}
              disabled={resending}
              style={{ background: 'none', border: 'none', cursor: resending ? 'default' : 'pointer' }}
            >
              {resending ? 'Sending…' : "Didn't get a code? Resend"}
            </button>
            <button
              type="button"
              className="auth-back-link"
              onClick={() => {
                setAwaitingOtp(false)
                setOtp('')
                setAuthError('')
              }}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <ArrowLeft size={15} />
              Back to sign up
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="auth-form">
          {authError && <p className="auth-error-banner">{authError}</p>}

          <AuthField
            label="Full name"
            icon={User}
            type="text"
            value={name}
            onChange={e => {
              setName(e.target.value)
              if (errors.name) setErrors(prev => ({ ...prev, name: getNameError(e.target.value) }))
            }}
            onBlur={() => setErrors(prev => ({ ...prev, name: getNameError() }))}
            placeholder="John Doe"
            error={errors.name}
          />

          <AuthField
            label="Email address"
            icon={Mail}
            type="email"
            value={email}
            onChange={e => {
              setEmail(e.target.value)
              if (errors.email) setErrors(prev => ({ ...prev, email: getEmailError(e.target.value) }))
            }}
            onBlur={() => setErrors(prev => ({ ...prev, email: getEmailError() }))}
            placeholder="you@example.com"
            error={errors.email}
          />

          <div>
            <AuthField
              label="Password"
              icon={Lock}
              isPassword
              value={password}
              onChange={e => {
                setPassword(e.target.value)
                if (errors.password) setErrors(prev => ({ ...prev, password: getPasswordError(e.target.value) }))
                if (confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: getConfirmPasswordError(confirmPassword, e.target.value) }))
              }}
              onBlur={() => setErrors(prev => ({ ...prev, password: getPasswordError() }))}
              placeholder="••••••••"
              error={errors.password}
            />
            <SignupPasswordRequirements password={password} />
          </div>

          <AuthField
            label="Confirm password"
            icon={Lock}
            isPassword
            value={confirmPassword}
            onChange={e => {
              setConfirmPassword(e.target.value)
              setErrors(prev => ({ ...prev, confirmPassword: getConfirmPasswordError(e.target.value) }))
            }}
            onBlur={() => setErrors(prev => ({ ...prev, confirmPassword: getConfirmPasswordError() }))}
            placeholder="••••••••"
            error={errors.confirmPassword}
          />

          <AuthPrimaryButton label="Create account" loading={loading} disabled={isLoading} />
        </form>
        )}

        <p className="auth-switch">
          Already have an account?{' '}
          <Link href="/login" className="auth-link">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
