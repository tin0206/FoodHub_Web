export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

export interface SignupCredentials {
  name: string
  email: string
  password: string
}

export interface CurrentUser {
  id: string
  name: string
  email: string
}

export class FieldError extends Error {
  constructor(public field: string, message: string) {
    super(message)
    this.name = 'FieldError'
  }
}

interface StoredUser {
  id: string
  name: string
  email: string
  password: string
}

function getStoredUsers(): StoredUser[] {
  try {
    return JSON.parse(localStorage.getItem('fh_users') ?? '[]')
  } catch {
    return []
  }
}

export async function login({ email, password }: LoginCredentials): Promise<void> {
  const users = getStoredUsers()
  const byEmail = users.find(u => u.email === email)
  if (!byEmail) {
    throw new FieldError('email', 'No account found with this email. Please sign up.')
  }
  if (byEmail.password !== password) {
    throw new FieldError('password', 'Incorrect password. Please try again.')
  }
  const current: CurrentUser = { id: byEmail.id, name: byEmail.name, email: byEmail.email }
  localStorage.setItem('fh_current_user', JSON.stringify(current))
}

export async function signup({ name, email, password }: SignupCredentials): Promise<void> {
  const users = getStoredUsers()
  if (users.some(u => u.email === email)) {
    throw new FieldError('email', 'An account with this email already exists.')
  }
  const newUser: StoredUser = {
    id: crypto.randomUUID(),
    name,
    email,
    password,
  }
  localStorage.setItem('fh_users', JSON.stringify([...users, newUser]))
  const current: CurrentUser = { id: newUser.id, name: newUser.name, email: newUser.email }
  localStorage.setItem('fh_current_user', JSON.stringify(current))
}

export function getCurrentUser(): CurrentUser | null {
  if (typeof window === 'undefined') return null
  try {
    return JSON.parse(localStorage.getItem('fh_current_user') ?? 'null')
  } catch {
    return null
  }
}

export function logout(): void {
  localStorage.removeItem('fh_current_user')
}
