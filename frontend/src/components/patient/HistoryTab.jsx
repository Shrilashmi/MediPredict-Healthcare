import React, { useMemo, useState } from 'react'
import { Clock, ChevronDown, ChevronUp, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { Assessments } from '../../utils/db.js'
import { formatDateTime } from '../../utils/helpers.js'

// ── Unified risk/triage mapping (supports both old and new result shapes) ────
const RISK_CFG = {
  LOW:       { color: '#16a34a', bg: '#dcfce7', border: '#16a34a', label: '🟢 Low Risk'       },
  MODERATE:  { color: '#d97706', bg: '#fef3c7', border: '#d97706', label: '🟡 Moderate Risk'  },
  HIGH:      { color: '#ea580c', bg: '#ffedd5', border: '#ea580c', label: '🟠 High Risk'      },
  VERY_HIGH: { color: '#dc2626', bg: '#fee2e2', border: '#dc2626', label: '🔴 Very High Risk' },
  CRITICAL:  { color: '#7f1d1d', bg: '#fee2e2', border: '#dc2626', label: '🔴 Critical'       },
}

// Convert legacy triage → new riskLevel string
function resolveRiskLevel(prediction) {
  if (prediction?.riskLevel) return prediction.riskLevel
  const t = prediction?.overallTriage || 'routine'
  return t === 'urgent' ? 'HIGH' : t === 'watch' ? 'MODERATE' : 'LOW'
}

function riskCfg(level) { return RISK_CFG[level] || RISK_CFG.LOW }

// ── Vital pill ───────────────────────────────────────────────────────────────
function Pill({ label, value }) {
  if (!value && value !== 0) return null
  return (
    <span style={{
      background: 'var(--color-bg-alt)', borderRadius: 'var(--radius-sm)',
      padding: '3px 9px', fontSize: '.8125rem', fontWeight: 500,
      color: 'var(--color-text-muted)',
    }}>
      {label}: <strong style={{ color: 'var(--color-text)' }}>{value}</strong>
    </span>
  )
}

// ── Assessment card ──────────────────────────────────────────────────────────
function AssessmentCard({ record }) {
  const [expanded, setExpanded] = useState(false)
  const { prediction, vitals, symptoms, created_at } = record
  const level = resolveRiskLevel(prediction)
  const cfg   = riskCfg(level)

  return (
    <div className="card" style={{
      borderLeft: `4px solid ${cfg.border}`, padding: 0, overflow: 'hidden',
    }}>
      {/* Collapsed header */}
      <button onClick={() => setExpanded(e => !e)}
        style={{
          width: '100%', padding: '16px 20px', background: 'none', border: 'none',
          cursor: 'pointer', display: 'flex', alignItems: 'flex-start',
          justifyContent: 'space-between', gap: 12, textAlign: 'left',
        }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: '.9375rem' }}>
              {formatDateTime(created_at)}
            </span>
            <span style={{
              fontSize: '.78rem', fontWeight: 700, padding: '2px 9px',
              borderRadius: 'var(--radius-full)', background: cfg.bg, color: cfg.color,
            }}>{cfg.label}</span>
            {prediction?.riskScore !== undefined && (
              <span className="badge badge-gray">Score: {prediction.riskScore}/100</span>
            )}
            {prediction?.bmi && (
              <span className="badge badge-blue">BMI {prediction.bmi} · {prediction.bmiCategory}</span>
            )}
          </div>

          {/* Issue chips */}
          {prediction?.results?.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {prediction.results.map((r, i) => {
                const isHigh = r.risk === 'high' || r.severity === 'HIGH' || r.severity === 'CRITICAL'
                const isMed  = r.risk === 'moderate' || r.severity === 'MODERATE'
                return (
                  <span key={i} style={{
                    fontSize: '.78rem', fontWeight: 600, padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    background: isHigh ? '#fee2e2' : isMed ? '#fef3c7' : '#dcfce7',
                    color: isHigh ? '#dc2626' : isMed ? '#d97706' : '#16a34a',
                  }}>
                    {r.condition || r.name}
                  </span>
                )
              })}
            </div>
          ) : (
            <span className="badge badge-green"><CheckCircle size={11} /> No issues detected</span>
          )}
        </div>

        <div style={{ color: 'var(--color-text-muted)', marginTop: 2, flexShrink: 0 }}>
          {expanded ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--color-border)' }}>
          {/* Vitals */}
          <div style={{ marginTop: 14, marginBottom: 14 }}>
            <p style={{ fontWeight: 600, fontSize: '.875rem', marginBottom: 8, color: 'var(--color-text-muted)' }}>
              Vitals Recorded
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              <Pill label="Age"    value={vitals?.age} />
              <Pill label="Gender" value={vitals?.gender} />
              <Pill label="Height" value={vitals?.height ? vitals.height + ' cm' : null} />
              <Pill label="Weight" value={vitals?.weight ? vitals.weight + ' kg' : null} />
              <Pill label="BP"     value={vitals?.systolicBP && vitals?.diastolicBP
                ? `${vitals.systolicBP}/${vitals.diastolicBP} mmHg` : null} />
              <Pill label="Sugar"  value={vitals?.fastingSugar ? vitals.fastingSugar + ' mg/dL' : null} />
              <Pill label="Temp"   value={vitals?.temperature ? vitals.temperature + '°C' : null} />
              <Pill label="HR"     value={vitals?.heartRate ? vitals.heartRate + ' bpm' : null} />
            </div>
          </div>

          {/* Symptoms */}
          {symptoms?.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <p style={{ fontWeight: 600, fontSize: '.875rem', marginBottom: 8, color: 'var(--color-text-muted)' }}>
                Reported Symptoms
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {symptoms.map(s => (
                  <span key={s} className="badge badge-gray">{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Condition analysis */}
          {prediction?.results?.length > 0 && (
            <div>
              <p style={{ fontWeight: 600, fontSize: '.875rem', color: 'var(--color-text-muted)', marginBottom: 10 }}>
                Detected Health Concerns
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {prediction.results.map((r, i) => {
                  const isHigh = r.risk === 'high' || r.severity === 'HIGH' || r.severity === 'CRITICAL'
                  const isMed  = r.risk === 'moderate' || r.severity === 'MODERATE'
                  return (
                    <div key={i} style={{
                      background: 'var(--color-bg-alt)', borderRadius: 'var(--radius-md)',
                      padding: '11px 14px',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 5 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          {isHigh
                            ? <AlertTriangle size={14} color="#dc2626" />
                            : isMed
                            ? <AlertCircle   size={14} color="#d97706" />
                            : <CheckCircle   size={14} color="#16a34a" />
                          }
                          <strong style={{ fontSize: '.9rem' }}>{r.condition || r.name}</strong>
                        </div>
                        <span style={{
                          fontSize: '.75rem', fontWeight: 700, padding: '1px 8px',
                          borderRadius: 'var(--radius-full)',
                          background: isHigh ? '#fee2e2' : isMed ? '#fef3c7' : '#dcfce7',
                          color: isHigh ? '#dc2626' : isMed ? '#d97706' : '#16a34a',
                        }}>
                          {r.risk ? r.risk.toUpperCase() : r.severity}
                        </span>
                      </div>
                      {(r.reasoning || r.reason) && (
                        <p style={{ fontSize: '.875rem', color: 'var(--color-text-muted)', margin: 0 }}>
                          {r.reasoning || r.reason}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function HistoryTab() {
  const { user }    = useAuth()
  const records     = useMemo(() => Assessments.getByPatient(user.id), [user.id])
  const [filter, setFilter] = useState('all')  // all | high | moderate | low

  const filtered = filter === 'all' ? records : records.filter(r => {
    const lvl = resolveRiskLevel(r.prediction)
    if (filter === 'high')     return ['HIGH', 'VERY_HIGH', 'CRITICAL'].includes(lvl)
    if (filter === 'moderate') return lvl === 'MODERATE'
    if (filter === 'low')      return lvl === 'LOW'
    return true
  })

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.5rem',
            marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Clock size={22} color="var(--color-primary)" /> Screening History
          </h1>
          <p style={{ color: 'var(--color-text-muted)' }}>
            {records.length} assessment{records.length !== 1 ? 's' : ''} on record
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['all', 'high', 'moderate', 'low'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 32px' }}>
          <Clock size={40} color="var(--color-border-strong)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontWeight: 700, marginBottom: 8 }}>
            {records.length === 0 ? 'No screenings yet' : 'No results for this filter'}
          </h3>
          <p style={{ color: 'var(--color-text-muted)' }}>
            {records.length === 0
              ? 'Run a screening from the New Screening tab to see your history here.'
              : 'Try selecting a different risk level above.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtered.map(r => <AssessmentCard key={r.id} record={r} />)}
        </div>
      )}
    </div>
  )
}
