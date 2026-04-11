import React from 'react'
import { useParams } from 'react-router-dom'
import { useLinkAnalytics, useProfile } from '../hooks/useData'

const flagEmoji = (code) => {
  if (!code || code.length !== 2) return '🌐'
  return String.fromCodePoint(...code.toUpperCase().split('').map(c => 0x1F1E0 + c.charCodeAt(0) - 65))
}

const SOURCE_ICONS = {
  tiktok: '🎵', facebook: '📘', instagram: '📸', youtube: '▶️',
  twitter: '𝕏', threads: '🧵', linkedin: '💼', email: '📧', direct: '🔗', unknown: '🔗',
}

const aggregate = (arr, key) => {
  const map = {}
  arr.forEach(c => { const v = c[key] || 'unknown'; map[v] = (map[v] || 0) + 1 })
  return Object.entries(map).sort((a, b) => b[1] - a[1])
}

export default function LinkAnalyticsPage() {
  const { linkId } = useParams()
  const { clicks, loading } = useLinkAnalytics(linkId)
  const { profile } = useProfile()

  const linkTitle = clicks[0]?.linkTitle || 'Link'

  const bySource  = aggregate(clicks, 'source')
  const byDevice  = aggregate(clicks, 'device')
  const byBrowser = aggregate(clicks, 'browser')

  const byCountryRaw = {}
  clicks.forEach(c => {
    if (!c.country || c.country === 'unknown') return
    if (!byCountryRaw[c.country]) byCountryRaw[c.country] = { count: 0, code: c.countryCode || '' }
    byCountryRaw[c.country].count++
  })
  const byCountry = Object.entries(byCountryRaw).sort((a, b) => b[1].count - a[1].count).slice(0, 10)

  const today = new Date().toISOString().split('T')[0]
  const clicksToday = clicks.filter(c => c.date === today).length

  const bar = (count, max) => (
    <div style={{ flex: 1, height: 4, background: 'rgba(0,0,0,0.08)', borderRadius: 99, overflow: 'hidden' }}>
      <div style={{
        height: '100%', borderRadius: 99, background: 'var(--accent)',
        width: `${max > 0 ? (count / max) * 100 : 0}%`, transition: 'width 0.4s ease',
      }} />
    </div>
  )

  const cardStyle = {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 16, overflow: 'hidden', marginBottom: 16,
  }
  const headerStyle = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 24px 10px', borderBottom: '1px solid var(--border)',
  }
  const rowStyle = (i) => ({
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '10px 24px', borderTop: i > 0 ? '1px solid var(--border)' : 'none',
  })

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg)', color: 'var(--muted)', fontSize: 14,
        fontFamily: "'SF Pro Display', -apple-system, sans-serif",
      }}>
        Loading analytics...
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: "'SF Pro Display', -apple-system, sans-serif" }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '36px 20px 72px' }}>

        {/* Profile branding */}
        {profile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            {profile.avatarUrl && (
              <img src={profile.avatarUrl} alt="" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)' }} />
            )}
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{profile.name}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>{profile.handle}</div>
            </div>
          </div>
        )}

        {/* Page header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{
            display: 'inline-block', fontSize: 10, fontWeight: 700, letterSpacing: 0.8,
            color: 'var(--accent)', background: 'rgba(74,124,64,0.1)',
            border: '1px solid rgba(74,124,64,0.2)', borderRadius: 6,
            padding: '3px 10px', marginBottom: 10, textTransform: 'uppercase',
          }}>
            Link Analytics
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', lineHeight: 1.25, letterSpacing: '-0.3px' }}>
            {linkTitle}
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>All-time data</div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total Clicks', value: clicks.length, accent: true },
            { label: 'Today',        value: clicksToday },
          ].map(stat => (
            <div key={stat.label} style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 14, padding: '18px 20px',
            }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8, fontWeight: 500, letterSpacing: 0.2 }}>
                {stat.label}
              </div>
              <div style={{
                fontSize: 36, fontWeight: 800, lineHeight: 1,
                color: stat.accent ? 'var(--accent)' : 'var(--text)',
              }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {clicks.length === 0 ? (
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 16, padding: '60px 20px', textAlign: 'center',
            color: 'var(--muted)', fontSize: 14,
          }}>
            No analytics data for this link yet.
          </div>
        ) : (
          <>
            {/* Traffic Sources */}
            <div style={cardStyle}>
              <div style={headerStyle}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Traffic Sources</span>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>Clicks ↓</span>
              </div>
              {bySource.map(([src, count], i) => (
                <div key={src} style={rowStyle(i)}>
                  <span style={{ fontSize: 16, width: 22, textAlign: 'center', flexShrink: 0 }}>{SOURCE_ICONS[src] || '🔗'}</span>
                  <span style={{ fontSize: 13, color: 'var(--text)', width: 90, flexShrink: 0, textTransform: 'capitalize' }}>{src}</span>
                  {bar(count, bySource[0]?.[1] || 1)}
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', minWidth: 28, textAlign: 'right' }}>{count}</span>
                </div>
              ))}
            </div>

            {/* Devices */}
            <div style={cardStyle}>
              <div style={headerStyle}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Devices</span>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>Clicks ↓</span>
              </div>
              {byDevice.map(([device, count], i) => {
                const icon = device === 'mobile' ? '📱' : device === 'desktop' ? '🖥' : device === 'tablet' ? '📟' : '❓'
                const pct = clicks.length > 0 ? `${((count / clicks.length) * 100).toFixed(1)}%` : '—'
                return (
                  <div key={device} style={rowStyle(i)}>
                    <span style={{ fontSize: 16, width: 22, textAlign: 'center', flexShrink: 0 }}>{icon}</span>
                    <span style={{ fontSize: 13, color: 'var(--text)', width: 90, flexShrink: 0, textTransform: 'capitalize' }}>{device}</span>
                    {bar(count, byDevice[0]?.[1] || 1)}
                    <span style={{ fontSize: 12, color: 'var(--muted)', minWidth: 40, textAlign: 'right' }}>{pct}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', minWidth: 28, textAlign: 'right' }}>{count}</span>
                  </div>
                )
              })}
            </div>

            {/* Countries */}
            {byCountry.length > 0 && (
              <div style={cardStyle}>
                <div style={headerStyle}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Top Countries</span>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>Clicks ↓</span>
                </div>
                {byCountry.map(([country, { count, code }], i) => (
                  <div key={country} style={rowStyle(i)}>
                    <span style={{ fontSize: 16, width: 22, textAlign: 'center', flexShrink: 0 }}>{flagEmoji(code)}</span>
                    <span style={{ fontSize: 13, color: 'var(--text)', width: 130, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{country}</span>
                    {bar(count, byCountry[0]?.[1]?.count || 1)}
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', minWidth: 28, textAlign: 'right' }}>{count}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Browsers */}
            <div style={cardStyle}>
              <div style={headerStyle}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Browsers</span>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>Clicks ↓</span>
              </div>
              {byBrowser.map(([browser, count], i) => {
                const icon = browser === 'chrome' ? '🟡' : browser === 'safari' ? '🔵' : browser === 'firefox' ? '🟠' : browser === 'edge' ? '🟦' : '🌐'
                return (
                  <div key={browser} style={rowStyle(i)}>
                    <span style={{ fontSize: 16, width: 22, textAlign: 'center', flexShrink: 0 }}>{icon}</span>
                    <span style={{ fontSize: 13, color: 'var(--text)', width: 90, flexShrink: 0, textTransform: 'capitalize' }}>{browser}</span>
                    {bar(count, byBrowser[0]?.[1] || 1)}
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', minWidth: 28, textAlign: 'right' }}>{count}</span>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 32, fontSize: 12, color: 'var(--muted)' }}>
          Powered by{' '}
          <a href="/" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
            {profile?.handle || 'johntagudin.com'}
          </a>
        </div>

      </div>
    </div>
  )
}
