import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api } from '../config/api.js'

const AuthContext = createContext(null)

const SESSION_KEY = 'mp_session'
const TOKEN_KEY = 'token'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // ── Initialise: restore authenticated session ────────────────────────────
  useEffect(() => {
    async function restoreSession() {
      try {
        const token = localStorage.getItem(TOKEN_KEY)

        if (!token) {
          localStorage.removeItem(SESSION_KEY)
          setLoading(false)
          return
        }

        const data = await api.get('/api/auth/me')

        if (data?.user) {
          localStorage.setItem(SESSION_KEY, JSON.stringify(data.user))
          setUser(data.user)
        } else {
          throw new Error('Invalid session')
        }
      } catch (error) {
        console.warn('Session restore failed:', error.message)
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(SESSION_KEY)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    restoreSession()
  }, [])

  // ── Login ────────────────────────────────────────────────────────────────
  const login = useCallback(async (username, password) => {
    const data = await api.post('/api/auth/login', {
      username,
      password,
    })

    if (!data?.token || !data?.user) {
      throw new Error('Invalid login response from server')
    }

    // Store JWT for authenticated API requests
    localStorage.setItem(TOKEN_KEY, data.token)

    // Store user session
    localStorage.setItem(SESSION_KEY, JSON.stringify(data.user))

    setUser(data.user)

    return data.user
  }, [])

  // ── Register ─────────────────────────────────────────────────────────────
  const register = useCallback(async (username, password, role) => {
    const data = await api.post('/api/auth/register', {
      username,
      password,
      role,
    })

    if (!data?.token || !data?.user) {
      throw new Error('Invalid registration response from server')
    }

    // Store JWT for authenticated API requests
    localStorage.setItem(TOKEN_KEY, data.token)

    // Store user session
    localStorage.setItem(SESSION_KEY, JSON.stringify(data.user))

    setUser(data.user)

    return data.user
  }, [])

  // ── Logout ───────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(SESSION_KEY)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {loading ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            background: 'var(--color-bg)',
          }}
        >
          <div
            className="spinner"
            style={{ width: 40, height: 40 }}
          />
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)

  if (!ctx) {
    throw new Error('useAuth must be used within <AuthProvider>')
  }

  return ctx
}