/**
 * db.js — localStorage data layer + API-backed consultations
 *
 * Tables (localStorage keys):
 *   mp_users            → users[]
 *   mp_doctor_profiles  → doctor_profiles[]
 *   mp_assessments      → assessments[]
 *
 * Consultations are stored in PostgreSQL through the backend API.
 */

import { api } from '../config/api.js'

// ── Helpers ───────────────────────────────────────────────────────────────────

const uuid = () =>
    crypto.randomUUID ?
    crypto.randomUUID() :
    Math.random().toString(36).slice(2)

const now = () => new Date().toISOString()

function getTable(key) {
    try {
        return JSON.parse(localStorage.getItem(key) || '[]')
    } catch {
        return []
    }
}

function setTable(key, data) {
    localStorage.setItem(key, JSON.stringify(data))
}

// ── Keys ──────────────────────────────────────────────────────────────────────

const KEYS = {
    users: 'mp_users',
    doctors: 'mp_doctor_profiles',
    assessments: 'mp_assessments',
    seeded: 'mp_seeded',
}

// ═════════════════════════════════════════════════════════════════════════════
// SEED — 4 verified doctors
// ═════════════════════════════════════════════════════════════════════════════

export function seedIfNeeded() {
    if (localStorage.getItem(KEYS.seeded)) return

    const doctorUsers = [{
            id: 'd1',
            username: 'dr.sarah',
            password: 'doctor123',
            role: 'doctor',
            created_at: now(),
        },
        {
            id: 'd2',
            username: 'dr.james',
            password: 'doctor123',
            role: 'doctor',
            created_at: now(),
        },
        {
            id: 'd3',
            username: 'dr.priya',
            password: 'doctor123',
            role: 'doctor',
            created_at: now(),
        },
        {
            id: 'd4',
            username: 'dr.michael',
            password: 'doctor123',
            role: 'doctor',
            created_at: now(),
        },
    ]

    setTable(KEYS.users, doctorUsers)

    const profiles = [{
            id: 'dp1',
            user_id: 'd1',
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
            id: 'dp2',
            user_id: 'd2',
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
            id: 'dp3',
            user_id: 'd3',
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
            id: 'dp4',
            user_id: 'd4',
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
    getAll() {
        return getTable(KEYS.users)
    },

    findByUsername(username) {
        return (
            this.getAll().find(
                (u) =>
                u.username &&
                username &&
                u.username.toLowerCase() === username.toLowerCase()
            ) || null
        )
    },

    findById(id) {
        return this.getAll().find((u) => u.id === id) || null
    },

    create({ username, password, role }) {
        const users = this.getAll()

        if (this.findByUsername(username)) {
            throw new Error('Username already taken')
        }

        const user = {
            id: uuid(),
            username,
            password,
            role,
            created_at: now(),
        }

        setTable(KEYS.users, [...users, user])
        return user
    },

    authenticate(username, password) {
        const user = this.findByUsername(username)

        if (!user || user.password !== password) {
            return null
        }

        const { password: _p, ...safe } = user
        return safe
    },
}

// ═════════════════════════════════════════════════════════════════════════════
// DOCTOR PROFILES
// ═════════════════════════════════════════════════════════════════════════════

export const DoctorProfiles = {
    getAll() {
        return getTable(KEYS.doctors)
    },

    findByUserId(userId) {
        return this.getAll().find((p) => p.user_id === userId) || null
    },

    getVerified() {
        return this.getAll().filter((p) => p.verified)
    },

    create(profileData) {
        const profiles = this.getAll()

        const profile = {
            id: uuid(),
            verified: false,
            created_at: now(),
            ...profileData,
        }

        setTable(KEYS.doctors, [...profiles, profile])
        return profile
    },

    update(id, updates) {
        const profiles = this.getAll().map((p) =>
            p.id === id ? {...p, ...updates } : p
        )

        setTable(KEYS.doctors, profiles)
    },
}

// ═════════════════════════════════════════════════════════════════════════════
// ASSESSMENTS
// ═════════════════════════════════════════════════════════════════════════════

export const Assessments = {
    getAll() {
        return getTable(KEYS.assessments)
    },

    getByPatient(userId) {
        return this.getAll()
            .filter((a) => a.user_id === userId)
            .sort(
                (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime()
            )
    },

    getLatest(userId) {
        return this.getByPatient(userId)[0] || null
    },

    create(data) {
        const assessments = this.getAll()

        const record = {
            id: uuid(),
            created_at: now(),
            ...data,
        }

        setTable(KEYS.assessments, [...assessments, record])

        return record
    },
}

// ═════════════════════════════════════════════════════════════════════════════
// CONSULTATIONS — PostgreSQL API
// ═════════════════════════════════════════════════════════════════════════════

export const Consultations = {
    // Get all consultations for the currently authenticated user.
    async getAll() {
        const response = await api.get('/api/consultations')
        return response?.consultations || []
    },

    // Get consultations belonging to a patient.
    async getByPatient(userId) {
        const consultations = await this.getAll()

        return consultations
            .filter((c) => c.patient_id === userId)
            .sort(
                (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime()
            )
    },

    // Get consultations belonging to a doctor.
    async getByDoctor(userId) {
        const consultations = await this.getAll()

        return consultations
            .filter((c) => c.doctor_user_id === userId)
            .sort(
                (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime()
            )
    },

    // Get unread consultation count for a doctor.
    async getUnreadCount(doctorUserId) {
        const consultations = await this.getByDoctor(doctorUserId)

        return consultations.filter((c) => !c.read).length
    },

    // Create a consultation in PostgreSQL.
    async create({
        patientId,
        patientName,
        doctorUserId,
        doctorProfileId,
        message,
    }) {
        const response = await api.post('/api/consultations', {
            doctor_user_id: doctorUserId,
            doctor_profile_id: doctorProfileId,
            message,
        })

        return response?.consultation
    },

    // Accept or decline a consultation.
    async updateStatus(id, status) {
        const response = await api.patch(
            ` / api / consultations / $ { id }
/status`, { status }
        )

        return response?.consultation
    },

    // Mark a consultation as read.
    async markRead(id) {
        const response = await api.patch(
            `/api/consultations/${id}/read`, {}
        )

        return response?.consultation
    },
}
