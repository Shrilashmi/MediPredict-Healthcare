/**
 * assessments.js — Patient assessment routes
 * GET  /api/assessments (requires auth, role=patient)
 * POST /api/assessments (requires auth, role=patient)
 */

import { Router } from 'express'
import pool from '../db/pool.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

export const assessmentsRouter = Router()

// ── GET /api/assessments ─────────────────────────────────────────────────────
assessmentsRouter.get('/', requireAuth, requireRole('patient'), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM assessments WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    )

    return res.json({ assessments: result.rows })
  } catch (err) {
    console.error('[assessments GET]', err)
    return res.status(500).json({ error: 'Failed to fetch assessments' })
  }
})

// ── POST /api/assessments ────────────────────────────────────────────────────
assessmentsRouter.post('/', requireAuth, requireRole('patient'), async (req, res) => {
  try {
    const { vitals, symptoms, prediction } = req.body

    if (!vitals || !prediction) {
      return res.status(400).json({ error: 'Missing required fields: vitals, prediction' })
    }

    const result = await pool.query(`
      INSERT INTO assessments (user_id, vitals, symptoms, prediction)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [
      req.user.id,
      JSON.stringify(vitals),
      symptoms || [],
      JSON.stringify(prediction)
    ])

    return res.status(201).json({ assessment: result.rows[0] })
  } catch (err) {
    console.error('[assessments POST]', err)
    return res.status(500).json({ error: 'Failed to save assessment' })
  }
})
