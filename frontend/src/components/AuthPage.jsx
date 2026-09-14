import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { HeartPulse, Eye, EyeOff, ArrowLeft, UserCircle, Stethoscope } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

// ── Role selector card ────────────────────────────────────────────────────────
function RoleCard({ role, selected, onClick }) {
  const isDoctor = role === 'doctor'
  return (
    <button
      type="button"
      onClick={() => onClick(role)}
      style={{
        flex: 1,
        padding: '16px 12px',
        borderRadius: 'var(--radius-md)',
        border: selected
          ? '2px solid var(--color-primary)'
          : '2px solid var(--color-border)',
        background: selected ? 'var(--color-primary-light)' : 'var(--color-surface)',
        cursor: 'pointer',
        transition: 'all .18s',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        outline: 'none',
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: selected
          ? 'var(--color-primary)'
          : 'var(--color-bg-alt)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background .18s',
      }}>
        {isDoctor
          ? <Stethoscope size={22} color={selected ? '#fff' : 'var(--color-text-muted)'} />
          : <UserCircle   size={22} color={selected ? '#fff' : 'var(--color-text-muted)'} />
        }
      </div>
      <span style={{
        fontWeight: 700, fontSize: '.9375rem',
        color: selected ? 'var(--color-primary)' : 'var(--color-text)',
      }}>
        {isDoctor ? 'Doctor' : 'Patient'}
      </span>
      <span style={{ fontSize: '.78rem', color: 'var(--color-text-muted)', textAlign: 'center', lineHeight: 1.4 }}>
        {isDoctor ? 'Manage consultations' : 'Get health screening'}
      </span>
    </button>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AuthPage() {
  const navigate       = useNavigate()
  const [params]       = useSearchParams()
  const { login, register } = useAuth()

  const [mode, setMode]       = useState('login')     // 'login' | 'register'
  const [role, setRole]       = useState(params.get('role') || 'patient')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const [form, setForm] = useState({
    username: '', password: '', confirm: '',
  })

  useEffect(() => {
    const r = params.get('role')
    if (r === 'doctor' || r === 'patient') setRole(r)
  }, [params])

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

  function validate() {
    if (!form.username.trim()) return 'Username is required.'
    if (form.username.trim().length < 3) return 'Username must be at least 3 characters.'
    if (!form.password) return 'Password is required.'
    if (form.password.length < 6) return 'Password must be at least 6 characters.'
    if (mode === 'register' && form.password !== form.confirm) return 'Passwords do not match.'
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }

    setLoading(true)
    setError('')
    try {
      if (mode === 'login') {
  const user = await login(form.username.trim(), form.password)
  navigate(user.role === 'doctor' ? '/doctor' : '/patient', { replace: true })
} else {
  const user = await register(form.username.trim(), form.password, role)
  navigate(user.role === 'doctor' ? '/doctor' : '/patient', { replace: true })
}
    } catch (ex) {
      setError(ex.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #f0f7ff 0%, #f8fafc 60%, #f0fdf8 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      {/* Back to landing */}
      <button
        className="btn btn-ghost btn-sm"
        onClick={() => navigate('/')}
        style={{ marginBottom: 24, alignSelf: 'flex-start', maxWidth: 480, width: '100%' }}
      >
        <ArrowLeft size={16} /> Back to home
      </button>

      {/* Card */}
      <div className="card" style={{ width: '100%', maxWidth: 480, padding: 40 }}>

        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'var(--color-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(37,99,235,.4)',
            marginBottom: 12,
          }}>
            <HeartPulse size={28} color="#fff" />
          </div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.625rem' }}>
            MediPredict
          </h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: 4, fontSize: '.9375rem' }}>
            {mode === 'login' ? 'Sign in to your account' : 'Create your free account'}
          </p>
        </div>

        {/* Mode toggle */}
        <div style={{
          display: 'flex', background: 'var(--color-bg-alt)',
          borderRadius: 'var(--radius-md)', padding: 4, marginBottom: 28,
        }}>
          {['login', 'register'].map(m => (
            <button key={m} type="button" onClick={() => { setMode(m); setError('') }}
              style={{
                flex: 1, padding: '9px 0',
                borderRadius: 'var(--radius-sm)',
                border: 'none', cursor: 'pointer',
                fontWeight: 600, fontSize: '.9rem',
                transition: 'all .18s',
                background: mode === m ? 'var(--color-surface)' : 'transparent',
                color: mode === m ? 'var(--color-primary)' : 'var(--color-text-muted)',
                boxShadow: mode === m ? 'var(--shadow-sm)' : 'none',
              }}>
              {m === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Role selector — only on register */}
          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label">I am a <span className="req">*</span></label>
              <div style={{ display: 'flex', gap: 12 }}>
                <RoleCard role="patient" selected={role === 'patient'} onClick={setRole} />
                <RoleCard role="doctor"  selected={role === 'doctor'}  onClick={setRole} />
              </div>
            </div>
          )}

          {/* Username */}
          <div className="form-group">
            <label className="form-label" htmlFor="username">
              Username <span className="req">*</span>
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              placeholder="e.g. john_doe"
              className={`form-input ${error && !form.username ? 'error' : ''}`}
              value={form.username}
              onChange={handleChange}
              autoFocus
            />
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password <span className="req">*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                name="password"
                type={showPwd ? 'text' : 'password'}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                placeholder="Minimum 6 characters"
                className="form-input"
                value={form.password}
                onChange={handleChange}
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPwd(s => !s)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--color-text-muted)', padding: 4,
                }}
              >
                {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirm password */}
          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label" htmlFor="confirm">
                Confirm Password <span className="req">*</span>
              </label>
              <input
                id="confirm"
                name="confirm"
                type={showPwd ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Re-enter your password"
                className={`form-input ${error?.includes('match') ? 'error' : ''}`}
                value={form.confirm}
                onChange={handleChange}
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="alert alert-danger" style={{ padding: '10px 14px' }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '13px 0', marginTop: 4 }}
            disabled={loading}
          >
            {loading
              ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
              : mode === 'login' ? 'Sign In' : 'Create Account'
            }
          </button>

          {/* Demo hint */}
          <div style={{
            background: 'var(--color-bg-alt)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            fontSize: '.8125rem',
            color: 'var(--color-text-muted)',
            lineHeight: 1.6,
          }}>
            <strong style={{ color: 'var(--color-text)' }}>Demo doctor accounts:</strong><br />
            Username: <code>dr.sarah</code> / <code>dr.james</code> / <code>dr.priya</code> / <code>dr.michael</code><br />
            Password: <code>doctor123</code>
          </div>

        </form>
      </div>

      <p style={{ marginTop: 24, fontSize: '.8125rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
        ⚠️ For educational purposes only. Not a substitute for professional medical advice.
      </p>
    </div>
  )
}
