import React, { useState } from 'react'
import { Stethoscope, GraduationCap, Building2, MapPin, ChevronRight, CheckCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { DoctorProfiles } from '../../utils/db.js'

const SPECIALIZATIONS = [
  'Cardiologist', 'Endocrinologist', 'Pulmonologist', 'General Practitioner',
  'Internal Medicine', 'Neurologist', 'Oncologist', 'Orthopedic Surgeon',
  'Pediatrician', 'Psychiatrist', 'Radiologist', 'Urologist',
  'Dermatologist', 'Gastroenterologist', 'Ophthalmologist', 'Rheumatologist',
]

const CURRENT_YEAR = new Date().getFullYear()

const INITIAL = {
  full_name: '', degree: '', university: '', year_of_passing: '',
  highest_degree: '', hospital: '', specialization: '', city: '',
}

function Section({ title, icon: Icon, children }) {
  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <h2 style={{
        fontFamily: 'var(--font-heading)', fontWeight: 700,
        fontSize: '1.0625rem', marginBottom: 20,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <Icon size={18} color="var(--color-primary)" /> {title}
      </h2>
      {children}
    </div>
  )
}

function Field({ label, required, error, hint, children }) {
  return (
    <div className="form-group">
      <label className="form-label">
        {label} {required && <span className="req">*</span>}
      </label>
      {children}
      {hint  && <span className="form-hint">{hint}</span>}
      {error && <span className="form-error">{error}</span>}
    </div>
  )
}

export default function DoctorOnboarding({ onComplete }) {
  const { user }    = useAuth()
  const [form, setForm]     = useState(INITIAL)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [done, setDone]       = useState(false)

  function handleChange(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    setErrors(e => ({ ...e, [name]: '' }))
  }

  function validate() {
    const e = {}
    const required = ['full_name','degree','university','year_of_passing','highest_degree','hospital','specialization','city']
    required.forEach(k => { if (!form[k]?.toString().trim()) e[k] = 'This field is required.' })
    if (form.year_of_passing) {
      const y = +form.year_of_passing
      if (isNaN(y) || y < 1950 || y > CURRENT_YEAR) e.year_of_passing = `Enter a valid year (1950–${CURRENT_YEAR})`
    }
    return e
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    setTimeout(() => {
      const profile = DoctorProfiles.create({
        user_id:          user.id,
        full_name:        form.full_name.trim(),
        degree:           form.degree.trim(),
        university:       form.university.trim(),
        year_of_passing:  +form.year_of_passing,
        highest_degree:   form.highest_degree.trim(),
        hospital:         form.hospital.trim(),
        specialization:   form.specialization,
        city:             form.city.trim(),
        verified:         false,
      })
      setLoading(false)
      setDone(true)
      setTimeout(() => onComplete(profile), 1600)
    }, 800)
  }

  if (done) {
    return (
      <div style={{
        maxWidth: 540, margin: '0 auto', textAlign: 'center', padding: '64px 24px',
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'var(--color-success-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px',
        }}>
          <CheckCircle size={36} color="var(--color-success)" />
        </div>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.5rem', marginBottom: 12 }}>
          Profile Submitted!
        </h2>
        <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
          Your credentials are under review. Verification usually takes 1–2 business days.
          You can start receiving consultation requests immediately.
        </p>
        <div className="spinner" style={{ margin: '24px auto 0', width: 30, height: 30 }} />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.625rem', marginBottom: 6 }}>
          Doctor Onboarding
        </h1>
        <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
          Complete your professional profile to start receiving patient consultations.
          Your credentials will be reviewed for the verified badge.
        </p>
      </div>

      {/* Verification note */}
      <div className="alert alert-info" style={{ marginBottom: 24 }}>
        <CheckCircle size={18} style={{ flexShrink: 0 }} />
        <span>
          After submission, your profile will be reviewed for a <strong>verified badge</strong>.
          Patients can still send consultation requests while verification is pending.
        </span>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Personal */}
        <Section title="Personal Information" icon={Stethoscope}>
          <div className="grid-2">
            <div style={{ gridColumn: '1 / -1' }}>
              <Field label="Full Name" required error={errors.full_name}>
                <input name="full_name" className={`form-input ${errors.full_name ? 'error' : ''}`}
                  placeholder="Dr. Jane Smith" value={form.full_name} onChange={handleChange} />
              </Field>
            </div>
            <Field label="Primary Degree" required error={errors.degree} hint="e.g. MBBS, MD, DO">
              <input name="degree" className={`form-input ${errors.degree ? 'error' : ''}`}
                placeholder="MBBS, MD" value={form.degree} onChange={handleChange} />
            </Field>
            <Field label="Highest Degree Acquired" required error={errors.highest_degree}>
              <input name="highest_degree" className={`form-input ${errors.highest_degree ? 'error' : ''}`}
                placeholder="MD – Cardiology" value={form.highest_degree} onChange={handleChange} />
            </Field>
          </div>
        </Section>

        {/* Education */}
        <Section title="Education" icon={GraduationCap}>
          <div className="grid-2">
            <Field label="University / Medical School" required error={errors.university}>
              <input name="university" className={`form-input ${errors.university ? 'error' : ''}`}
                placeholder="Johns Hopkins University" value={form.university} onChange={handleChange} />
            </Field>
            <Field label="Year of Passing" required error={errors.year_of_passing} hint={`1950–${CURRENT_YEAR}`}>
              <input name="year_of_passing" type="number" min="1950" max={CURRENT_YEAR}
                className={`form-input ${errors.year_of_passing ? 'error' : ''}`}
                placeholder="e.g. 2015" value={form.year_of_passing} onChange={handleChange} />
            </Field>
          </div>
        </Section>

        {/* Practice */}
        <Section title="Current Practice" icon={Building2}>
          <div className="grid-2">
            <Field label="Specialization" required error={errors.specialization}>
              <select name="specialization" className={`form-select ${errors.specialization ? 'error' : ''}`}
                value={form.specialization} onChange={handleChange}>
                <option value="">Select specialization</option>
                {SPECIALIZATIONS.map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Current Hospital / Clinic" required error={errors.hospital}>
              <input name="hospital" className={`form-input ${errors.hospital ? 'error' : ''}`}
                placeholder="City General Hospital" value={form.hospital} onChange={handleChange} />
            </Field>
            <Field label="City" required error={errors.city} hint="Where you currently practice">
              <input name="city" className={`form-input ${errors.city ? 'error' : ''}`}
                placeholder="New York" value={form.city} onChange={handleChange} />
            </Field>
          </div>
        </Section>

        <button
          type="submit"
          className="btn btn-primary btn-lg"
          style={{ width: '100%', justifyContent: 'center' }}
          disabled={loading}
        >
          {loading
            ? <><span className="spinner" style={{ width:18, height:18, borderWidth:2 }} /> Submitting…</>
            : <><ChevronRight size={20} /> Submit Profile</>
          }
        </button>
      </form>
    </div>
  )
}
