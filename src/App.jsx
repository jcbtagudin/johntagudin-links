import React from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { useSettings } from './hooks/useData'
import PublicPage from './pages/PublicPage'
import LoginPage from './pages/LoginPage'
import AdminPage from './pages/AdminPage'
import LinkAnalyticsPage from './pages/LinkAnalyticsPage'
import LinkRedirectPage from './pages/LinkRedirectPage'
import MaintenancePage from './pages/MaintenancePage'

function ProtectedRoute({ children }) {
  const { user, isAdmin, loading } = useAuth()
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#6b6866', fontFamily: 'DM Sans, sans-serif' }}>Loading...</div>
  if (!user) return <Navigate to="/admin/login" replace />
  if (!isAdmin) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#ef4444', fontFamily: 'DM Sans, sans-serif' }}>Access denied.</div>
  return children
}

function MaintenanceGate({ children }) {
  const { settings, loading } = useSettings()
  const { isAdmin } = useAuth()
  const location = useLocation()

  // Always allow admin routes through
  if (location.pathname.startsWith('/admin')) return children
  if (loading) return null
  if (settings?.maintenanceMode && !isAdmin) return <MaintenancePage />
  return children
}

export default function App() {
  return (
    <MaintenanceGate>
      <Routes>
        <Route path="/" element={<PublicPage />} />
        <Route path="/admin/login" element={<LoginPage />} />
        <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
        <Route path="/analytics/:linkId" element={<LinkAnalyticsPage />} />
        <Route path="/l/:linkId" element={<LinkRedirectPage />} />
      </Routes>
    </MaintenanceGate>
  )
}
