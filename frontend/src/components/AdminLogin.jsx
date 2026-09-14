import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HeartPulse, Eye, EyeOff, ArrowLeft, ShieldCheck } from 'lucide-react'
import { API_BASE_URL } from '../config/api.js'

export default function AdminLogin() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    username: '',
    password: '',
  })

  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e) {
    setForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (!form.username.trim()) {
      setError('Username is required.')
      return
    }

    if (!form.password) {
      setError('Password is required.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: form.username.trim(),
          password: form.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login failed.')
      }

      // Only admins are allowed into the admin panel
      if (data.user?.role !== 'admin') {
        throw new Error('Access denied. Admin account required.')
      }

      // Store backend JWT for authenticated admin API requests
      localStorage.setItem('token', data.token)
      localStorage.setItem('admin_user', JSON.stringify(data.user))

      navigate('/admin', { replace: true })
    } catch (err) {
      setError(err.message || 'Unable to sign in.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'linear-gradient(160deg, #f0f7ff 0%, #f8fafc 60%, #f0fdf8 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <button
        className="btn btn-ghost btn-sm"
        onClick={() => navigate('/')}
        style={{
          marginBottom: 24,
          alignSelf: 'flex-start',
          maxWidth: 480,
          width: '100%',
        }}
      >
        <ArrowLeft size={16} />
        Back to home
      </button>

      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: 480,
          padding: 40,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: 30,
          }}
        >
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: 16,
              background: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(37,99,235,.4)',
              marginBottom: 14,
            }}
          >
            <ShieldCheck size={29} color="#fff" />
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: '1.625rem',
            }}
          >
            Admin Portal
          </h1>

          <p
            style={{
              color: 'var(--color-text-muted)',
              marginTop: 5,
              fontSize: '.9375rem',
              textAlign: 'center',
            }}
          >
            Secure administrator sign in
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
          }}
        >
          {/* Username */}
          <div className="form-group">
            <label className="form-label" htmlFor="admin-username">
              Admin Username
            </label>

            <input
              id="admin-username"
              name="username"
              type="text"
              autoComplete="username"
              placeholder="Enter admin username"
              className="form-input"
              value={form.username}
              onChange={handleChange}
              autoFocus
            />
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="admin-password">
              Password
            </label>

            <div style={{ position: 'relative' }}>
              <input
                id="admin-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter admin password"
                className="form-input"
                value={form.password}
                onChange={handleChange}
                style={{ paddingRight: 44 }}
              />

              <button
                type="button"
                onClick={() => setShowPassword(value => !value)}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-muted)',
                  padding: 4,
                }}
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              className="alert alert-danger"
              style={{
                padding: '10px 14px',
              }}
            >
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{
              width: '100%',
              justifyContent: 'center',
              padding: '13px 0',
              marginTop: 4,
            }}
          >
            {loading ? (
              <span
                className="spinner"
                style={{
                  width: 18,
                  height: 18,
                  borderWidth: 2,
                }}
              />
            ) : (
              <>
                <ShieldCheck size={18} />
                Sign In as Admin
              </>
            )}
          </button>
        </form>

        <div
          style={{
            marginTop: 24,
            padding: '12px 16px',
            background: 'var(--color-bg-alt)',
            borderRadius: 'var(--radius-md)',
            fontSize: '.8rem',
            color: 'var(--color-text-muted)',
            lineHeight: 1.5,
            textAlign: 'center',
          }}
        >
          🔒 Admin access is restricted to authorized administrators.
        </div>
      </div>

      <p
        style={{
          marginTop: 24,
          fontSize: '.8125rem',
          color: 'var(--color-text-muted)',
          textAlign: 'center',
        }}
      >
        MediPredict Administration System
      </p>
    </div>
  )
}