import React, { useState } from 'react'
import {
  Stethoscope, Activity, Thermometer, Scale, Ruler,
  Heart, AlertCircle, ChevronRight, RotateCcw,
  CheckCircle, AlertTriangle, ShieldAlert, TrendingUp
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { Assessments } from '../../utils/db.js'

// ── Symptom options ──────────────────────────────────────────────────────────
const SYMPTOM_OPTIONS = [
  'Fever', 'Cough', 'Body pain', 'Shortness of breath',
  'Chest pain', 'Chest tightness', 'Fatigue', 'Increased thirst',
  'Frequent urination', 'Headache', 'Dizziness', 'Wheezing',
  'Blurred vision', 'Nausea', 'Palpitations', 'Muscle pain',
]

const INITIAL_FORM = {
  age: '', gender: '', height: '', weight: '',
  systolicBP: '', diastolicBP: '',
  fastingSugar: '', temperature: '', heartRate: '',
  symptoms: [],
}

// ── Risk level config ────────────────────────────────────────────────────────
const RISK_CONFIG = {
  LOW:       { color: '#16a34a', bg: '#dcfce7', border: '#86efac', emoji: '🟢', label: 'Low Risk'       },
  MODERATE:  { color: '#d97706', bg: '#fef3c7', border: '#fcd34d', emoji: '🟡', label: 'Moderate Risk'  },
  HIGH:      { color: '#ea580c', bg: '#ffedd5', border: '#fdba74', emoji: '🟠', label: 'High Risk'      },
  VERY_HIGH: { color: '#dc2626', bg: '#fee2e2', border: '#fca5a5', emoji: '🔴', label: 'Very High Risk' },
  CRITICAL:  { color: '#7f1d1d', bg: '#fee2e2', border: '#dc2626', emoji: '🔴', label: 'Critical'       },
}

const SEVERITY_CONFIG = {
  LOW:      { color: '#16a34a', bg: '#dcfce7' },
  MODERATE: { color: '#d97706', bg: '#fef3c7' },
  HIGH:     { color: '#ea580c', bg: '#ffedd5' },
  CRITICAL: { color: '#dc2626', bg: '#fee2e2' },
}

// ── Small field wrapper ──────────────────────────────────────────────────────
function Field({ icon: Icon, label, hint, name, type = 'number', min, max,
                 step, placeholder, value, onChange, error }) {
  return (
    <div className="form-group">
      <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        {Icon && <Icon size={14} color="var(--color-primary)" />}
        {label} <span className="req">*</span>
      </label>
      <input
        name={name} type={type} min={min} max={max} step={step}
        placeholder={placeholder}
        className={`form-input${error ? ' error' : ''}`}
        value={value} onChange={onChange}
        autoComplete="off"
      />
      {hint  && <span className="form-hint">{hint}</span>}
      {error && <span className="form-error">{error}</span>}
    </div>
  )
}

// ── Vital status badge ───────────────────────────────────────────────────────
function VitalRow({ label, value, unit, category }) {
  const isOk = ['Normal', 'Typical'].includes(category)
  const isWarn = ['Elevated', 'Stage 1', 'Prediabetes range', 'Low'].includes(category)
  const isDanger = ['Stage 2', 'Severe', 'Fever range', 'Diabetes-range reading',
                    'Very high'].includes(category)
  const dot = isDanger ? '#dc2626' : isWarn ? '#d97706' : '#16a34a'

  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '10px 14px', borderRadius: 'var(--radius-md)',
      background: 'var(--color-bg-alt)', gap: 8, flexWrap: 'wrap',
    }}>
      <span style={{ fontWeight: 600, fontSize: '.9rem' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ color: 'var(--color-text-muted)', fontSize: '.9rem' }}>
          {value}{unit && <span style={{ fontSize: '.8rem' }}> {unit}</span>}
        </span>
        <span style={{
          fontSize: '.78rem', fontWeight: 700, padding: '2px 9px',
          borderRadius: 'var(--radius-full)',
          background: isDanger ? '#fee2e2' : isWarn ? '#fef3c7' : '#dcfce7',
          color: dot,
        }}>
          {category}
        </span>
      </div>
    </div>
  )
}

