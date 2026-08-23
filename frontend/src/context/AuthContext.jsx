import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { Users, seedIfNeeded } from '../utils/db.js'

const AuthContext = createContext(null)

const SESSION_KEY = 'mp_session'

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  // ── Initialise: seed data, then restore session ──────────────────────────
  useEffect(() => {
    seedIfNeeded()
    try {
      const stored = localStorage.getItem(SESSION_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Re-validate user still exists
        const fresh = Users.findById(parsed.id)
        if (fresh) {
          const { password: _p, ...safe } = fresh
          setUser(safe)
        } else {
          localStorage.removeItem(SESSION_KEY)
        }
      }
    } catch {
      localStorage.removeItem(SESSION_KEY)
    }
    setLoading(false)
  }, [])

  // ── Login ────────────────────────────────────────────────────────────────
  const login = useCallback((username, password) => {
    const authenticated = Users.authenticate(username, password)
    if (!authenticated) throw new Error('Invalid username or password')
    localStorage.setItem(SESSION_KEY, JSON.stringify(authenticated))
    setUser(authenticated)
    return authenticated
  }, [])

  // ── Register ─────────────────────────────────────────────────────────────
  const register = useCallback((username, password, role) => {
    const created = Users.create({ username, password, role })
    const { password: _p, ...safe } = created
    localStorage.setItem(SESSION_KEY, JSON.stringify(safe))
    setUser(safe)
    return safe
  }, [])

  // ── Logout ───────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {loading
        ? (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: '100vh', background: 'var(--color-bg)'
          }}>
            <div className="spinner" style={{ width: 40, height: 40 }} />
          </div>
        )
        : children
      }
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
