/**
 * jwt.js — JSON Web Token utilities
 */

import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()

const SECRET = process.env.JWT_SECRET || 'fallback_secret_change_in_production'
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

/**
 * Sign a JWT token with user payload
 * @param {object} payload - { id, username, role }
 * @returns {string} JWT token
 */
export function signToken(payload) {
    return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN })
}

/**
 * Verify and decode a JWT token
 * @param {string} token 
 * @returns {object|null} decoded payload or null if invalid
 */
export function verifyToken(token) {
    try {
        return jwt.verify(token, SECRET)
    } catch {
        return null
    }
}