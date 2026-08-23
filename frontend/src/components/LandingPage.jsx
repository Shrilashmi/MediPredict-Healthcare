import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  HeartPulse, Brain, Stethoscope, Users, ShieldCheck,
  ArrowRight, CheckCircle, Activity, Zap, Globe
} from 'lucide-react'

// ── Feature cards data ────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: Brain,
    color: 'var(--color-primary)',
    bg: 'var(--color-primary-light)',
    title: 'Smart Screening',
    desc: 'Answer a quick health questionnaire and receive an instant AI-driven risk assessment across six major disease categories.',
  },
  {
    icon: Stethoscope,
    color: 'var(--color-accent)',
    bg: 'var(--color-accent-light)',
    title: 'AI Health Assistant',
    desc: 'Chat with our 24/7 health assistant for symptom guidance, wellness tips, and personalised preventive advice.',
  },
  {
    icon: Users,
    color: 'var(--color-success)',
    bg: 'var(--color-success-light)',
    title: 'Doctor Matching',
    desc: 'Browse verified specialists and request a consultation directly — matched to your screening results.',
  },
]

const STATS = [
  { value: '6+',   label: 'Disease categories screened' },
  { value: '24/7', label: 'AI assistant availability' },
  { value: '100%', label: 'Privacy-first design' },
  { value: 'Free', label: 'No signup fee' },
]

const HOW_IT_WORKS = [
  { step: '01', title: 'Create your account', desc: 'Register as a patient in under 60 seconds — no credit card needed.' },
  { step: '02', title: 'Run a health screening', desc: 'Enter your vitals and symptoms; our engine analyses risk in real time.' },
  { step: '03', title: 'Review your results', desc: 'Get condition-by-condition risk scores, reasoning, and preventive measures.' },
  { step: '04', title: 'Connect with a doctor', desc: 'Request a consultation with a verified specialist matched to your needs.' },
]

// ── Sub-components ────────────────────────────────────────────────────────────
function Navbar({ onGetStarted }) {
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(248,250,252,0.92)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--color-border)',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div className="container" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 68,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'var(--color-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(37,99,235,.35)',
          }}>
            <HeartPulse size={22} color="#fff" />
          </div>
          <span style={{
            fontFamily: 'var(--font-heading)', fontWeight: 700,
            fontSize: '1.25rem', color: 'var(--color-text)',
          }}>
            Medi<span style={{ color: 'var(--color-primary)' }}>Predict</span>
          </span>
        </div>

        {/* Nav links */}
        <nav style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
          {['Features', 'How it works', 'About'].map(link => (
            <a key={link} href={`#${link.toLowerCase().replace(/ /g, '-')}`}
              style={{ color: 'var(--color-text-muted)', fontWeight: 500, fontSize: '.9375rem' }}>
              {link}
            </a>
          ))}
        </nav>

        {/* CTA */}
        <button className="btn btn-primary btn-sm" onClick={onGetStarted}>
          Get Started <ArrowRight size={16} />
        </button>
      </div>
    </header>
  )
}

