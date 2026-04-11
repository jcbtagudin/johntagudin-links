import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useLinks, usePinned, logClick } from '../hooks/useData'

function detectSource() {
  const refParam = new URLSearchParams(window.location.search).get('ref')
  if (refParam) return refParam.toLowerCase()
  if (!document.referrer) return 'direct'
  try {
    const host = new URL(document.referrer).hostname.toLowerCase()
    if (host.includes('tiktok'))                          return 'tiktok'
    if (host.includes('facebook') || host.includes('fb.')) return 'facebook'
    if (host.includes('instagram'))                        return 'instagram'
    if (host.includes('youtube') || host.includes('youtu.be')) return 'youtube'
    if (host.includes('twitter') || host.includes('x.com'))    return 'twitter'
    if (host.includes('threads'))                          return 'threads'
    if (host.includes('linkedin'))                         return 'linkedin'
    if (host.includes('email') || host.includes('mail'))   return 'email'
    return host
  } catch {
    return 'direct'
  }
}

function collectMeta() {
  const ua = navigator.userAgent
  const isTablet = /iPad|Android(?!.*Mobile)/i.test(ua)
  const isMobile = /iPhone|iPad|iPod|Android/i.test(ua)
  return {
    source:  detectSource(),
    device:  isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop',
    browser: ua.includes('Chrome') && !ua.includes('Edg') ? 'chrome'
           : ua.includes('Safari') && !ua.includes('Chrome') ? 'safari'
           : ua.includes('Firefox') ? 'firefox'
           : ua.includes('Edg') ? 'edge' : 'other',
    os: ua.includes('iPhone') || ua.includes('iPad') ? 'ios'
      : ua.includes('Android') ? 'android'
      : ua.includes('Windows') ? 'windows'
      : ua.includes('Mac') ? 'macos'
      : ua.includes('Linux') ? 'linux' : 'other',
    country: 'unknown',
    countryCode: 'unknown',
  }
}

export default function LinkRedirectPage() {
  const { linkId } = useParams()
  const { data: linksData, loading: linksLoading } = useLinks()
  const { pinned, loading: pinnedLoading } = usePinned()
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (linksLoading || pinnedLoading) return

    // Resolve link from data
    let found = null
    let sectionId = null

    if (linkId === 'pinned' && pinned?.url) {
      found = { id: 'pinned', title: pinned.title, url: pinned.url }
      sectionId = 'pinned'
    }

    if (!found && linksData?.sections) {
      for (const section of linksData.sections) {
        const link = section.links?.find(l => l.id === linkId)
        if (link) { found = link; sectionId = section.id; break }
      }
    }

    if (!found?.url) { setNotFound(true); return }

    // Log click then redirect
    const baseMeta = collectMeta()
    ;(async () => {
      try {
        const geo = await fetch('https://ipapi.co/json/').then(r => r.ok ? r.json() : null)
        await logClick(found.id, found.title, sectionId, {
          ...baseMeta,
          country:     geo?.country_name || 'unknown',
          countryCode: geo?.country_code || 'unknown',
        })
      } catch {
        await logClick(found.id, found.title, sectionId, baseMeta).catch(() => {})
      }
      window.location.replace(found.url)
    })()
  }, [linksLoading, pinnedLoading]) // eslint-disable-line react-hooks/exhaustive-deps

  if (notFound) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 12,
        background: 'var(--bg)', fontFamily: "'SF Pro Display', -apple-system, sans-serif",
      }}>
        <div style={{ fontSize: 40 }}>🔍</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Link not found</div>
        <a href="/" style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>← Go back</a>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 12,
      background: 'var(--bg)', fontFamily: "'SF Pro Display', -apple-system, sans-serif",
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        border: '3px solid var(--accent)', borderTopColor: 'transparent',
        animation: 'spin 0.7s linear infinite',
      }} />
      <div style={{ fontSize: 13, color: 'var(--muted)' }}>Redirecting...</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
