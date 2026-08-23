/**
 * doctors.js — Doctor profile routes
 * GET  /api/doctors (public — returns verified doctors)
 * GET  /api/doctors/me (requires auth, role=doctor)
 * POST /api/doctors/onboard (requires auth, role=doctor)
 */

import { Router } from 'express'
import pool from '../db/pool.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

export const doctorsRouter = Router()

// ── GET /api/doctors (public — verified doctors only) ───────────────────────
doctorsRouter.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        dp.id, dp.user_id, dp.full_name, dp.degree, dp.university,
        dp.year_of_passing, dp.highest_degree, dp.hospital,
        dp.specialization, dp.city, dp.verified, dp.created_at
      FROM doctor_profiles dp
      WHERE dp.verified = TRUE
      ORDER BY dp.full_name
    `)

    return res.json({ doctors: result.rows })
  } catch (err) {
    console.error('[doctors GET]', err)
    return res.status(500).json({ error: 'Failed to fetch doctors' })
  }
})

// ── GET /api/doctors/me ──────────────────────────────────────────────────────
doctorsRouter.get('/me', requireAuth, requireRole('doctor'), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM doctor_profiles WHERE user_id = $1',
      [req.user.id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' })
    }

    return res.json({ profile: result.rows[0] })
  } catch (err) {
    console.error('[doctors/me]', err)
    return res.status(500).json({ error: 'Failed to fetch profile' })
  }
})

// ── POST /api/doctors/onboard ────────────────────────────────────────────────
doctorsRouter.post('/onboard', requireAuth, requireRole('doctor'), async (req, res) => {
  try {
    const {
      full_name, degree, university, year_of_passing,
      highest_degree, hospital, specialization, city
    } = req.body

    // Validate required fields
    const required = ['full_name', 'degree', 'university', 'year_of_passing', 'highest_degree', 'hospital', 'specialization', 'city']
    for (const field of required) {
      if (!req.body[field]) {
        return res.status(400).json({ error: `Missing required field: ${field}` })
      }
    }

    // Check if profile already exists
    const existing = await pool.query(
      'SELECT id FROM doctor_profiles WHERE user_id = $1',
      [req.user.id]
    )
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Profile already exists' })
    }

    // Insert profile
    const result = await pool.query(`
      INSERT INTO doctor_profiles (
        user_id, full_name, degree, university, year_of_passing,
        highest_degree, hospital, specialization, city, verified
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, FALSE)
      RETURNING *
    `, [
      req.user.id, full_name, degree, university, year_of_passing,
      highest_degree, hospital, specialization, city
    ])

    return res.status(201).json({ profile: result.rows[0] })
  } catch (err) {
    console.error('[doctors/onboard]', err)
    return res.status(500).json({ error: 'Onboarding failed' })
  }
})
