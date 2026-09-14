import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  HeartPulse, LayoutDashboard, LogOut, BadgeCheck, ArrowLeft
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { api } from '../../config/api.js'
import DoctorOnboarding from './DoctorOnboarding.jsx'
import DoctorDashboard from './DoctorDashboard.jsx'

export default function DoctorPortal() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [profile, setProfile] = useState(null)
  const [checking, setChecking] = useState(true)
  const [unread, setUnread] = useState(0)

  // Check if doctor has completed onboarding
  const loadProfile = useCallback(async () => {
    try {
      setChecking(true)

      const data = await api.get('/api/doctors/me')

      setProfile(data?.profile || null)
    } catch (err) {
      console.error('Failed to load doctor profile:', err)

      // If no profile exists, show onboarding
      setProfile(null)
    } finally {
      setChecking(false)
    }
  }, [])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  // Refresh unread consultation count
  const loadUnread = useCallback(async () => {
    try {
      const data = await api.get('/api/consultations')
      const consultations = data?.consultations || []

      const unreadCount = consultations.filter(
        consultation =>
          consultation.doctor_user_id === user.id &&
          !consultation.read
      ).length

      setUnread(unreadCount)
    } catch (err) {
      console.error('Failed to load unread consultations:', err)
    }
  }, [user.id])

  useEffect(() => {
    loadUnread()

    const iv = setInterval(() => {
      loadUnread()
    }, 3000)

    return () => clearInterval(iv)
  }, [loadUnread])

  function handleLogout() {
    logout()
    navigate('/', { replace: true })
  }

  function handleOnboardingComplete(newProfile) {
    setProfile(newProfile)
  }

  if (checking) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh'
        }}
      >
        <div
          className="spinner"
          style={{ width: 40, height: 40 }}
        />
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-bg)',
        display: 'flex',
        flexDirection: 'column'
      }}
    >

      {/* Header */}
      <header className="page-header">
        <div
          className="container"
          style={{
            display: 'flex',
            alignItems: 'center',
            height: 64,
            gap: 12
          }}
        >

          {/* Back to landing */}
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => navigate('/')}
            title="Back to home"
            style={{ padding: '6px 10px', flexShrink: 0 }}
          >
            <ArrowLeft size={16} />
          </button>

          {/* Logo */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 9,
                background: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <HeartPulse size={19} color="#fff" />
            </div>

            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                fontSize: '1.125rem',
                color: 'var(--color-text)'
              }}
            >
              Medi
              <span style={{ color: 'var(--color-primary)' }}>
                Predict
              </span>

              <span
                style={{
                  marginLeft: 8,
                  fontSize: '.75rem',
                  fontWeight: 600,
                  background: 'var(--color-accent-light)',
                  color: 'var(--color-accent)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  verticalAlign: 'middle'
                }}
              >
                Doctor
              </span>
            </span>
          </div>

          <div style={{ flex: 1 }} />

          {/* Nav label */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <LayoutDashboard
              size={16}
              color="var(--color-primary)"
            />

            <span
              style={{
                fontWeight: 600,
                fontSize: '.9rem',
                color: 'var(--color-text)'
              }}
            >
              Dashboard
            </span>

            {unread > 0 && (
              <span
                style={{
                  background: 'var(--color-danger)',
                  color: '#fff',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '.72rem',
                  fontWeight: 700,
                  padding: '2px 7px',
                  minWidth: 20,
                  textAlign: 'center'
                }}
              >
                {unread}
              </span>
            )}
          </div>

          <div style={{ flex: 1 }} />

          {/* User info */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10
            }}
          >
            {profile?.verified && (
              <span
                title="Verified doctor"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  color: 'var(--color-primary)',
                  fontSize: '.8125rem',
                  fontWeight: 600
                }}
              >
                <BadgeCheck size={16} />
                Verified
              </span>
            )}

            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'var(--color-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 700,
                fontSize: '.8125rem'
              }}
            >
              {user?.username?.[0]?.toUpperCase() || 'D'}
            </div>

            <span
              style={{
                fontWeight: 600,
                fontSize: '.875rem',
                maxWidth: 120,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {profile?.full_name || user.username}
            </span>

            <button
              className="btn btn-ghost btn-sm"
              onClick={handleLogout}
              style={{ padding: '6px 10px' }}
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main
        style={{
          flex: 1,
          padding: '32px 24px'
        }}
      >
        <div className="container">
          {!profile ? (
            <DoctorOnboarding
              onComplete={handleOnboardingComplete}
            />
          ) : (
            <DoctorDashboard profile={profile} />
          )}
        </div>
      </main>
    </div>
  )
}