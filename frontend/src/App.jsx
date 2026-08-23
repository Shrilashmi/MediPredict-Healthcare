import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import LandingPage    from './components/LandingPage.jsx'
import AuthPage       from './components/AuthPage.jsx'
import PatientPortal  from './components/patient/PatientPortal.jsx'
import DoctorPortal   from './components/doctor/DoctorPortal.jsx'

// ── Protected route wrapper ───────────────────────────────────────────────────
function ProtectedRoute({ children, requiredRole }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/auth" replace />
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={user.role === 'doctor' ? '/doctor' : '/patient'} replace />
  }
  return children
}

// ── App shell ─────────────────────────────────────────────────────────────────
function AppRoutes() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/auth"
        element={user
          ? <Navigate to={user.role === 'doctor' ? '/doctor' : '/patient'} replace />
          : <AuthPage />
        }
      />
      <Route
        path="/patient/*"
        element={
          <ProtectedRoute requiredRole="patient">
            <PatientPortal />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/*"
        element={
          <ProtectedRoute requiredRole="doctor">
            <DoctorPortal />
          </ProtectedRoute>
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
