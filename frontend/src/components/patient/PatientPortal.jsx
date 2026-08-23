import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  HeartPulse, LayoutDashboard, Stethoscope, Clock,
  Users, MessageSquare, LogOut, ArrowLeft
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import PatientDashboard from './PatientDashboard.jsx'
import NewScreening     from './NewScreening.jsx'
import HistoryTab       from './HistoryTab.jsx'
import DoctorsTab       from './DoctorsTab.jsx'
import AIChatbot        from './AIChatbot.jsx'

const TABS = [
  { id: 'dashboard', label: 'Dashboard',     icon: LayoutDashboard },
  { id: 'screening', label: 'New Screening', icon: Stethoscope     },
  { id: 'history',   label: 'History',       icon: Clock           },
  { id: 'doctors',   label: 'Doctors',       icon: Users           },
  { id: 'chat',      label: 'AI Assistant',  icon: MessageSquare   },
]

export default function PatientPortal() {
  const { user, logout } = useAuth()
  const navigate         = useNavigate()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [chatContext, setChatContext] = useState('')

  function handleLogout() {
    logout()
    navigate('/', { replace: true })
  }

  function openChatWithContext(ctx) {
    setChatContext(ctx)
    setActiveTab('chat')
  }

  // Renders the active tab content
  function renderTab() {
    switch (activeTab) {
      case 'dashboard':
        return (
          <PatientDashboard
            onNewScreening={() => setActiveTab('screening')}
            onNavigate={setActiveTab}
            onOpenChat={openChatWithContext}
          />
        )
      case 'screening': return <NewScreening />
      case 'history':   return <HistoryTab />
      case 'doctors':   return <DoctorsTab />
      case 'chat':      return <AIChatbot initialContext={chatContext} />
      default:          return null
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column' }}>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="page-header">
        <div className="container" style={{ display: 'flex', alignItems: 'center', gap: 12, height: 64 }}>

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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 4, flexShrink: 0 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9,
              background: 'var(--color-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <HeartPulse size={18} color="#fff" />
            </div>
            <span style={{
              fontFamily: 'var(--font-heading)', fontWeight: 700,
              fontSize: '1.0625rem', color: 'var(--color-text)',
            }}>
              Medi<span style={{ color: 'var(--color-primary)' }}>Predict</span>
            </span>
          </div>

          {/* Tab nav */}
          <nav style={{ display: 'flex', gap: 2, flex: 1, overflowX: 'auto', scrollbarWidth: 'none' }}>
            {TABS.map(({ id, label, icon: Icon }) => {
              const active = activeTab === id
              return (
                <button key={id} onClick={() => setActiveTab(id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '7px 12px', borderRadius: 'var(--radius-md)',
                    border: 'none', cursor: 'pointer',
                    fontWeight: active ? 700 : 500, fontSize: '.85rem',
                    whiteSpace: 'nowrap',
                    background: active ? 'var(--color-primary-light)' : 'transparent',
                    color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    transition: 'all .15s',
                  }}>
                  <Icon size={15} />
                  <span>{label}</span>
                </button>
              )
            })}
          </nav>

          {/* User + logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: 'var(--color-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: '.8rem',
            }}>
              {user?.username?.[0]?.toUpperCase() || 'P'}
            </div>
            <span style={{
              fontWeight: 600, fontSize: '.85rem', color: 'var(--color-text)',
              maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {user?.username}
            </span>
            <button className="btn btn-ghost btn-sm" onClick={handleLogout}
              title="Sign out" style={{ padding: '6px 9px' }}>
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <main style={{ flex: 1, padding: '32px 24px' }}>
        <div className="container">
          {renderTab()}
        </div>
      </main>
    </div>
  )
}
