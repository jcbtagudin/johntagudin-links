import React from 'react'
import { useSettings } from '../hooks/useData'
import { useProfile } from '../hooks/useData'

export default function MaintenancePage() {
  const { settings } = useSettings()
  const { profile } = useProfile()

  const title   = settings?.maintenanceTitle   || 'Under Maintenance'
  const message = settings?.maintenanceMessage || "We'll be back shortly. Thanks for your patience!"

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', fontFamily: "'SF Pro Display', -apple-system, sans-serif",
      padding: '40px 20px', textAlign: 'center',
    }}>
      {profile?.avatarUrl && (
        <img
          src={profile.avatarUrl}
          alt=""
          style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', marginBottom: 20, border: '2px solid var(--border)' }}
        />
      )}

      <div style={{ fontSize: 48, marginBottom: 16 }}>🚧</div>

      <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 10, letterSpacing: '-0.3px' }}>
        {title}
      </div>

      <div style={{ fontSize: 14, color: 'var(--muted)', maxWidth: 340, lineHeight: 1.6 }}>
        {message}
      </div>

      {profile?.handle && (
        <div style={{ marginTop: 32, fontSize: 12, color: 'var(--muted)' }}>
          {profile.handle}
        </div>
      )}
    </div>
  )
}
