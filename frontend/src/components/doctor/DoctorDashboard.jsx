import React, { useState, useEffect, useCallback } from 'react'
import {
  LayoutDashboard, CheckCircle, XCircle, Clock,
  BadgeCheck, User, MessageSquare, AlertCircle,
  RefreshCw, Building2, GraduationCap, MapPin
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { Consultations } from '../../utils/db.js'
import { formatDateTime, timeAgo, capitalize } from '../../utils/helpers.js'

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    pending:  { cls: 'badge badge-amber',  label: 'Pending'  },
    accepted: { cls: 'badge badge-green',  label: 'Accepted' },
    declined: { cls: 'badge badge-red',    label: 'Declined' },
  }
  const { cls, label } = map[status] || { cls: 'badge badge-gray', label: capitalize(status) }
  return <span className={cls}>{label}</span>
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, color, bg, label, value }) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 20 }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={22} color={color} />
      </div>
      <div>
        <div style={{ fontSize: '1.75rem', fontFamily: 'var(--font-heading)', fontWeight: 800, lineHeight: 1 }}>
          {value}
        </div>
        <div style={{ color: 'var(--color-text-muted)', fontSize: '.875rem', marginTop: 2 }}>
          {label}
        </div>
      </div>
    </div>
  )
}

// ── Consultation card ─────────────────────────────────────────────────────────
function ConsultCard({ consult, onAccept, onDecline, onRead }) {
  const isPending  = consult.status === 'pending'
  const isUnread   = !consult.read

  return (
    <div
      className="card"
      style={{
        borderLeft: `4px solid ${isUnread && isPending ? 'var(--color-primary)' : isPending ? 'var(--color-warning)' : consult.status === 'accepted' ? 'var(--color-success)' : 'var(--color-danger)'}`,
        transition: 'box-shadow .2s',
        position: 'relative',
        padding: 0, overflow: 'hidden',
      }}
    >
      {/* Unread dot */}
      {isUnread && (
        <div style={{
          position: 'absolute', top: 14, right: 14,
          width: 10, height: 10, borderRadius: '50%',
          background: 'var(--color-primary)',
        }} />
      )}

      <div style={{ padding: '18px 20px' }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: '50%',
              background: 'var(--color-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: '.875rem', flexShrink: 0,
            }}>
              {consult.patient_name?.[0]?.toUpperCase() || 'P'}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '.9375rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                <User size={14} color="var(--color-text-muted)" />
                {consult.patient_name}
                {isUnread && (
                  <span style={{
                    background: 'var(--color-primary)', color: '#fff',
                    fontSize: '.7rem', fontWeight: 700, padding: '1px 6px',
                    borderRadius: 'var(--radius-full)',
                  }}>NEW</span>
                )}
              </div>
              <div style={{ color: 'var(--color-text-muted)', fontSize: '.8125rem', marginTop: 2 }}>
                {timeAgo(consult.created_at)} · {formatDateTime(consult.created_at)}
              </div>
            </div>
          </div>
          <StatusBadge status={consult.status} />
        </div>

        {/* Message */}
        <div style={{
          background: 'var(--color-bg-alt)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 14px',
          marginBottom: isPending ? 16 : 0,
          fontSize: '.9375rem',
          lineHeight: 1.65,
          color: 'var(--color-text)',
        }}>
          <MessageSquare size={14} color="var(--color-text-muted)" style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
          {consult.message}
        </div>

        {/* Action buttons — only for pending */}
        {isPending && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="btn btn-accent btn-sm"
              onClick={() => { onAccept(consult.id); if (isUnread) onRead(consult.id) }}
              style={{ flex: 1, justifyContent: 'center' }}
            >
              <CheckCircle size={15} /> Accept
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => { onDecline(consult.id); if (isUnread) onRead(consult.id) }}
              style={{ flex: 1, justifyContent: 'center' }}
            >
              <XCircle size={15} /> Decline
            </button>
            {isUnread && (
              <button className="btn btn-ghost btn-sm" onClick={() => onRead(consult.id)}
                title="Mark as read" style={{ padding: '6px 10px' }}>
                <CheckCircle size={15} />
              </button>
            )}
          </div>
        )}

        {/* Resolved timestamp */}
        {!isPending && consult.updated_at !== consult.created_at && (
          <p style={{ fontSize: '.8125rem', color: 'var(--color-text-muted)', marginTop: 8 }}>
            {capitalize(consult.status)} · {formatDateTime(consult.updated_at)}
          </p>
        )}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function DoctorDashboard({ profile }) {
  const { user } = useAuth()
  const [consultations, setConsultations] = useState([])
  const [filter, setFilter] = useState('all')  // all | pending | accepted | declined

  const refresh = useCallback(() => {
    setConsultations(Consultations.getByDoctor(user.id))
  }, [user.id])

  useEffect(() => {
    refresh()
    const iv = setInterval(refresh, 3000)
    return () => clearInterval(iv)
  }, [refresh])

  function handleAccept(id)  { Consultations.updateStatus(id, 'accepted'); refresh() }
  function handleDecline(id) { Consultations.updateStatus(id, 'declined'); refresh() }
  function handleRead(id)    { Consultations.markRead(id); refresh() }

  // Stats
  const pending  = consultations.filter(c => c.status === 'pending').length
  const accepted = consultations.filter(c => c.status === 'accepted').length
  const declined = consultations.filter(c => c.status === 'declined').length
  const unread   = consultations.filter(c => !c.read).length

  const filtered = filter === 'all' ? consultations : consultations.filter(c => c.status === filter)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* ── Profile banner ─────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #0f766e 0%, var(--color-accent) 100%)',
        borderRadius: 'var(--radius-xl)', padding: '28px 32px', color: '#fff',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 16,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1 style={{
              fontFamily: 'var(--font-heading)', fontWeight: 800,
              fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', color: '#fff',
            }}>
              {profile.full_name}
            </h1>
            {profile.verified && (
              <BadgeCheck size={22} color="#fff" title="Verified doctor" />
            )}
          </div>
          <p style={{ opacity: .8, fontSize: '.9375rem', marginBottom: 12 }}>
            {profile.specialization} · {profile.degree}
          </p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '.875rem', opacity: .8 }}>
              <Building2 size={14} /> {profile.hospital}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '.875rem', opacity: .8 }}>
              <MapPin size={14} /> {profile.city}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '.875rem', opacity: .8 }}>
              <GraduationCap size={14} /> {profile.university} · {profile.year_of_passing}
            </span>
          </div>
        </div>
        {!profile.verified && (
          <div style={{
            background: 'rgba(255,255,255,.15)', borderRadius: 'var(--radius-md)',
            padding: '12px 16px', fontSize: '.875rem', maxWidth: 240,
          }}>
            <AlertCircle size={16} style={{ marginBottom: 6 }} />
            <div>Verification pending. Your profile is under review by our team.</div>
          </div>
        )}
      </div>

      {/* ── Stats ──────────────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 16,
      }}>
        <StatCard icon={Clock}       color="var(--color-warning)"  bg="var(--color-warning-light)"  label="Pending"  value={pending}  />
        <StatCard icon={CheckCircle} color="var(--color-success)"  bg="var(--color-success-light)"  label="Accepted" value={accepted} />
        <StatCard icon={XCircle}     color="var(--color-danger)"   bg="var(--color-danger-light)"   label="Declined" value={declined} />
        <StatCard icon={MessageSquare} color="var(--color-primary)" bg="var(--color-primary-light)" label="Unread"   value={unread}   />
      </div>

      {/* ── Consultations ──────────────────────────────────────────────── */}
      <div>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16,
        }}>
          <h2 style={{
            fontFamily: 'var(--font-heading)', fontWeight: 700,
            fontSize: '1.125rem', display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <LayoutDashboard size={18} color="var(--color-primary)" />
            Patient Consultations
            {unread > 0 && (
              <span style={{
                background: 'var(--color-danger)', color: '#fff',
                borderRadius: 'var(--radius-full)', fontSize: '.72rem',
                fontWeight: 700, padding: '2px 8px',
              }}>
                {unread} unread
              </span>
            )}
          </h2>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* Filter buttons */}
            {['all', 'pending', 'accepted', 'declined'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}>
                {capitalize(f)}
                {f !== 'all' && (
                  <span style={{ marginLeft: 4, opacity: .7, fontSize: '.8rem' }}>
                    ({consultations.filter(c => c.status === f).length})
                  </span>
                )}
              </button>
            ))}
            <button className="btn btn-ghost btn-sm" onClick={refresh} title="Refresh">
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '56px 32px', borderStyle: 'dashed', borderColor: 'var(--color-border-strong)' }}>
            <MessageSquare size={40} color="var(--color-border-strong)" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontWeight: 700, marginBottom: 8 }}>
              {consultations.length === 0 ? 'No consultation requests yet' : `No ${filter} consultations`}
            </h3>
            <p style={{ color: 'var(--color-text-muted)' }}>
              {consultations.length === 0
                ? 'Once patients request a consultation, they will appear here.'
                : 'Try selecting a different filter above.'
              }
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filtered.map(c => (
              <ConsultCard
                key={c.id}
                consult={c}
                onAccept={handleAccept}
                onDecline={handleDecline}
                onRead={handleRead}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
