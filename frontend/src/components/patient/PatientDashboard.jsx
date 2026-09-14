import React, { useEffect, useMemo, useState } from 'react'
import {
  Stethoscope, Clock, Users, MessageSquare,
  Activity, TrendingUp, CheckCircle, AlertCircle, AlertTriangle,
  Heart, Thermometer, Scale, CalendarCheck, XCircle
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { Assessments } from '../../utils/db.js'
import { api } from '../../config/api.js'
import { formatDateTime } from '../../utils/helpers.js'

// ── Risk level → colour map ─────────────────────────────────────────────────
const RISK_CFG = {
  LOW:       { color: '#16a34a', bg: '#dcfce7', label: '🟢 Low Risk'       },
  MODERATE:  { color: '#d97706', bg: '#fef3c7', label: '🟡 Moderate Risk'  },
  HIGH:      { color: '#ea580c', bg: '#ffedd5', label: '🟠 High Risk'      },
  VERY_HIGH: { color: '#dc2626', bg: '#fee2e2', label: '🔴 Very High Risk' },
  CRITICAL:  { color: '#7f1d1d', bg: '#fee2e2', label: '🔴 Critical'       },
}

function riskCfg(level) {
  return RISK_CFG[level] || RISK_CFG.LOW
}

// ── Quick-action card ───────────────────────────────────────────────────────
function QuickActionCard({ icon: Icon, color, bg, title, desc, onClick }) {
  return (
    <button
      onClick={onClick}
      className="card card-hover"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 12,
        cursor: 'pointer',
        border: 'none',
        textAlign: 'left',
        padding: 24,
        width: '100%',
      }}
    >
      <div
        style={{
          width: 46,
          height: 46,
          borderRadius: 12,
          background: bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={22} color={color} />
      </div>

      <div>
        <div
          style={{
            fontWeight: 700,
            fontSize: '1rem',
            marginBottom: 4,
          }}
        >
          {title}
        </div>

        <div
          style={{
            color: 'var(--color-text-muted)',
            fontSize: '.875rem',
            lineHeight: 1.5,
          }}
        >
          {desc}
        </div>
      </div>
    </button>
  )
}

// ── Vital chip ───────────────────────────────────────────────────────────────
function VitalChip({ icon: Icon, label, value }) {
  if (value === undefined || value === null || value === '') return null

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: 'var(--color-bg-alt)',
        borderRadius: 'var(--radius-md)',
        padding: '7px 12px',
        fontSize: '.875rem',
      }}
    >
      <Icon size={14} color="var(--color-primary)" />

      <span
        style={{
          color: 'var(--color-text-muted)',
          fontWeight: 500,
        }}
      >
        {label}:
      </span>

      <span style={{ fontWeight: 700 }}>{value}</span>
    </div>
  )
}

// ── Consultation status card ─────────────────────────────────────────────────
function ConsultationStatusCard({ consultation, onNavigate }) {
  if (!consultation) return null

  const status = consultation.status?.toLowerCase()

  const isAccepted = status === 'accepted'
  const isDeclined = status === 'declined'
  const isPending = status === 'pending'

  const doctorName =
    consultation.doctor_name ||
    consultation.full_name ||
    consultation.doctorName ||
    'Doctor'

  const specialization =
    consultation.specialization ||
    consultation.doctor_specialization ||
    ''

  const createdAt =
    consultation.created_at ||
    consultation.createdAt

  let icon = Clock
  let iconColor = '#d97706'
  let iconBg = '#fef3c7'
  let title = 'Consultation Pending'
  let message = 'Your consultation request is waiting for the doctor to respond.'
  let statusColor = '#d97706'
  let statusBg = '#fef3c7'

  if (isAccepted) {
    icon = CalendarCheck
    iconColor = '#16a34a'
    iconBg = '#dcfce7'
    title = 'Consultation Accepted'
    message = 'Your doctor has accepted your consultation request.'
    statusColor = '#16a34a'
    statusBg = '#dcfce7'
  }

  if (isDeclined) {
    icon = XCircle
    iconColor = '#dc2626'
    iconBg = '#fee2e2'
    title = 'Consultation Declined'
    message = 'Your consultation request was declined. You can request another doctor from the Doctors page.'
    statusColor = '#dc2626'
    statusBg = '#fee2e2'
  }

  const Icon = icon

  return (
    <div
      className="card"
      style={{
        border: `1px solid ${statusColor}33`,
        background: 'var(--color-bg)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 14,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: iconBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon size={23} color={iconColor} />
          </div>

          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                flexWrap: 'wrap',
                marginBottom: 5,
              }}
            >
              <h2
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 700,
                  fontSize: '1.125rem',
                  margin: 0,
                }}
              >
                {title}
              </h2>

              <span
                style={{
                  fontSize: '.75rem',
                  fontWeight: 700,
                  padding: '3px 9px',
                  borderRadius: 'var(--radius-full)',
                  background: statusBg,
                  color: statusColor,
                  textTransform: 'capitalize',
                }}
              >
                {status}
              </span>
            </div>

            <div
              style={{
                fontWeight: 700,
                marginBottom: 3,
              }}
            >
              {doctorName}
            </div>

            {specialization && (
              <div
                style={{
                  color: 'var(--color-text-muted)',
                  fontSize: '.875rem',
                  marginBottom: 7,
                }}
              >
                {specialization}
              </div>
            )}

            <p
              style={{
                color: 'var(--color-text-muted)',
                fontSize: '.875rem',
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              {message}
            </p>

            {createdAt && (
              <p
                style={{
                  color: 'var(--color-text-muted)',
                  fontSize: '.75rem',
                  marginTop: 8,
                  marginBottom: 0,
                }}
              >
                Requested {formatDateTime(createdAt)}
              </p>
            )}
          </div>
        </div>

        <button
          className="btn btn-secondary"
          onClick={() => onNavigate('doctors')}
          style={{ flexShrink: 0 }}
        >
          <Users size={15} />
          View Doctors
        </button>
      </div>
    </div>
  )
}