function HeroBadge() {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      background: 'var(--color-primary-light)', color: 'var(--color-primary)',
      padding: '6px 16px', borderRadius: 'var(--radius-full)',
      fontWeight: 600, fontSize: '.8125rem', marginBottom: 24,
      border: '1px solid rgba(37,99,235,.2)',
    }}>
      <Zap size={14} />
      AI-Powered Early Detection Platform
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <Navbar onGetStarted={() => navigate('/auth')} />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section style={{
        padding: '96px 24px 80px',
        background: 'linear-gradient(160deg, #f0f7ff 0%, #f8fafc 50%, #f0fdf8 100%)',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background decoration */}
        <div style={{
          position: 'absolute', top: -80, right: -80,
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37,99,235,.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -60, left: -60,
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(13,148,136,.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: 760, margin: '0 auto', position: 'relative' }}>
          <HeroBadge />

          <h1 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            fontWeight: 800,
            lineHeight: 1.15,
            marginBottom: 24,
            color: 'var(--color-text)',
          }}>
            AI-Powered{' '}
            <span style={{
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Early Disease Prediction
            </span>{' '}
            & Preventive Care
          </h1>

          <p style={{
            fontSize: 'clamp(1rem, 2vw, 1.2rem)',
            color: 'var(--color-text-muted)',
            maxWidth: 580, margin: '0 auto 40px',
            lineHeight: 1.75,
          }}>
            MediPredict analyses your vitals and symptoms in real time — delivering personalised risk
            assessments, preventive guidance, and direct access to verified specialists.
          </p>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary btn-lg"
              onClick={() => navigate('/auth?role=patient')}
              style={{ minWidth: 190 }}
            >
              <Activity size={20} />
              Patient Portal
            </button>
            <button
              className="btn btn-secondary btn-lg"
              onClick={() => navigate('/auth?role=doctor')}
              style={{ minWidth: 190 }}
            >
              <Stethoscope size={20} />
              Doctor Portal
            </button>
          </div>

          {/* Trust indicators */}
          <div style={{
            marginTop: 48, display: 'flex', gap: 24,
            justifyContent: 'center', flexWrap: 'wrap',
          }}>
            {['No credit card required', 'HIPAA-ready architecture', 'Free for patients'].map(item => (
              <div key={item} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                color: 'var(--color-text-muted)', fontSize: '.875rem', fontWeight: 500,
              }}>
                <CheckCircle size={15} color="var(--color-success)" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS BAR ────────────────────────────────────────────────────── */}
      <section style={{
        background: 'var(--color-primary)',
        padding: '32px 24px',
      }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 24, textAlign: 'center',
          }}>
            {STATS.map(({ value, label }) => (
              <div key={label}>
                <div style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '2rem', fontWeight: 800, color: '#fff',
                  lineHeight: 1,
                }}>
                  {value}
                </div>
                <div style={{ color: 'rgba(255,255,255,.75)', fontSize: '.875rem', marginTop: 4 }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section id="features" style={{ padding: '80px 24px' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <span style={{
              display: 'inline-block',
              background: 'var(--color-accent-light)', color: 'var(--color-accent)',
              padding: '4px 14px', borderRadius: 'var(--radius-full)',
              fontSize: '.8125rem', fontWeight: 600, marginBottom: 14,
            }}>
              Core Features
            </span>
            <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 700, marginBottom: 12 }}>
              Everything you need for proactive health
            </h2>
            <p style={{ color: 'var(--color-text-muted)', maxWidth: 480, margin: '0 auto' }}>
              Three powerful modules working together to keep you ahead of preventable illness.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 24,
          }}>
            {FEATURES.map(({ icon: Icon, color, bg, title, desc }) => (
              <div key={title} className="card card-hover" style={{ padding: 32 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 20,
                }}>
                  <Icon size={26} color={color} />
                </div>
                <h3 style={{ fontWeight: 700, marginBottom: 10, fontSize: '1.125rem' }}>{title}</h3>
                <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.7 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section id="how-it-works" style={{
        padding: '80px 24px',
        background: 'var(--color-bg-alt)',
      }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 700, marginBottom: 12 }}>
              How it works
            </h2>
            <p style={{ color: 'var(--color-text-muted)', maxWidth: 440, margin: '0 auto' }}>
              From signup to specialist in four simple steps.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 24, position: 'relative',
          }}>
            {HOW_IT_WORKS.map(({ step, title, desc }, i) => (
              <div key={step} style={{ textAlign: 'center' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: i % 2 === 0 ? 'var(--color-primary)' : 'var(--color-accent)',
                  color: '#fff',
                  fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px',
                  boxShadow: '0 4px 14px rgba(37,99,235,.3)',
                }}>
                  {step}
                </div>
                <h4 style={{ fontWeight: 700, marginBottom: 8 }}>{title}</h4>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '.9375rem', lineHeight: 1.65 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ───────────────────────────────────────────────────── */}
      <section style={{
        padding: '80px 24px',
        background: 'linear-gradient(135deg, var(--color-primary) 0%, #1e40af 100%)',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18,
            background: 'rgba(255,255,255,.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <ShieldCheck size={32} color="#fff" />
          </div>
          <h2 style={{
            fontFamily: 'var(--font-heading)', fontWeight: 800,
            fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
            color: '#fff', marginBottom: 16,
          }}>
            Start your free health screening today
          </h2>
          <p style={{ color: 'rgba(255,255,255,.8)', marginBottom: 36, lineHeight: 1.7 }}>
            Join thousands of patients using MediPredict to stay ahead of preventable illness.
            No waiting rooms, no appointments — instant AI-driven insights.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn btn-lg"
              style={{ background: '#fff', color: 'var(--color-primary)', fontWeight: 700 }}
              onClick={() => navigate('/auth?role=patient')}
            >
              Patient Portal <ArrowRight size={18} />
            </button>
            <button
              className="btn btn-lg"
              style={{ background: 'rgba(255,255,255,.15)', color: '#fff', border: '2px solid rgba(255,255,255,.4)' }}
              onClick={() => navigate('/auth?role=doctor')}
            >
              Doctor Portal
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer style={{
        background: 'var(--color-text)',
        color: 'rgba(255,255,255,.6)',
        padding: '40px 24px',
        textAlign: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'var(--color-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <HeartPulse size={17} color="#fff" />
          </div>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: '#fff', fontSize: '1rem' }}>
            MediPredict
          </span>
        </div>
        <p style={{ fontSize: '.875rem', marginBottom: 8 }}>
          © {new Date().getFullYear()} MediPredict. For educational and informational purposes only.
        </p>
        <p style={{ fontSize: '.8125rem', color: 'rgba(255,255,255,.4)' }}>
          ⚠️ Not a substitute for professional medical advice, diagnosis, or treatment.
        </p>
      </footer>
    </div>
  )
}
