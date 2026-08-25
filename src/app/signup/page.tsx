'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { signup, loginWithGoogle, FieldError, getPostLoginPath } from '@/lib/auth'
import { requestGoogleAccessToken } from '@/lib/google-auth'
import { ChefHat, Mail, Lock, User } from 'lucide-react'
import { AuthField, AuthPrimaryButton, AuthDivider, AuthSocialButton } from '@/components/auth/auth-widgets'
import { authDisplay, authSans } from '../auth-fonts'
import '../auth.css'

const NAME_PATTERN = /^[a-zA-ZÀ-ỹ\s'-]+$/
const EMAIL_PATTERN = /^[\w.+-]+@[\w-]+(\.[\w-]+)*\.[a-zA-Z]{2,}$/

type Errors = { name: string; email: string; password: string }

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [authError, setAuthError] = useState('')
  const [errors, setErrors] = useState<Errors>({ name: '', email: '', password: '' })

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
    const passwordErr = getPasswordError(passwordValue)
    setErrors({ name: nameErr, email: emailErr, password: passwordErr })
    if (nameErr || emailErr || passwordErr) return

    try {
      setLoading(true)
      setAuthError('')
      const user = await signup({ name: nameValue, email: emailValue, password: passwordValue })
      router.replace(getPostLoginPath(user))
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

  async function handleGoogleSignUp() {
    if (loading || googleLoading) return
    try {
      setGoogleLoading(true)
      setAuthError('')
      const accessToken = await requestGoogleAccessToken()
      const user = await loginWithGoogle(accessToken)
      router.replace(getPostLoginPath(user))
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
        <h1 className="auth-heading">Create account</h1>
        <p className="auth-sub">Start your healthier eating journey</p>

        <AuthSocialButton label="Sign up with Google" onClick={handleGoogleSignUp} loading={googleLoading} disabled={isLoading} />
        <AuthDivider />

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

          <AuthField
            label="Password"
            icon={Lock}
            isPassword
            value={password}
            onChange={e => {
              setPassword(e.target.value)
              if (errors.password) setErrors(prev => ({ ...prev, password: getPasswordError(e.target.value) }))
            }}
            onBlur={() => setErrors(prev => ({ ...prev, password: getPasswordError() }))}
            placeholder="••••••••"
            error={errors.password}
          />

          <AuthPrimaryButton label="Create account" loading={loading} disabled={isLoading} />
        </form>

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
