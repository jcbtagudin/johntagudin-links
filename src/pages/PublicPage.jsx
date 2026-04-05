import React from 'react'
import { useProfile, useLinks, logClick } from '../hooks/useData'
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

export default function PublicPage() {
  const { profile, loading: pl } = useProfile()
  const { data, loading: ll } = useLinks()

  if (pl || ll) return (
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
            <div className={styles.statusDot} />
          </div>
          <div className={styles.name}>{profile.name}</div>
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
                      onClick={() => logClick(link.id, link.title, section.id)}
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

function renderBioWithHighlight(bio, highlight) {
  if (!bio.includes(highlight)) return bio
  const parts = bio.split(highlight)
  return (
    <>
      {parts[0]}
      <span style={{ color: 'var(--accent)', fontWeight: 500 }}>{highlight}</span>
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
