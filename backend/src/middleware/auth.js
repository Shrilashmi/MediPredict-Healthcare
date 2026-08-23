/**
 * auth.js — Authentication middleware
 * 
 * Extracts JWT from Authorization header and attaches user to req.user
 */

import { verifyToken } from '../utils/jwt.js'

/**
 * Middleware: require authentication
 * Attaches req.user = { id, username, role }
 */
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' })
  }

  const token = authHeader.substring(7) // Remove 'Bearer '
  const decoded = verifyToken(token)

  if (!decoded) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' })
  }

  req.user = decoded // { id, username, role }
  next()
}

/**
 * Middleware: require specific role
 * @param {string} role - 'patient' or 'doctor'
 */
export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: No user in request' })
    }
    
    if (req.user.role !== role) {
      return res.status(403).json({ error: `Forbidden: Requires ${role} role` })
    }
    
    next()
  }
}
