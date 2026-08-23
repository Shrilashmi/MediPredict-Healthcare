/**
 * auth.js — Authentication routes
 * POST /api/auth/register
 * POST /api/auth/login
 * GET  /api/auth/me (requires auth)
 */

import { Router } from 'express'
import pool from '../db/pool.js'
import { hashPassword, comparePassword } from '../utils/password.js'
import { signToken } from '../utils/jwt.js'
import { requireAuth } from '../middleware/auth.js'

export const authRouter = Router()

// ── POST /api/auth/register ──────────────────────────────────────────────────
authRouter.post('/register', async (req, res) => {
  try {
    const { username, password, role } = req.body

    // Validate
    if (!username || !password || !role) {
      return res.status(400).json({ error: 'Missing required fields' })
    }
    if (!['patient', 'doctor'].includes(role)) {
      return res.status(400).json({ error: 'Role must be patient or doctor' })
    }
    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' })
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    }

    // Check if username exists
    const existing = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    )
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Username already taken' })
    }

    // Hash password and insert user
    const hashedPassword = await hashPassword(password)
    const result = await pool.query(
      'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id, username, role, created_at',
      [username, hashedPassword, role]
    )

    const user = result.rows[0]
    const token = signToken({ id: user.id, username: user.username, role: user.role })

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        created_at: user.created_at,
      }
    })
  } catch (err) {
    console.error('[auth/register]', err)
    return res.status(500).json({ error: 'Registration failed' })
  }
})

// ── POST /api/auth/login ─────────────────────────────────────────────────────
authRouter.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ error: 'Missing username or password' })
    }

    // Find user
    const result = await pool.query(
      'SELECT id, username, password, role, created_at FROM users WHERE username = $1',
      [username]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' })
    }

    const user = result.rows[0]

    // Verify password
    const isValid = await comparePassword(password, user.password)
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid username or password' })
    }

    // Generate token
    const token = signToken({ id: user.id, username: user.username, role: user.role })

    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        created_at: user.created_at,
      }
    })
  } catch (err) {
    console.error('[auth/login]', err)
    return res.status(500).json({ error: 'Login failed' })
  }
})

// ── GET /api/auth/me ─────────────────────────────────────────────────────────
authRouter.get('/me', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    return res.json({ user: result.rows[0] })
  } catch (err) {
    console.error('[auth/me]', err)
    return res.status(500).json({ error: 'Failed to fetch user' })
  }
})
