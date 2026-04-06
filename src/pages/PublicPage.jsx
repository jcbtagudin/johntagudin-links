import React, { useState, useEffect } from 'react'
import { useProfile, useLinks, usePinned, useProducts, logClick, logPageView } from '../hooks/useData'
import SocialIcon from '../components/SocialIcon'
import styles from './PublicPage.module.css'

const BADGE_MAP = {
  free: { label: 'Free', cls: 'badgeFree' },
  new:  { label: 'New',  cls: 'badgeNew'  },
  hot:  { label: '🔥 Hot', cls: 'badgeHot' },
}

// Returns false if the link is outside its scheduled window
function isLinkLive(link) {
  const now = new Date()
  if (link.startDate && new Date(link.startDate) > now) return false
  if (link.endDate && new Date(link.endDate) < now) return false
  return true
}

// Triggers the cursor hint on load, then again 30 s later
function useCursorHint() {
  const [active, setActive] = useState(false)
  useEffect(() => {
    const DURATION = 3600
    const play = () => {
      setActive(true)
      setTimeout(() => setActive(false), DURATION)
    }
    const t1 = setTimeout(play, 900)        // first play after page settles
    const loop = setInterval(play, 20000)   // then every 20 s
    return () => { clearTimeout(t1); clearInterval(loop) }
  }, [])
  return active
}

// Collects source/device/browser/OS/country once on mount, logs a page view
function useVisitorMeta() {
  const [meta, setMeta] = useState(() => {
    const source = new URLSearchParams(window.location.search).get('ref') || 'direct'
    const ua = navigator.userAgent
    const isTablet = /iPad|Android(?!.*Mobile)/i.test(ua)
    const isMobile = /iPhone|iPad|iPod|Android/i.test(ua)
    const device   = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop'
    const browser  =
      ua.includes('Chrome') && !ua.includes('Edg') ? 'chrome' :
      ua.includes('Safari') && !ua.includes('Chrome') ? 'safari' :
      ua.includes('Firefox') ? 'firefox' :
      ua.includes('Edg') ? 'edge' : 'other'
    const os =
      ua.includes('iPhone') || ua.includes('iPad') ? 'ios' :
      ua.includes('Android') ? 'android' :
      ua.includes('Windows') ? 'windows' :
      ua.includes('Mac') ? 'macos' :
      ua.includes('Linux') ? 'linux' : 'other'
    return { source, device, browser, os, country: 'unknown', countryCode: 'unknown' }
  })

  useEffect(() => {
    const base = meta
    fetch('https://ipapi.co/json/')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const full = {
          ...base,
          country:     data?.country_name || 'unknown',
          countryCode: data?.country_code || 'unknown',
        }
        setMeta(full)
        logPageView(full)
      })
      .catch(() => logPageView(base))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return meta
}

