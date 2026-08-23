/**
 * helpers.js — shared utility functions
 */

export function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

export function formatDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function timeAgo(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins  < 1)   return 'Just now'
  if (mins  < 60)  return `${mins}m ago`
  if (hours < 24)  return `${hours}h ago`
  if (days  < 7)   return `${days}d ago`
  return formatDate(iso)
}

export function riskColor(risk) {
  switch (risk) {
    case 'high':     return 'var(--color-danger)'
    case 'moderate': return 'var(--color-warning)'
    case 'low':      return 'var(--color-success)'
    default:         return 'var(--color-text-muted)'
  }
}

export function riskBadgeClass(risk) {
  switch (risk) {
    case 'high':     return 'badge badge-red'
    case 'moderate': return 'badge badge-amber'
    case 'low':      return 'badge badge-green'
    default:         return 'badge badge-gray'
  }
}

export function triageClass(triage) {
  switch (triage) {
    case 'urgent':  return 'badge badge-red'
    case 'watch':   return 'badge badge-amber'
    case 'routine': return 'badge badge-green'
    default:        return 'badge badge-gray'
  }
}

export function triageLabel(triage) {
  switch (triage) {
    case 'urgent':  return '🚨 Urgent'
    case 'watch':   return '⚠️ Watch'
    case 'routine': return '✅ Routine'
    default:        return triage
  }
}

export function capitalize(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function initials(name) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}
