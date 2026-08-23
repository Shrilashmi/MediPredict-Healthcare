/**
 * consultations.js — Consultation request routes
 * GET    /api/consultations (requires auth) — returns user's consultations
 * POST   /api/consultations (requires auth, role=patient)
 * PATCH  /api/consultations/:id/status (requires auth, role=doctor)
 * PATCH  /api/consultations/:id/read (requires auth, role=doctor)
 */

import { Router } from 'express'
import pool from '../db/pool.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

export const consultationsRouter = Router()

// ── GET /api/consultations ───────────────────────────────────────────────────
consultationsRouter.get('/', requireAuth, async (req, res) => {
  try {
    let query, params

    if (req.user.role === 'patient') {
      query = 'SELECT * FROM consultations WHERE patient_id = $1 ORDER BY created_at DESC'
      params = [req.user.id]
    } else if (req.user.role === 'doctor') {
      query = 'SELECT * FROM consultations WHERE doctor_user_id = $1 ORDER BY created_at DESC'
      params = [req.user.id]
    } else {
      return res.status(403).json({ error: 'Invalid user role' })
    }

    const result = await pool.query(query, params)
    return res.json({ consultations: result.rows })
  } catch (err) {
    console.error('[consultations GET]', err)
    return res.status(500).json({ error: 'Failed to fetch consultations' })
  }
})

// ── POST /api/consultations ──────────────────────────────────────────────────
consultationsRouter.post('/', requireAuth, requireRole('patient'), async (req, res) => {
  try {
    const { doctor_user_id, doctor_profile_id, message } = req.body

    if (!doctor_user_id || !doctor_profile_id || !message) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Get patient name
    const userResult = await pool.query('SELECT username FROM users WHERE id = $1', [req.user.id])
    const patient_name = userResult.rows[0]?.username || 'Unknown'

    const result = await pool.query(`
      INSERT INTO consultations (
        patient_id, patient_name, doctor_user_id, doctor_profile_id, message
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [req.user.id, patient_name, doctor_user_id, doctor_profile_id, message])

    return res.status(201).json({ consultation: result.rows[0] })
  } catch (err) {
    console.error('[consultations POST]', err)
    return res.status(500).json({ error: 'Failed to create consultation' })
  }
})

// ── PATCH /api/consultations/:id/status ──────────────────────────────────────
consultationsRouter.patch('/:id/status', requireAuth, requireRole('doctor'), async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!['accepted', 'declined'].includes(status)) {
      return res.status(400).json({ error: 'Status must be accepted or declined' })
    }

    // Verify ownership
    const check = await pool.query(
      'SELECT id FROM consultations WHERE id = $1 AND doctor_user_id = $2',
      [id, req.user.id]
    )
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Consultation not found or access denied' })
    }

    const result = await pool.query(
      'UPDATE consultations SET status = $1, read = TRUE WHERE id = $2 RETURNING *',
      [status, id]
    )

    return res.json({ consultation: result.rows[0] })
  } catch (err) {
    console.error('[consultations PATCH status]', err)
    return res.status(500).json({ error: 'Failed to update status' })
  }
})

// ── PATCH /api/consultations/:id/read ────────────────────────────────────────
consultationsRouter.patch('/:id/read', requireAuth, requireRole('doctor'), async (req, res) => {
  try {
    const { id } = req.params

    // Verify ownership
    const check = await pool.query(
      'SELECT id FROM consultations WHERE id = $1 AND doctor_user_id = $2',
      [id, req.user.id]
    )
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Consultation not found or access denied' })
    }

    const result = await pool.query(
      'UPDATE consultations SET read = TRUE WHERE id = $1 RETURNING *',
      [id]
    )

    return res.json({ consultation: result.rows[0] })
  } catch (err) {
    console.error('[consultations PATCH read]', err)
    return res.status(500).json({ error: 'Failed to mark as read' })
  }
})
