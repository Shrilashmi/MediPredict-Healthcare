import React, { useState, useMemo, useEffect, useCallback } from 'react'
import {
  Users,
  MapPin,
  Building2,
  GraduationCap,
  BadgeCheck,
  X,
  Send,
  CheckCircle,
  Loader,
  Clock,
  XCircle
} from 'lucide-react'

import { useAuth } from '../../context/AuthContext.jsx'
import { initials } from '../../utils/helpers.js'
import { api } from '../../config/api.js'

const SPECIALIZATION_COLORS = {
  'Cardiologist': {
    bg: '#fee2e2',
    color: '#991b1b'
  },
  'Endocrinologist': {
    bg: '#fef3c7',
    color: '#92400e'
  },
  'Pulmonologist': {
    bg: '#dbeafe',
    color: '#1e40af'
  },
  'Internal Medicine': {
    bg: '#dcfce7',
    color: '#166534'
  },
  'General Practitioner': {
    bg: '#f3e8ff',
    color: '#6b21a8'
  }
}

function SpecBadge({ spec }) {
  const style = SPECIALIZATION_COLORS[spec] || {
    bg: 'var(--color-bg-alt)',
    color: 'var(--color-text-muted)'
  }

  return (
    <span
      style={{
        background: style.bg,
        color: style.color,
        padding: '3px 10px',
        borderRadius: 'var(--radius-full)',
        fontSize: '.78rem',
        fontWeight: 600
      }}
    >
      {spec}
    </span>
  )
}

function ConsultationStatus({ consultation }) {
  if (!consultation) return null

  const status = consultation.status?.toLowerCase()

  if (status === 'accepted') {
    return (
      <div
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 7,
          padding: '10px 14px',
          borderRadius: 'var(--radius-md)',
          background: '#dcfce7',
          color: '#166534',
          fontWeight: 700,
          fontSize: '.875rem'
        }}
      >
        <CheckCircle size={17} />
        Consultation Accepted
      </div>
    )
  }

  if (status === 'declined') {
    return (
      <div
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 7,
          padding: '10px 14px',
          borderRadius: 'var(--radius-md)',
          background: '#fee2e2',
          color: '#991b1b',
          fontWeight: 700,
          fontSize: '.875rem'
        }}
      >
        <XCircle size={17} />
        Consultation Declined
      </div>
    )
  }

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        padding: '10px 14px',
        borderRadius: 'var(--radius-md)',
        background: '#fef3c7',
        color: '#92400e',
        fontWeight: 700,
        fontSize: '.875rem'
      }}
    >
      <Clock size={17} />
      Consultation Pending
    </div>
  )
}