// ── Health issue card ────────────────────────────────────────────────────────
function IssueCard({ issue }) {
  const cfg = SEVERITY_CONFIG[issue.severity] || SEVERITY_CONFIG.LOW
  const Icon = issue.severity === 'CRITICAL' || issue.severity === 'HIGH'
    ? AlertTriangle : issue.severity === 'MODERATE' ? AlertCircle : CheckCircle

  return (
    <div style={{
      borderRadius: 'var(--radius-md)',
      border: `1px solid ${cfg.bg}`,
      borderLeft: `4px solid ${cfg.color}`,
      background: 'var(--color-surface)',
      padding: '14px 16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <Icon size={16} color={cfg.color} style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: '.9375rem', marginBottom: 4 }}>
            {issue.name}
            <span style={{
              marginLeft: 8, fontSize: '.72rem', fontWeight: 700,
              padding: '1px 7px', borderRadius: 'var(--radius-full)',
              background: cfg.bg, color: cfg.color,
            }}>
              {issue.severity}
            </span>
          </div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '.875rem', lineHeight: 1.55 }}>
            {issue.reason}
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Results dashboard ────────────────────────────────────────────────────────
function ResultsDashboard({ result, onReset }) {
  const cfg = RISK_CONFIG[result.riskLevel] || RISK_CONFIG.LOW
  const isCritical = result.riskLevel === 'CRITICAL'
  const isHighPlus = ['CRITICAL', 'VERY_HIGH', 'HIGH'].includes(result.riskLevel)

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.5rem' }}>
          Assessment Results
        </h1>
        <button className="btn btn-ghost" onClick={onReset}>
          <RotateCcw size={15} /> New Screening
        </button>
      </div>

      {/* Risk score hero card */}
      <div style={{
        borderRadius: 'var(--radius-xl)', padding: '28px 28px',
        background: `linear-gradient(135deg, ${cfg.color}18 0%, ${cfg.color}08 100%)`,
        border: `1.5px solid ${cfg.border}`,
        display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap',
      }}>
        {/* Score ring */}
        <div style={{
          width: 100, height: 100, borderRadius: '50%',
          background: cfg.bg, border: `4px solid ${cfg.color}`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '2rem', color: cfg.color, lineHeight: 1 }}>
            {result.riskScore}
          </span>
          <span style={{ fontSize: '.72rem', color: cfg.color, fontWeight: 600 }}>/100</span>
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.5rem', color: cfg.color, marginBottom: 4 }}>
            {cfg.emoji} {cfg.label}
          </div>
          <div style={{ color: 'var(--color-text-muted)', fontSize: '.9375rem', marginBottom: 8 }}>
            BMI: <strong>{result.bmi}</strong>
            <span style={{
              marginLeft: 8, fontSize: '.78rem', fontWeight: 600,
              padding: '2px 8px', borderRadius: 'var(--radius-full)',
              background: 'var(--color-bg-alt)', color: 'var(--color-text-muted)',
            }}>{result.bmiCategory}</span>
          </div>
          <p style={{ fontSize: '.875rem', color: 'var(--color-text)', lineHeight: 1.6, maxWidth: 420 }}>
            {result.medicalRecommendation}
          </p>
        </div>
      </div>

      {/* Critical banner */}
      {isCritical && (
        <div className="alert alert-danger">
          <ShieldAlert size={20} style={{ flexShrink: 0 }} />
          <strong>Critical reading detected. Please seek medical attention promptly. Do not delay.</strong>
        </div>
      )}

      {/* Vital signs status */}
      <div className="card">
        <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.0625rem', marginBottom: 14 }}>
          Vital Signs Status
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <VitalRow label="Blood Pressure"    value={result.vitals.bloodPressure.value} unit="mmHg" category={result.vitals.bloodPressure.category} />
          <VitalRow label="Fasting Blood Sugar" value={result.vitals.fastingSugar.value} unit="mg/dL" category={result.vitals.fastingSugar.category} />
          <VitalRow label="Body Temperature"  value={result.vitals.temperature.value}  unit="°C"   category={result.vitals.temperature.category} />
          <VitalRow label="Heart Rate"         value={result.vitals.heartRate.value}    unit="bpm"  category={result.vitals.heartRate.category} />
          <VitalRow label="BMI"                value={result.bmi}                       unit=""     category={result.bmiCategory} />
        </div>
      </div>

      {/* Detected health concerns */}
      <div className="card">
        <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.0625rem', marginBottom: 14 }}>
          Detected Health Concerns
        </h2>
        {result.healthIssues.length === 0 ? (
          <div className="alert alert-success">
            <CheckCircle size={18} />
            <span>No health concerns detected. Your vital signs are within typical ranges.</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {result.healthIssues.map((issue, i) => <IssueCard key={i} issue={issue} />)}
          </div>
        )}
      </div>

      {/* Preventive measures */}
      <div className="card">
        <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.0625rem', marginBottom: 14 }}>
          Preventive Measures
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {result.preventiveMeasures.map((m, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%',
                background: 'var(--color-primary-light)', color: 'var(--color-primary)',
                fontFamily: 'var(--font-heading)', fontWeight: 700,
                fontSize: '.75rem', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1,
              }}>{i + 1}</div>
              <p style={{ fontSize: '.9375rem', color: 'var(--color-text)', lineHeight: 1.65, margin: 0 }}>{m}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div style={{
        background: 'var(--color-bg-alt)', borderRadius: 'var(--radius-md)',
        padding: '12px 16px', fontSize: '.8125rem', color: 'var(--color-text-muted)',
        borderLeft: '3px solid var(--color-border-strong)', lineHeight: 1.6,
      }}>
        ⚠️ <strong>Disclaimer:</strong> This assessment is generated by a rule-based engine for informational
        purposes only. It does not constitute a medical diagnosis. Always consult a qualified
        healthcare professional for medical advice, diagnosis, or treatment.
      </div>

      <div style={{ paddingBottom: 8 }}>
        <button className="btn btn-primary" onClick={onReset}>
          <RotateCcw size={15} /> Start New Screening
        </button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export default function NewScreening() {
  const { user }                      = useAuth()
  const [form, setForm]               = useState(INITIAL_FORM)
  const [fieldErrors, setFieldErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading]         = useState(false)
  const [result, setResult]           = useState(null)

  function handleChange(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    setFieldErrors(fe => ({ ...fe, [name]: '' }))
    setServerError('')
  }

  function toggleSymptom(sym) {
    setForm(f => ({
      ...f,
      symptoms: f.symptoms.includes(sym)
        ? f.symptoms.filter(s => s !== sym)
        : [...f.symptoms, sym],
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setFieldErrors({})
    setServerError('')

    try {
      const res = await fetch('/api/health-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form }),
      })

      const data = await res.json()

      if (res.status === 422 && data.validationErrors) {
        setFieldErrors(data.validationErrors)
        setLoading(false)
        return
      }
      if (!res.ok) {
        setServerError(data.error || 'Assessment failed. Please try again.')
        setLoading(false)
        return
      }

      // Save to history
      Assessments.create({
        user_id: user.id,
        vitals: data.inputSnapshot,
        symptoms: form.symptoms,
        prediction: {
          riskScore: data.riskScore,
          riskLevel: data.riskLevel,
          bmi: data.bmi,
          bmiCategory: data.bmiCategory,
          overallTriage: data.riskLevel === 'CRITICAL' ? 'urgent'
            : data.riskLevel === 'VERY_HIGH' ? 'urgent'
            : data.riskLevel === 'HIGH' ? 'watch' : 'routine',
          results: data.healthIssues.map(i => ({
            condition: i.name,
            risk: i.severity === 'CRITICAL' || i.severity === 'HIGH' ? 'high'
              : i.severity === 'MODERATE' ? 'moderate' : 'low',
            reasoning: i.reason,
            triage: i.severity === 'CRITICAL' ? 'urgent'
              : i.severity === 'HIGH' ? 'watch' : 'routine',
            score: data.riskScore,
          })),
        },
      })

      setResult(data)
    } catch {
      setServerError('Unable to reach the assessment server. Make sure the backend is running on port 4000.')
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    setForm(INITIAL_FORM)
    setResult(null)
    setFieldErrors({})
    setServerError('')
  }

  // Show results dashboard
  if (result) return <ResultsDashboard result={result} onReset={handleReset} />

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.5rem', marginBottom: 6 }}>
          Health Risk Screening
        </h1>
        <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
          Enter your current vitals to receive a deterministic, rule-based risk assessment.
          No AI is used — the same inputs always produce the same result.
        </p>
      </div>

      {serverError && (
        <div className="alert alert-danger" style={{ marginBottom: 20 }}>
          <AlertCircle size={16} style={{ flexShrink: 0 }} /> {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>

        {/* ── Personal information ─────────────────────────────────────────── */}
        <div className="card" style={{ marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.0625rem', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Stethoscope size={17} color="var(--color-primary)" /> Personal Information
          </h2>
          <div className="grid-2">
            <Field icon={null} label="Age" name="age" min="1" max="120"
              placeholder="e.g. 35" value={form.age} onChange={handleChange}
              error={fieldErrors.age} />
            <div className="form-group">
              <label className="form-label">Gender <span className="req">*</span></label>
              <select name="gender" className={`form-select${fieldErrors.gender ? ' error' : ''}`}
                value={form.gender} onChange={handleChange}>
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer not to say">Prefer not to say</option>
              </select>
              {fieldErrors.gender && <span className="form-error">{fieldErrors.gender}</span>}
            </div>
            <Field icon={Ruler} label="Height" name="height" min="50" max="250"
              placeholder="cm, e.g. 170" value={form.height} onChange={handleChange}
              error={fieldErrors.height} hint="50–250 cm" />
            <Field icon={Scale} label="Weight" name="weight" min="2" max="300"
              placeholder="kg, e.g. 75" value={form.weight} onChange={handleChange}
              error={fieldErrors.weight} hint="2–300 kg" />
          </div>
        </div>

        {/* ── Vital signs ──────────────────────────────────────────────────── */}
        <div className="card" style={{ marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.0625rem', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={17} color="var(--color-primary)" /> Vital Signs
          </h2>
          <div className="grid-2">
            <Field icon={Activity} label="Systolic BP" name="systolicBP" min="50" max="250"
              placeholder="mmHg, e.g. 120" value={form.systolicBP} onChange={handleChange}
              error={fieldErrors.systolicBP} hint="Upper number (50–250 mmHg)" />
            <Field icon={Activity} label="Diastolic BP" name="diastolicBP" min="30" max="150"
              placeholder="mmHg, e.g. 80" value={form.diastolicBP} onChange={handleChange}
              error={fieldErrors.diastolicBP} hint="Lower number (30–150 mmHg)" />
            <Field icon={Thermometer} label="Fasting Blood Sugar" name="fastingSugar" min="30" max="600"
              placeholder="mg/dL, e.g. 95" value={form.fastingSugar} onChange={handleChange}
              error={fieldErrors.fastingSugar} hint="30–600 mg/dL" />
            <Field icon={Thermometer} label="Body Temperature" name="temperature"
              min="30" max="45" step="0.1"
              placeholder="°C, e.g. 37.0" value={form.temperature} onChange={handleChange}
              error={fieldErrors.temperature} hint="30–45 °C" />
            <Field icon={Heart} label="Resting Heart Rate" name="heartRate" min="20" max="250"
              placeholder="bpm, e.g. 72" value={form.heartRate} onChange={handleChange}
              error={fieldErrors.heartRate} hint="20–250 bpm" />
          </div>
        </div>

        {/* ── Symptoms ─────────────────────────────────────────────────────── */}
        <div className="card" style={{ marginBottom: 28 }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.0625rem', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={17} color="var(--color-primary)" /> Current Symptoms
            <span style={{ fontWeight: 400, fontSize: '.8125rem', color: 'var(--color-text-muted)' }}>(optional)</span>
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '.875rem', marginBottom: 14 }}>
            Select all symptoms you are currently experiencing.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
            {SYMPTOM_OPTIONS.map(sym => {
              const sel = form.symptoms.includes(sym)
              return (
                <button key={sym} type="button" onClick={() => toggleSymptom(sym)}
                  style={{
                    padding: '6px 14px', borderRadius: 'var(--radius-full)',
                    border: `1.5px solid ${sel ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    background: sel ? 'var(--color-primary-light)' : 'var(--color-surface)',
                    color: sel ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    fontWeight: sel ? 600 : 500, fontSize: '.875rem', cursor: 'pointer',
                    transition: 'all .15s',
                  }}>
                  {sym}
                </button>
              )
            })}
          </div>
          {form.symptoms.length > 0 && (
            <p style={{ marginTop: 10, fontSize: '.8125rem', color: 'var(--color-primary)', fontWeight: 600 }}>
              {form.symptoms.length} symptom{form.symptoms.length > 1 ? 's' : ''} selected
            </p>
          )}
        </div>

        <button type="submit" className="btn btn-primary btn-lg"
          style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
          {loading
            ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Analysing vitals…</>
            : <><TrendingUp size={19} /> Run Assessment</>
          }
        </button>
      </form>
    </div>
  )
}