export default function PublicPage() {
  const { profile, loading: pl } = useProfile()
  const { data, loading: ll } = useLinks()
  const { pinned, loading: pinnedLoading } = usePinned()
  const { products, loading: productsLoading } = useProducts()
  const cursorActive = useCursorHint()
  const meta = useVisitorMeta()

  if (pl || ll || pinnedLoading || productsLoading) return (
    <div className={styles.loadWrap}>
      <div className={styles.loadDot} />
    </div>
  )

  const visibleSocials = data.socials?.filter(s => s.visible) || []
  const visibleSections = data.sections?.filter(s => s.visible) || []

  return (
    <div className={styles.page}>
      <div className={styles.glow} />
      <div className={styles.container}>

        {/* HERO */}
        <div className={styles.hero}>
          <div className={styles.avatarWrap}>
            <div className={styles.avatar}>
              {profile.avatarUrl
                ? <img src={profile.avatarUrl} alt={profile.name} onError={e => e.target.style.display = 'none'} />
                : null}
              <span className={styles.avatarFallback}>JT</span>
            </div>
          </div>
          <div className={styles.name}>{profile.name}</div>
          {profile.status && (
            <div className={styles.statusBadge}>
              <span className={styles.statusDot} />
              {profile.status}
            </div>
          )}
          <div className={styles.handle}>{profile.handle}</div>
          <div className={styles.bio}>
            {profile.bioHighlight
              ? renderBioWithHighlight(profile.bio, profile.bioHighlight)
              : profile.bio}
          </div>
        </div>

        {/* SOCIALS */}
        {visibleSocials.length > 0 && (
          <div className={styles.socials}>
            {visibleSocials.map(s => (
              <a key={s.id} href={s.url} target="_blank" rel="noopener" className={styles.pill}>
                <SocialIcon name={s.icon} />
                {s.label}
              </a>
            ))}
          </div>
        )}

        {/* LATEST VIDEO — top position (default) */}
        {profile.showLatestVideo !== false && profile.latestVideoPosition !== 'bottom' && (
          <LatestVideoCard inlinePreview={!!profile.latestVideoInline} />
        )}

        {/* PINNED LINK */}
        {pinned?.enabled && pinned?.url && (
          <div className={styles.pinnedSection}>
            <div className={styles.pinnedLabel}>📌 Pinned</div>
            <div className={`${styles.pinnedGlowWrap} ${cursorActive ? styles.pinnedGlowBounce : ''}`}>

              <a
                href={pinned.url}
                target="_blank"
                rel="noopener"
                className={styles.pinnedCard}
                onClick={() => logClick('pinned', pinned.title, 'pinned', meta)}
              >
                {pinned.thumbnailUrl && (
                  <div className={styles.pinnedThumb}>
                    <img
                      src={pinned.thumbnailUrl}
                      alt={pinned.title}
                      onError={e => e.target.style.display = 'none'}
                    />
                  </div>
                )}
                <div className={styles.pinnedCardBody}>
                  <div className={`${styles.icon} ${pinned.iconUrl ? styles.iconImg : styles.iconAccent}`}>
                    {pinned.iconUrl
                      ? <img src={pinned.iconUrl} alt="" onError={e => e.target.style.display = 'none'} />
                      : pinned.icon}
                  </div>
                  <div className={styles.cardText}>
                    <div className={`${styles.cardTitle} ${styles.pinnedTitle}`}>{pinned.title}</div>
                    <div className={`${styles.cardSub} ${styles.pinnedSub}`}>{pinned.subtitle}</div>
                  </div>
                  {BADGE_MAP[pinned.badge] && (
                    <span className={`${styles.badge} ${styles.pinnedBadge}`}>
                      {BADGE_MAP[pinned.badge].label}
                    </span>
                  )}
                  <Arrow />
                </div>
              </a>
            </div>
            {cursorActive && <CursorHint />}
          </div>
        )}

        {/* PRODUCTS */}
        <ProductsSection products={products} logClick={logClick} styles={styles} />

        {/* SECTIONS */}
        {visibleSections.map(section => {
          const visibleLinks = section.links?.filter(l => l.visible && isLinkLive(l)) || []
          if (!visibleLinks.length) return null
          return (
            <div key={section.id} className={styles.section}>
              <div className={styles.sectionLabel}>{section.label}</div>
              <div className={styles.linksStack}>
                {visibleLinks.map(link => {
                  const badge = BADGE_MAP[link.badge]
                  return (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener"
                      className={`${styles.card} ${link.featured ? styles.featured : ''}`}
                      onClick={() => logClick(link.id, link.title, section.id, meta)}
                    >
                      <div className={`${styles.icon} ${link.featured ? styles.iconAccent : ''}`}>
                        {link.icon}
                      </div>
                      <div className={styles.cardText}>
                        <div className={styles.cardTitle}>{link.title}</div>
                        <div className={styles.cardSub}>{link.subtitle}</div>
                      </div>
                      {badge && (
                        <span className={`${styles.badge} ${styles[badge.cls]}`}>
                          {badge.label}
                        </span>
                      )}
                      <Arrow />
                    </a>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* LATEST VIDEO — bottom position */}
        {profile.showLatestVideo !== false && profile.latestVideoPosition === 'bottom' && (
          <LatestVideoCard inlinePreview={!!profile.latestVideoInline} />
        )}

        {/* EMAIL CAPTURE */}
        {profile.showEmailCapture === true && (
          <EmailCaptureCard profile={profile} />
        )}

        {/* FOOTER */}
        <div className={styles.footer}>
          <div className={styles.footerText}>{profile.footerText}</div>
          <a href={`mailto:${profile.email}`} className={styles.footerEmail}>
            {profile.email}
          </a>
        </div>

        <a href="/admin" className={styles.adminLink}>⚙</a>

      </div>
    </div>
  )
}

// ─── LATEST VIDEO ─────────────────────────────────────────────────────────────

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)
  if (mins < 60)   return `${mins}m ago`
  if (hours < 24)  return `${hours}h ago`
  if (days < 7)    return `${days}d ago`
  if (weeks < 5)   return `${weeks}w ago`
  return `${months}mo ago`
}

function useLatestVideo() {
  const [video, setVideo] = useState(null)
  useEffect(() => {
    const base = import.meta.env.VITE_API_BASE || ''
    fetch(`${base}/api/latest-video`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.videoId) setVideo(data) })
      .catch(() => {})
  }, [])
  return video
}

function LatestVideoCard({ inlinePreview }) {
  const video = useLatestVideo()
  const [playing, setPlaying] = useState(inlinePreview) // auto-open when inline preview is on
  if (!video) return null

  // ── Default mode: link straight to YouTube ────────────────────────────────
  if (!inlinePreview) {
    return (
      <a href={video.url} target="_blank" rel="noopener" className={styles.videoCard}>
        <img
          src={video.thumbnail}
          alt={video.title}
          className={styles.videoThumb}
          onError={e => e.target.style.display = 'none'}
        />
        <div className={styles.videoInfo}>
          <div className={styles.videoLabel}>▶ Latest Video</div>
          <div className={styles.videoTitle}>{video.title}</div>
          <div className={styles.videoMeta}>{timeAgo(video.publishedAt)}</div>
        </div>
        <div className={styles.videoWatch}>Watch now →</div>
      </a>
    )
  }

  // ── Inline preview mode ───────────────────────────────────────────────────
  if (playing) {
    return (
      <div className={`${styles.videoCard} ${styles.videoCardPlaying}`}>
        {/* 16:9 embedded player */}
        <div className={styles.videoEmbedWrap}>
          <iframe
            className={styles.videoEmbed}
            src={`https://www.youtube.com/embed/${video.videoId}?autoplay=1&mute=1&rel=0`}
            title={video.title}
            allow="autoplay; encrypted-media; fullscreen"
            allowFullScreen
          />
        </div>
        {/* Footer row */}
        <div className={styles.videoEmbedFooter}>
          <div className={styles.videoInfo}>
            <div className={styles.videoLabel}>▶ Latest Video</div>
            <div className={styles.videoTitle}>{video.title}</div>
          </div>
          <div className={styles.videoEmbedActions}>
            <a href={video.url} target="_blank" rel="noopener" className={styles.videoWatch}>
              YouTube ↗
            </a>
            <button className={styles.videoClose} onClick={() => setPlaying(false)}>
              ✕ Close
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`${styles.videoCard} ${styles.videoCardClickable}`}>
      {/* Thumbnail with play overlay */}
      <div className={styles.videoThumbWrap} onClick={() => setPlaying(true)}>
        <img
          src={video.thumbnail}
          alt={video.title}
          className={styles.videoThumb}
          onError={e => e.target.style.display = 'none'}
        />
        <div className={styles.videoPlayOverlay}>
          <div className={styles.videoPlayBtn}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 2L12 7L3 12V2Z" fill="currentColor"/>
            </svg>
          </div>
        </div>
      </div>
      <div className={styles.videoInfo}>
        <div className={styles.videoLabel}>▶ Latest Video</div>
        <div className={styles.videoTitle}>{video.title}</div>
        <div className={styles.videoMeta}>{timeAgo(video.publishedAt)}</div>
      </div>
      <div className={styles.videoWatch} onClick={() => setPlaying(true)}>Play ▶</div>
    </div>
  )
}

// ─── PRODUCTS ─────────────────────────────────────────────────────────────────

const COLLAPSE_THRESHOLD = 3

function ProductsSection({ products, logClick, styles }) {
  const [expanded, setExpanded] = useState(false)
  const visibleProducts = products?.items?.filter(p => p.visible) || []
  if (!visibleProducts.length) return null

  const isGrid = products?.layout === 'grid'
  const sectionTitle = products?.title || 'My Products'
  const getPriceClass = (price) => /\d/.test(price) ? styles.productPriceWhite : styles.productPrice
  const hasMore = visibleProducts.length > COLLAPSE_THRESHOLD
  const shown = hasMore && !expanded ? visibleProducts.slice(0, COLLAPSE_THRESHOLD) : visibleProducts

  return (
    <div className={styles.productsSection}>
      <div className={styles.sectionLabel}>🛍️ {sectionTitle}</div>

      {isGrid ? (
        <div className={styles.productsGrid}>
          {shown.map(product => (
            <a
              key={product.id}
              href={product.url}
              target="_blank"
              rel="noopener"
              className={`${styles.productCardGrid} ${product.featured ? styles.featuredProduct : ''}`}
              onClick={() => logClick(product.id, product.name, 'products', meta)}
            >
              <div className={styles.productThumbGrid}>
                {product.thumbnailUrl
                  ? <img src={product.thumbnailUrl} alt={product.name} onError={e => e.target.style.display = 'none'} />
                  : <span className={styles.productThumbFallback}>{product.name?.[0] || '🛍'}</span>
                }
              </div>
              <div className={styles.productInfoGrid}>
                <div className={styles.productNameGrid}>{product.name}</div>
                <div className={styles.productDescGrid}>{product.description}</div>
                <div className={styles.productMetaGrid}>
                  <span className={getPriceClass(product.price)}>{product.price || 'Free'}</span>
                  <span className={styles.productBtn}>Get it →</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div className={styles.productsStack}>
          {shown.map(product => (
            <a
              key={product.id}
              href={product.url}
              target="_blank"
              rel="noopener"
              className={`${styles.productCard} ${product.featured ? styles.featuredProduct : ''}`}
              onClick={() => logClick(product.id, product.name, 'products', meta)}
            >
              <div className={styles.productThumb}>
                {product.thumbnailUrl
                  ? <img src={product.thumbnailUrl} alt={product.name} onError={e => e.target.style.display = 'none'} />
                  : <span className={styles.productThumbFallback}>{product.name?.[0] || '🛍'}</span>
                }
              </div>
              <div className={styles.productInfo}>
                <div className={styles.productName}>{product.name}</div>
                <div className={styles.productDesc}>{product.description}</div>
              </div>
              <div className={styles.productMeta}>
                <span className={getPriceClass(product.price)}>{product.price || 'Free'}</span>
                <span className={styles.productBtn}>Get it →</span>
              </div>
            </a>
          ))}
        </div>
      )}

      {hasMore && (
        <button className={styles.showMoreBtn} onClick={() => setExpanded(e => !e)}>
          {expanded
            ? 'Show less ▲'
            : `Show ${visibleProducts.length - COLLAPSE_THRESHOLD} more ▼`}
        </button>
      )}
    </div>
  )
}

function renderBioWithHighlight(bio, highlight) {
  if (!bio.includes(highlight)) return bio
  const parts = bio.split(highlight)
  return (
    <>
      {parts[0]}
      <span style={{ color: 'var(--text)', fontWeight: 700 }}>{highlight}</span>
      {parts[1]}
    </>
  )
}

function Arrow() {
  return (
    <svg className={styles.arrow} width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// ─── EMAIL CAPTURE CARD ───────────────────────────────────────────────────────

function EmailCaptureCard({ profile }) {
  const [email, setEmail]     = useState('')
  const [status, setStatus]   = useState('idle') // 'idle' | 'loading' | 'success' | 'error'
  const [shake, setShake]     = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const headline = profile.captureHeadline || "For when you're too tired to figure this out yourself"
  const subtext  = profile.captureSubtext  || "I share AI tools, shortcuts, and workflows that actually save time — only when I find something worth sharing. No spam. No schedule."
  const proof    = profile.captureProof    || "Joined by 500K+ creators"

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('loading')
    try {
      const base = import.meta.env.VITE_API_BASE || ''
      const res  = await fetch(`${base}/api/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json()
      if (data.success) {
        setStatus('success')
      } else {
        setErrorMsg(data.error || 'Something went wrong. Please try again.')
        setStatus('error')
        setShake(true)
        setTimeout(() => setShake(false), 600)
      }
    } catch {
      setErrorMsg('Something went wrong. Please try again.')
      setStatus('error')
      setShake(true)
      setTimeout(() => setShake(false), 600)
    }
  }

  if (status === 'success') {
    return (
      <div className={styles.emailCard}>
        <p className={styles.emailSuccess}>✓ You're in. Check your inbox for something useful.</p>
      </div>
    )
  }

  return (
    <div className={styles.emailCard}>
      <span className={styles.emailIcon}>🔋</span>
      <h2 className={styles.emailHeadline}>{headline}</h2>
      <p className={styles.emailSubtext}>{subtext}</p>
      <p className={styles.emailProof}>{proof}</p>
      <form className={styles.emailForm} onSubmit={handleSubmit} noValidate>
        <input
          className={`${styles.emailInput} ${status === 'error' ? styles.emailInputError : ''} ${shake ? styles.emailInputShake : ''}`}
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={e => { setEmail(e.target.value); if (status === 'error') { setStatus('idle'); setErrorMsg('') } }}
          disabled={status === 'loading'}
          autoComplete="email"
        />
        <button
          type="submit"
          className={styles.emailBtn}
          disabled={status === 'loading'}
        >
          {status === 'loading' ? '...' : 'I need this'}
        </button>
      </form>
      {status === 'error' && errorMsg && (
        <p className={styles.emailErrorMsg}>{errorMsg}</p>
      )}
    </div>
  )
}

// ── Animated cursor hint for pinned card ──────────────────────────────────────
function CursorHint() {
  return (
    <div className={styles.cursorHint} aria-hidden="true">
      {/* Standard arrow cursor — white fill + dark stroke for contrast on any bg */}
      <svg width="26" height="30" viewBox="0 0 26 30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M3 1.5L3 22L8 16.5L11.5 25L14.5 23.5L11 15L17.5 15L3 1.5Z"
          fill="white"
          stroke="#111111"
          strokeWidth="1.8"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      <div className={styles.cursorRipple} />
    </div>
  )
}