function DoctorCard({
  doctor,
  consultation,
  onRequest
}) {
  const avatarColor = [
    '#2563eb',
    '#0d9488',
    '#7c3aed',
    '#dc2626',
    '#16a34a'
  ]

  const color =
    avatarColor[
      Math.abs(doctor.full_name.charCodeAt(0)) %
      avatarColor.length
    ]

  return (
    <div
      className="card card-hover"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        padding: 0,
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          height: 6,
          background: color
        }}
      />

      <div style={{ padding: '20px' }}>

        {/* Doctor heading */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 14,
            marginBottom: 14
          }}
        >
          <div
            style={{
              width: 50,
              height: 50,
              borderRadius: '50%',
              background: color,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              fontSize: '1rem',
              flexShrink: 0
            }}
          >
            {initials(doctor.full_name)}
          </div>

          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                flexWrap: 'wrap'
              }}
            >
              <h3
                style={{
                  fontWeight: 700,
                  fontSize: '1rem',
                  lineHeight: 1.3
                }}
              >
                {doctor.full_name}
              </h3>

              {doctor.verified && (
                <BadgeCheck
                  size={16}
                  color="var(--color-primary)"
                  title="Verified doctor"
                />
              )}
            </div>

            <SpecBadge spec={doctor.specialization} />
          </div>
        </div>

        {/* Doctor information */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 7,
            marginBottom: 18
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              fontSize: '.875rem',
              color: 'var(--color-text-muted)'
            }}
          >
            <Building2 size={14} />
            <span>{doctor.hospital}</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              fontSize: '.875rem',
              color: 'var(--color-text-muted)'
            }}
          >
            <MapPin size={14} />
            <span>{doctor.city}</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              fontSize: '.875rem',
              color: 'var(--color-text-muted)'
            }}
          >
            <GraduationCap size={14} />

            <span>
              {doctor.degree} · {doctor.university} (
              {doctor.year_of_passing})
            </span>
          </div>
        </div>

        {/* Consultation status / request button */}
        {consultation ? (
          <ConsultationStatus
            consultation={consultation}
          />
        ) : (
          <button
            className="btn btn-primary"
            style={{
              width: '100%',
              justifyContent: 'center'
            }}
            onClick={() => onRequest(doctor)}
          >
            Request Consultation
          </button>
        )}

        {/* Existing consultation details */}
        {consultation && (
          <div
            style={{
              marginTop: 10,
              textAlign: 'center',
              fontSize: '.75rem',
              color: 'var(--color-text-muted)'
            }}
          >
            {consultation.created_at && (
              <>
                Requested{' '}
                {new Date(
                  consultation.created_at
                ).toLocaleString()}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function ConsultModal({
  doctor,
  onClose,
  onSend,
  existingRequest
}) {
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  async function handleSend() {
    if (!message.trim()) {
      setError('Please enter a message.')
      return
    }

    try {
      setSending(true)
      setError('')

      await onSend(
        doctor,
        message.trim()
      )

      setSent(true)
    } catch (err) {
      console.error(
        'Failed to send consultation:',
        err
      )

      setError(
        err.message ||
        'Failed to send consultation request.'
      )
    } finally {
      setSending(false)
    }
  }

  return (
    <div
      className="modal-overlay"
      onClick={e => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="modal-box">

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 20
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                fontSize: '1.25rem',
                marginBottom: 4
              }}
            >
              Request Consultation
            </h2>

            <p
              style={{
                color: 'var(--color-text-muted)',
                fontSize: '.9rem'
              }}
            >
              with{' '}
              <strong>
                {doctor.full_name}
              </strong>{' '}
              · {doctor.specialization}
            </p>
          </div>

          <button
            className="btn-icon"
            onClick={onClose}
            style={{
              border: 'none',
              background: 'var(--color-bg-alt)',
              borderRadius: 8,
              cursor: 'pointer',
              padding: 6
            }}
          >
            <X
              size={18}
              color="var(--color-text-muted)"
            />
          </button>
        </div>

        {sent ? (
          <div
            style={{
              textAlign: 'center',
              padding: '24px 0'
            }}
          >
            <CheckCircle
              size={48}
              color="var(--color-success)"
              style={{
                margin: '0 auto 16px'
              }}
            />

            <h3
              style={{
                fontWeight: 700,
                marginBottom: 8
              }}
            >
              Request Sent!
            </h3>

            <p
              style={{
                color: 'var(--color-text-muted)',
                marginBottom: 24
              }}
            >
              Your consultation request has been
              sent to {doctor.full_name}. You'll be
              notified when they respond.
            </p>

            <button
              className="btn btn-primary"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        ) : existingRequest ? (
          <div className="alert alert-info">
            <CheckCircle size={18} />

            <div>
              You already have a{' '}
              <strong>
                {existingRequest.status}
              </strong>{' '}
              consultation request with this doctor.

              <div
                style={{
                  marginTop: 12
                }}
              >
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={onClose}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div
              className="form-group"
              style={{
                marginBottom: 16
              }}
            >
              <label className="form-label">
                Your message{' '}
                <span className="req">*</span>
              </label>

              <textarea
                className="form-textarea"
                rows={5}
                placeholder="Describe your symptoms, concerns, or recent screening results…"
                value={message}
                disabled={sending}
                onChange={e => {
                  setMessage(e.target.value)
                  setError('')
                }}
                style={{
                  resize: 'vertical'
                }}
              />

              {error && (
                <span className="form-error">
                  {error}
                </span>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                gap: 10,
                justifyContent: 'flex-end'
              }}
            >
              <button
                className="btn btn-ghost"
                onClick={onClose}
                disabled={sending}
              >
                Cancel
              </button>

              <button
                className="btn btn-primary"
                onClick={handleSend}
                disabled={sending}
              >
                {sending ? (
                  <>
                    <Loader
                      size={15}
                      style={{
                        animation:
                          'spin 1s linear infinite'
                      }}
                    />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    Send Request
                  </>
                )}
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  )
}

export default function DoctorsTab() {
  const { user } = useAuth()

  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [myConsults, setMyConsults] = useState([])

  const [search, setSearch] = useState('')
  const [specFilter, setSpec] = useState('All')
  const [modal, setModal] = useState(null)

  const [refreshKey, setRefreshKey] = useState(0)

  // ── Fetch verified doctors ────────────────────────────────────────────────
  const fetchDoctors = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await api.get(
        '/api/doctors'
      )

      const transformedDoctors =
        (response.doctors || []).map(doc => ({
          id: doc.id,
          user_id: doc.user_id,
          full_name: doc.full_name,
          degree: doc.degree,
          university: doc.university,
          year_of_passing:
            doc.year_of_passing,
          highest_degree:
            doc.highest_degree,
          hospital: doc.hospital,
          specialization:
            doc.specialization,
          city: doc.city,
          verified: doc.verified
        }))

      setDoctors(transformedDoctors)

    } catch (err) {
      console.error(
        'Failed to fetch doctors:',
        err
      )

      setError(
        err.message ||
        'Failed to fetch doctors.'
      )

      setDoctors([])
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Fetch patient's consultations ─────────────────────────────────────────
  const fetchConsultations =
    useCallback(async () => {
      try {
        const response =
          await api.get(
            '/api/consultations'
          )

        setMyConsults(
          response?.consultations || []
        )
      } catch (err) {
        console.error(
          'Failed to fetch consultations:',
          err
        )

        setMyConsults([])
      }
    }, [])

  useEffect(() => {
    fetchDoctors()
  }, [fetchDoctors, refreshKey])

  useEffect(() => {
    fetchConsultations()

    // Poll so patient sees doctor decisions
    // without needing to refresh manually.
    const interval = setInterval(() => {
      fetchConsultations()
    }, 3000)

    return () => clearInterval(interval)
  }, [fetchConsultations, refreshKey])

  const specializations = useMemo(() => {
    return [
      'All',
      ...new Set(
        doctors.map(
          d => d.specialization
        )
      )
    ]
  }, [doctors])

  const filtered = useMemo(() => {
    return doctors.filter(d => {
      const values = [
        d.full_name,
        d.hospital,
        d.city,
        d.degree
      ]

      const matchSearch =
        !search ||
        values.some(v =>
          String(v || '')
            .toLowerCase()
            .includes(
              search.toLowerCase()
            )
        )

      const matchSpec =
        specFilter === 'All' ||
        d.specialization ===
          specFilter

      return matchSearch && matchSpec
    })
  }, [
    doctors,
    search,
    specFilter
  ])

  function getExistingRequest(doctor) {
    return (
      myConsults.find(
        c =>
          c.doctor_profile_id ===
          doctor.id
      ) || null
    )
  }

  async function handleSend(
    doctor,
    message
  ) {
    await api.post(
      '/api/consultations',
      {
        doctor_user_id:
          doctor.user_id,
        doctor_profile_id:
          doctor.id,
        message
      }
    )

    await fetchConsultations()

    setRefreshKey(k => k + 1)
  }

  function handleRequest(doctor) {
    const existing =
      getExistingRequest(doctor)

    if (existing) {
      return
    }

    setModal(doctor)
  }

  if (loading) {
    return (
      <div>
        <div
          style={{
            marginBottom: 24
          }}
        >
          <h1
            style={{
              fontFamily:
                'var(--font-heading)',
              fontWeight: 800,
              fontSize: '1.5rem',
              marginBottom: 4,
              display: 'flex',
              alignItems: 'center',
              gap: 10
            }}
          >
            <Users
              size={22}
              color="var(--color-primary)"
            />
            Find a Doctor
          </h1>

          <p
            style={{
              color:
                'var(--color-text-muted)'
            }}
          >
            Loading verified specialists...
          </p>
        </div>

        <div
          className="card"
          style={{
            textAlign: 'center',
            padding: '48px 32px'
          }}
        >
          <Loader
            size={40}
            color="var(--color-primary)"
            style={{
              margin:
                '0 auto 16px',
              animation:
                'spin 1s linear infinite'
            }}
          />

          <p
            style={{
              color:
                'var(--color-text-muted)'
            }}
          >
            Fetching doctor profiles
            from database...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>

      <div
        style={{
          marginBottom: 24
        }}
      >
        <h1
          style={{
            fontFamily:
              'var(--font-heading)',
            fontWeight: 800,
            fontSize: '1.5rem',
            marginBottom: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}
        >
          <Users
            size={22}
            color="var(--color-primary)"
          />
          Find a Doctor
        </h1>

        <p
          style={{
            color:
              'var(--color-text-muted)'
          }}
        >
          Browse {doctors.length}{' '}
          verified specialists and
          request a consultation.
        </p>
      </div>

      {error && (
        <div
          className="alert alert-warning"
          style={{
            marginBottom: 20
          }}
        >
          <strong>Unable to load doctors:</strong>{' '}
          {error}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          gap: 12,
          marginBottom: 24,
          flexWrap: 'wrap',
          alignItems: 'center'
        }}
      >
        <input
          type="search"
          placeholder="Search by name, hospital or city…"
          className="form-input"
          style={{
            maxWidth: 300
          }}
          value={search}
          onChange={e =>
            setSearch(e.target.value)
          }
        />

        <div
          style={{
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap'
          }}
        >
          {specializations.map(s => (
            <button
              key={s}
              onClick={() =>
                setSpec(s)
              }
              className={`btn btn-sm ${
                specFilter === s
                  ? 'btn-primary'
                  : 'btn-ghost'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div
          className="card"
          style={{
            textAlign: 'center',
            padding: '48px 32px'
          }}
        >
          <Users
            size={40}
            color="var(--color-border-strong)"
            style={{
              margin:
                '0 auto 16px'
            }}
          />

          <h3
            style={{
              fontWeight: 700,
              marginBottom: 8
            }}
          >
            No doctors found
          </h3>

          <p
            style={{
              color:
                'var(--color-text-muted)'
            }}
          >
            Try adjusting your
            search or filter.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 20
          }}
        >
          {filtered.map(d => (
            <DoctorCard
              key={d.id}
              doctor={d}
              consultation={getExistingRequest(d)}
              onRequest={handleRequest}
            />
          ))}
        </div>
      )}

      {modal && (
        <ConsultModal
          key={refreshKey}
          doctor={modal}
          existingRequest={getExistingRequest(
            modal
          )}
          onClose={() =>
            setModal(null)
          }
          onSend={handleSend}
        />
      )}

    </div>
  )
}