export default function PatientDashboard({ onNewScreening, onNavigate }) {
  const { user } = useAuth()

  const latest = useMemo(
    () => Assessments.getLatest(user.id),
    [user.id]
  )

  const allCount = useMemo(
    () => Assessments.getByPatient(user.id).length,
    [user.id]
  )

  // ── Consultation state ────────────────────────────────────────────────────
  const [consultations, setConsultations] = useState([])
  const [consultationLoading, setConsultationLoading] = useState(true)

  // Fetch real consultation data from PostgreSQL backend
  useEffect(() => {
    let mounted = true

    async function fetchConsultations() {
      try {
        const data = await api.get('/api/consultations')

        if (mounted) {
          setConsultations(data?.consultations || [])
        }
      } catch (err) {
        console.error('Failed to fetch consultations:', err)

        if (mounted) {
          setConsultations([])
        }
      } finally {
        if (mounted) {
          setConsultationLoading(false)
        }
      }
    }

    fetchConsultations()

    // Keep dashboard status updated automatically
    const interval = setInterval(fetchConsultations, 3000)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [user.id])

  // Show the most recent consultation
  const latestConsultation = useMemo(() => {
    if (!consultations.length) return null

    return [...consultations].sort((a, b) => {
      const dateA = new Date(a.created_at || a.createdAt || 0).getTime()
      const dateB = new Date(b.created_at || b.createdAt || 0).getTime()

      return dateB - dateA
    })[0]
  }, [consultations])

  const hour = new Date().getHours()
  const greeting =
    hour < 12
      ? 'Good morning'
      : hour < 17
        ? 'Good afternoon'
        : 'Good evening'

  // Support both new and legacy result shape
  const riskLevel =
    latest?.prediction?.riskLevel ||
    (
      latest?.prediction?.overallTriage === 'urgent'
        ? 'HIGH'
        : latest?.prediction?.overallTriage === 'watch'
          ? 'MODERATE'
          : 'LOW'
    )

  const cfg = riskCfg(riskLevel)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 28,
      }}
    >

      {/* Welcome banner */}
      <div
        style={{
          background:
            'linear-gradient(135deg, var(--color-primary) 0%, #1e40af 100%)',
          borderRadius: 'var(--radius-xl)',
          padding: '28px 32px',
          color: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <p
            style={{
              opacity: .8,
              marginBottom: 4,
              fontSize: '.9375rem',
            }}
          >
            {greeting},
          </p>

          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: 'clamp(1.5rem,3vw,2rem)',
              color: '#fff',
              marginBottom: 8,
            }}
          >
            {user.username} 👋
          </h1>

          <p
            style={{
              opacity: .75,
              lineHeight: 1.6,
              maxWidth: 440,
            }}
          >
            {allCount === 0
              ? 'Welcome to MediPredict! Run your first screening to get a personalised risk assessment.'
              : `You have completed ${allCount} health screening${allCount > 1 ? 's' : ''}. Stay proactive about your health.`}
          </p>
        </div>

        <button
          className="btn btn-lg"
          style={{
            background: 'rgba(255,255,255,.2)',
            color: '#fff',
            border: '2px solid rgba(255,255,255,.4)',
            flexShrink: 0,
          }}
          onClick={onNewScreening}
        >
          <Stethoscope size={18} />
          Run Screening
        </button>
      </div>

      {/* Consultation status */}
      {!consultationLoading && latestConsultation && (
        <ConsultationStatusCard
          consultation={latestConsultation}
          onNavigate={onNavigate}
        />
      )}

      {/* Latest assessment */}
      {latest ? (
        <div className="card">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: 12,
              marginBottom: 18,
            }}
          >
            <div>
              <h2
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 700,
                  fontSize: '1.125rem',
                  marginBottom: 4,
                }}
              >
                Latest Screening Results
              </h2>

              <p
                style={{
                  color: 'var(--color-text-muted)',
                  fontSize: '.875rem',
                }}
              >
                {formatDateTime(latest.created_at)}
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                gap: 8,
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  fontSize: '.8125rem',
                  fontWeight: 700,
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-full)',
                  background: cfg.bg,
                  color: cfg.color,
                }}
              >
                {cfg.label}
              </span>

              {latest.prediction?.riskScore !== undefined && (
                <span className="badge badge-gray">
                  Score: {latest.prediction.riskScore}/100
                </span>
              )}

              <span className="badge badge-blue">
                BMI {latest.prediction?.bmi} · {latest.prediction?.bmiCategory}
              </span>
            </div>
          </div>

          {/* Vitals chips */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              marginBottom: 18,
            }}
          >
            <VitalChip
              icon={Activity}
              label="BP"
              value={
                latest.vitals?.systolicBP &&
                latest.vitals?.diastolicBP
                  ? `${latest.vitals.systolicBP}/${latest.vitals.diastolicBP} mmHg`
                  : null
              }
            />

            <VitalChip
              icon={Heart}
              label="HR"
              value={
                latest.vitals?.heartRate
                  ? latest.vitals.heartRate + ' bpm'
                  : null
              }
            />

            <VitalChip
              icon={Thermometer}
              label="Temp"
              value={
                latest.vitals?.temperature
                  ? latest.vitals.temperature + '°C'
                  : null
              }
            />

            <VitalChip
              icon={Scale}
              label="BMI"
              value={latest.prediction?.bmi}
            />
          </div>

          {/* Health issues list */}
          {latest.prediction?.results?.length > 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              {latest.prediction.results.map((r, i) => {
                const isUrgent =
                  r.triage === 'urgent' || r.risk === 'high'

                const isWatch =
                  r.triage === 'watch' || r.risk === 'moderate'

                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '9px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--color-bg-alt)',
                      flexWrap: 'wrap',
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 9,
                      }}
                    >
                      {isUrgent ? (
                        <AlertTriangle
                          size={15}
                          color="var(--color-danger)"
                        />
                      ) : isWatch ? (
                        <AlertCircle
                          size={15}
                          color="var(--color-warning)"
                        />
                      ) : (
                        <CheckCircle
                          size={15}
                          color="var(--color-success)"
                        />
                      )}

                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: '.9rem',
                        }}
                      >
                        {r.condition || r.name}
                      </span>
                    </div>

                    <span
                      style={{
                        fontSize: '.75rem',
                        fontWeight: 700,
                        padding: '2px 9px',
                        borderRadius: 'var(--radius-full)',
                        background: isUrgent
                          ? '#fee2e2'
                          : isWatch
                            ? '#fef3c7'
                            : '#dcfce7',
                        color: isUrgent
                          ? '#dc2626'
                          : isWatch
                            ? '#d97706'
                            : '#16a34a',
                      }}
                    >
                      {r.risk
                        ? r.risk.toUpperCase()
                        : r.severity || '—'}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="alert alert-success">
              <CheckCircle size={17} />
              No health concerns detected. Keep up the healthy lifestyle!
            </div>
          )}
        </div>
      ) : (
        <div
          className="card"
          style={{
            textAlign: 'center',
            padding: '48px 32px',
            borderStyle: 'dashed',
            borderColor: 'var(--color-border-strong)',
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              background: 'var(--color-primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <TrendingUp
              size={30}
              color="var(--color-primary)"
            />
          </div>

          <h3
            style={{
              fontWeight: 700,
              marginBottom: 8,
            }}
          >
            No assessments yet
          </h3>

          <p
            style={{
              color: 'var(--color-text-muted)',
              marginBottom: 20,
            }}
          >
            Run your first health screening to see your risk assessment here.
          </p>

          <button
            className="btn btn-primary"
            onClick={onNewScreening}
          >
            <Stethoscope size={15} />
            Start Screening
          </button>
        </div>
      )}

      {/* Quick actions */}
      <div>
        <h2
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 700,
            fontSize: '1.125rem',
            marginBottom: 16,
          }}
        >
          Quick Actions
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(200px,1fr))',
            gap: 16,
          }}
        >
          <QuickActionCard
            icon={Stethoscope}
            color="var(--color-primary)"
            bg="var(--color-primary-light)"
            title="New Screening"
            desc="Run a fresh assessment with your current vitals."
            onClick={onNewScreening}
          />

          <QuickActionCard
            icon={Clock}
            color="var(--color-accent)"
            bg="var(--color-accent-light)"
            title="View History"
            desc="Browse all past screenings and track your health over time."
            onClick={() => onNavigate('history')}
          />

          <QuickActionCard
            icon={Users}
            color="var(--color-success)"
            bg="var(--color-success-light)"
            title="Find Doctors"
            desc="Browse verified specialists and request a consultation."
            onClick={() => onNavigate('doctors')}
          />

          <QuickActionCard
            icon={MessageSquare}
            color="#7c3aed"
            bg="#ede9fe"
            title="AI Assistant"
            desc="Chat with our health AI for symptom guidance and wellness tips."
            onClick={() => onNavigate('chat')}
          />
        </div>
      </div>
    </div>
  )
}