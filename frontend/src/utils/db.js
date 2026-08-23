/**
 * db.js — localStorage data layer
 * Mirrors the intended PostgreSQL schema 1:1.
 * Replace every function body with a fetch() call once Postgres is wired up.
 *
 * Tables (localStorage keys):
 *   mp_users            → users[]
 *   mp_doctor_profiles  → doctor_profiles[]
 *   mp_assessments      → assessments[]
 *   mp_consultations    → consultations[]
 */

// ── Helpers ───────────────────────────────────────────────────────────────────
const uuid = () => crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)
const now  = () => new Date().toISOString()

function getTable(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]') } catch { return [] }
}
function setTable(key, data) {
  localStorage.setItem(key, JSON.stringify(data))
}

// ── Keys ──────────────────────────────────────────────────────────────────────
const KEYS = {
  users:       'mp_users',
  doctors:     'mp_doctor_profiles',
  assessments: 'mp_assessments',
  consults:    'mp_consultations',
  seeded:      'mp_seeded',
}

// ═════════════════════════════════════════════════════════════════════════════
// SEED — 4 verified doctors
// ═════════════════════════════════════════════════════════════════════════════
export function seedIfNeeded() {
  if (localStorage.getItem(KEYS.seeded)) return

  // Seed doctor user accounts
  const doctorUsers = [
    { id: 'd1', username: 'dr.sarah',   password: 'doctor123', role: 'doctor', created_at: now() },
    { id: 'd2', username: 'dr.james',   password: 'doctor123', role: 'doctor', created_at: now() },
    { id: 'd3', username: 'dr.priya',   password: 'doctor123', role: 'doctor', created_at: now() },
    { id: 'd4', username: 'dr.michael', password: 'doctor123', role: 'doctor', created_at: now() },
  ]
  setTable(KEYS.users, doctorUsers)

  // Seed doctor profiles
  const profiles = [
    {
      id: 'dp1', user_id: 'd1',
      full_name: 'Dr. Sarah Al-Mansouri',
      degree: 'MBBS, MD (Cardiology)',
      university: 'University of Toronto',
      year_of_passing: 2012,
      highest_degree: 'MD – Cardiology',
      hospital: 'King Fahad Medical City',
      specialization: 'Cardiologist',
      city: 'Riyadh',
      verified: true,
      created_at: now(),
    },
    {
      id: 'dp2', user_id: 'd2',
      full_name: 'Dr. James Okafor',
      degree: 'MBBS, MRCP',
      university: 'University of Edinburgh',
      year_of_passing: 2010,
      highest_degree: 'MRCP – Internal Medicine',
      hospital: 'Cleveland Clinic Abu Dhabi',
      specialization: 'Internal Medicine',
      city: 'Abu Dhabi',
      verified: true,
      created_at: now(),
    },
    {
      id: 'dp3', user_id: 'd3',
      full_name: 'Dr. Priya Nair',
      degree: 'MBBS, MD (Endocrinology)',
      university: 'AIIMS New Delhi',
      year_of_passing: 2015,
      highest_degree: 'MD – Endocrinology',
      hospital: 'Apollo Hospitals',
      specialization: 'Endocrinologist',
      city: 'Chennai',
      verified: true,
      created_at: now(),
    },
    {
      id: 'dp4', user_id: 'd4',
      full_name: 'Dr. Michael Torres',
      degree: 'MD, PhD (Pulmonology)',
      university: 'Johns Hopkins University',
      year_of_passing: 2009,
      highest_degree: 'PhD – Pulmonology',
      hospital: 'Mayo Clinic',
      specialization: 'Pulmonologist',
      city: 'Rochester',
      verified: true,
      created_at: now(),
    },
  ]
  setTable(KEYS.doctors, profiles)
  localStorage.setItem(KEYS.seeded, '1')
}

// ═════════════════════════════════════════════════════════════════════════════
// USERS
// ═════════════════════════════════════════════════════════════════════════════
export const Users = {
  getAll() { return getTable(KEYS.users) },

  findByUsername(username) {
    return this.getAll().find(u => u.username.toLowerCase() === username.toLowerCase()) || null
  },

  findById(id) {
    return this.getAll().find(u => u.id === id) || null
  },

  create({ username, password, role }) {
    const users = this.getAll()
    if (this.findByUsername(username)) throw new Error('Username already taken')
    const user = { id: uuid(), username, password, role, created_at: now() }
    setTable(KEYS.users, [...users, user])
    return user
  },

  authenticate(username, password) {
    const user = this.findByUsername(username)
    if (!user || user.password !== password) return null
    // Never return password to the caller
    const { password: _p, ...safe } = user
    return safe
  },
}

// ═════════════════════════════════════════════════════════════════════════════
// DOCTOR PROFILES
// ═════════════════════════════════════════════════════════════════════════════
export const DoctorProfiles = {
  getAll() { return getTable(KEYS.doctors) },

  findByUserId(userId) {
    return this.getAll().find(p => p.user_id === userId) || null
  },

  getVerified() {
    return this.getAll().filter(p => p.verified)
  },

  create(profileData) {
    const profiles = this.getAll()
    const profile  = { id: uuid(), verified: false, created_at: now(), ...profileData }
    setTable(KEYS.doctors, [...profiles, profile])
    return profile
  },

  update(id, updates) {
    const profiles = this.getAll().map(p => p.id === id ? { ...p, ...updates } : p)
    setTable(KEYS.doctors, profiles)
  },
}

// ═════════════════════════════════════════════════════════════════════════════
// ASSESSMENTS
// ═════════════════════════════════════════════════════════════════════════════
export const Assessments = {
  getAll() { return getTable(KEYS.assessments) },

  getByPatient(userId) {
    return this.getAll()
      .filter(a => a.user_id === userId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  },

  getLatest(userId) {
    return this.getByPatient(userId)[0] || null
  },

  create(data) {
    const assessments = this.getAll()
    const record = { id: uuid(), created_at: now(), ...data }
    setTable(KEYS.assessments, [...assessments, record])
    return record
  },
}

// ═════════════════════════════════════════════════════════════════════════════
// CONSULTATIONS
// ═════════════════════════════════════════════════════════════════════════════
export const Consultations = {
  getAll() { return getTable(KEYS.consults) },

  getByPatient(userId) {
    return this.getAll()
      .filter(c => c.patient_id === userId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  },

  getByDoctor(userId) {
    return this.getAll()
      .filter(c => c.doctor_user_id === userId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  },

  getUnreadCount(doctorUserId) {
    return this.getAll().filter(c => c.doctor_user_id === doctorUserId && !c.read).length
  },

  create({ patientId, patientName, doctorUserId, doctorProfileId, message }) {
    const consults = this.getAll()
    const record = {
      id: uuid(),
      patient_id:       patientId,
      patient_name:     patientName,
      doctor_user_id:   doctorUserId,
      doctor_profile_id: doctorProfileId,
      message,
      status:     'pending',   // pending | accepted | declined
      read:       false,
      created_at: now(),
      updated_at: now(),
    }
    setTable(KEYS.consults, [...consults, record])
    return record
  },

  updateStatus(id, status) {
    const consults = this.getAll().map(c =>
      c.id === id ? { ...c, status, read: true, updated_at: now() } : c
    )
    setTable(KEYS.consults, consults)
  },

  markRead(id) {
    const consults = this.getAll().map(c =>
      c.id === id ? { ...c, read: true, updated_at: now() } : c
    )
    setTable(KEYS.consults, consults)
  },
}
