import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import PublicPage from './pages/PublicPage'
import LoginPage from './pages/LoginPage'
import AdminPage from './pages/AdminPage'

function ProtectedRoute({ children }) {
  const { user, isAdmin, loading } = useAuth()
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#6b6866', fontFamily: 'DM Sans, sans-serif' }}>Loading...</div>
  if (!user) return <Navigate to="/admin/login" replace />
  if (!isAdmin) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#ef4444', fontFamily: 'DM Sans, sans-serif' }}>Access denied.</div>
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicPage />} />
      <Route path="/admin/login" element={<LoginPage />} />
      <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
    </Routes>
  )
}
