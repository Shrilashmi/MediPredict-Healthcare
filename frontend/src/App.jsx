import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import LandingPage from './components/LandingPage.jsx'
import AuthPage from './components/AuthPage.jsx'
import AdminLogin from './components/AdminLogin.jsx'
import AdminDashboard from './components/AdminDashboard.jsx'
import PatientPortal from './components/patient/PatientPortal.jsx'
import DoctorPortal from './components/doctor/DoctorPortal.jsx'

// ── Existing patient/doctor protected route ──────────────────────────────────
function ProtectedRoute({ children, requiredRole }) {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  if (requiredRole && user.role !== requiredRole) {
    if (user.role === 'admin') {
      return <Navigate to="/admin" replace />
    }

    if (user.role === 'doctor') {
      return <Navigate to="/doctor" replace />
    }

    return <Navigate to="/patient" replace />
  }

  return children
}

// ── Admin protected route ─────────────────────────────────────────────────────
function AdminRoute({ children }) {
  const token = localStorage.getItem('token')
  const storedAdmin = localStorage.getItem('admin_user')

  if (!token || !storedAdmin) {
    return <Navigate to="/admin-login" replace />
  }

  try {
    const admin = JSON.parse(storedAdmin)

    if (admin.role !== 'admin') {
      localStorage.removeItem('token')
      localStorage.removeItem('admin_user')
      return <Navigate to="/admin-login" replace />
    }

    return children
  } catch {
    localStorage.removeItem('token')
    localStorage.removeItem('admin_user')
    return <Navigate to="/admin-login" replace />
  }
}


// ── App routes ────────────────────────────────────────────────────────────────
function AppRoutes() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      {/* Patient / Doctor authentication */}
      <Route
        path="/auth"
        element={
          user ? (
            <Navigate
              to={user.role === 'doctor' ? '/doctor' : '/patient'}
              replace
            />
          ) : (
            <AuthPage />
          )
        }
      />

      {/* Separate Admin Login */}
      <Route
        path="/admin-login"
        element={<AdminLogin />}
      />

      {/* Patient portal */}
      <Route
        path="/patient/*"
        element={
          <ProtectedRoute requiredRole="patient">
            <PatientPortal />
          </ProtectedRoute>
        }
      />

      {/* Doctor portal */}
      <Route
        path="/doctor/*"
        element={
          <ProtectedRoute requiredRole="doctor">
            <DoctorPortal />
          </ProtectedRoute>
        }
      />

      {/* Admin dashboard */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}