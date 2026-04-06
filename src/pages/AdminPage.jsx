import React, { useState, useCallback, useRef } from 'react'
import { signOut } from 'firebase/auth'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { auth, storage } from '../lib/firebase'
import { useNavigate } from 'react-router-dom'
import { useProfile, useLinks, usePinned, useProducts, useAnalytics, useSubscribers, useEmailConfig, useAdminReviews } from '../hooks/useData'
import { useAuth } from '../hooks/useAuth'
import SocialIcon, { SOCIAL_ICON_OPTIONS } from '../components/SocialIcon'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// ─── HELPERS ────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9)

function getScheduleStatus(link) {
  const now = new Date()
  if (!link.startDate && !link.endDate) return 'Always On'
  if (link.startDate && new Date(link.startDate) > now) return 'Scheduled'
  if (link.endDate && new Date(link.endDate) < now) return 'Expired'
  return 'Live'
}

function scheduleStatusStyle(link) {
  const status = getScheduleStatus(link)
  const map = {
    'Always On': { color: 'var(--muted)' },
    'Scheduled':  { color: '#60a5fa', background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.2)' },
    'Live':       { color: 'var(--green)', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' },
    'Expired':    { color: 'var(--red)', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' },
  }
  return {
    fontSize: 10, fontWeight: 700, padding: '2px 7px',
    borderRadius: 4, letterSpacing: 0.3,
    ...(map[status] || map['Always On']),
  }
}

// ─── ADMIN PAGE ─────────────────────────────────────────────────────────────
export default function AdminPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { profile, update: updateProfile } = useProfile()
  const { data: linksData, save: saveLinks } = useLinks()
  const [tab, setTab] = useState('profile')
  const [saved, setSaved] = useState(false)

  const showSaved = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleLogout = async () => {
    await signOut(auth)
    navigate('/')
  }

  if (!profile || !linksData) return <Loader />

  const NAV = [
    { id: 'profile',   label: '👤 Profile' },
    { id: 'socials',   label: '📲 Socials' },
    { id: 'links',     label: '🔗 Links' },
    { id: 'analytics', label: '📊 Analytics' },
  ]

  const HEADER_TITLES = {
    profile:   'Profile Settings',
    socials:   'Social Links',
    links:     'Link Sections',
    analytics: 'Click Analytics',
  }

  return (
    <div style={s.page}>
      {/* SIDEBAR */}
      <aside style={s.sidebar}>
        <div style={s.sideTop}>
          <div style={s.logo}>⚙ Admin</div>
          <nav style={s.nav}>
            {[
              { id: 'profile',   label: '👤 Profile' },
              { id: 'socials',   label: '📲 Socials' },
              { id: 'links',     label: '🔗 Links' },
              { id: 'products',  label: '🛍️ Products' },
              { id: 'pinned',       label: '📌 Pinned' },
              { id: 'subscribers',  label: '👥 Subscribers' },
              { id: 'email',        label: '✉️ Email' },
              { id: 'analytics',    label: '📊 Analytics' },
              { id: 'reviews',      label: '⭐ Reviews' },
            ].map(item => (
              <button
                key={item.id}
                style={{ ...s.navBtn, ...(tab === item.id ? s.navActive : {}) }}
                onClick={() => setTab(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
        <div style={s.sideBottom}>
          <div style={s.userInfo}>
            <img src={user?.photoURL} alt="" style={s.userAvatar} />
            <span style={s.userEmail}>{user?.email}</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <a href="/" target="_blank" style={s.previewBtn}>View Page ↗</a>
            <button onClick={handleLogout} style={s.logoutBtn}>Logout</button>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main style={s.main}>
        <div style={s.header}>
          <div style={s.headerTitle}>
            {tab === 'profile'   && 'Profile Settings'}
            {tab === 'socials'   && 'Social Links'}
            {tab === 'links'     && 'Link Sections'}
            {tab === 'products'  && 'Gumroad Products'}
            {tab === 'pinned'       && 'Pinned Link'}
            {tab === 'subscribers'  && 'Subscribers'}
            {tab === 'email'        && 'Welcome Email'}
            {tab === 'analytics'    && 'Click Analytics'}
            {tab === 'reviews'      && 'Reviews'}
          </div>
          {saved && <div style={s.savedBadge}>✓ Saved</div>}
        </div>

        <div style={s.content}>
          {tab === 'profile' && (
            <ProfileTab profile={profile} update={updateProfile} onSaved={showSaved} />
          )}
          {tab === 'socials' && (
            <SocialsTab data={linksData} save={saveLinks} onSaved={showSaved} />
          )}
          {tab === 'links' && (
            <LinksTab data={linksData} save={saveLinks} onSaved={showSaved} />
          )}
          {tab === 'products' && (
            <ProductsTab onSaved={showSaved} />
          )}
          {tab === 'pinned' && (
            <PinnedTab onSaved={showSaved} />
          )}
          {tab === 'subscribers' && (
            <SubscribersTab />
          )}
          {tab === 'email' && (
            <EmailTab onSaved={showSaved} />
          )}
          {tab === 'analytics' && (
            <AnalyticsTab />
          )}
          {tab === 'reviews' && (
            <ReviewsTab profile={profile} update={updateProfile} onSaved={showSaved} />
          )}
        </div>
      </main>
    </div>
  )
}

// ─── PROFILE TAB ─────────────────────────────────────────────────────────────
function useLatestVideoPreview() {
  const [video, setVideo] = React.useState(null)
  React.useEffect(() => {
    const base = import.meta.env.VITE_API_BASE || ''
    fetch(`${base}/api/latest-video`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.videoId) setVideo(data) })
      .catch(() => {})
  }, [])
  return video
}

function ProfileTab({ profile, update, onSaved }) {
  const [form, setForm] = useState({ ...profile })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const save = async () => { await update(form); onSaved() }
  const video = useLatestVideoPreview()

  return (
    <div style={s.tabBody}>
      <Field label="Display Name" value={form.name} onChange={v => set('name', v)} />
      <Field label="Handle (e.g. @john.tagudin)" value={form.handle} onChange={v => set('handle', v)} />
      <ImageUploadField label="AVATAR IMAGE" value={form.avatarUrl} onChange={v => set('avatarUrl', v)} path="avatars" placeholder="https://... or upload" />
      {form.avatarUrl && (
        <div style={{ marginBottom: '16px' }}>
          <img src={form.avatarUrl} alt="preview" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }} />
        </div>
      )}
      <Field label="Bio" value={form.bio} onChange={v => set('bio', v)} multiline />
      <Field label="Bio Highlight Word (gets colored accent)" value={form.bioHighlight} onChange={v => set('bioHighlight', v)} placeholder="e.g. AI tools" />
      <Field label="Status Badge (e.g. Creating, Available, etc. — leave blank to hide)" value={form.status || ''} onChange={v => set('status', v)} placeholder="e.g. Creating" />
      <Field label="Footer Text" value={form.footerText} onChange={v => set('footerText', v)} />
      <Field label="Contact Email" value={form.email} onChange={v => set('email', v)} />

      {/* ── Latest Video Section ── */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', letterSpacing: 0.3 }}>LATEST VIDEO</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Auto-fetched from your YouTube channel</div>
          </div>
          {/* Toggle */}
          <button
            onClick={() => set('showLatestVideo', !form.showLatestVideo)}
            style={{
              width: 40, height: 22, borderRadius: 100, border: 'none', cursor: 'pointer',
              background: form.showLatestVideo !== false ? 'var(--accent)' : 'var(--surface2)',
              position: 'relative', transition: 'background 0.2s', flexShrink: 0,
            }}
          >
            <span style={{
              position: 'absolute', top: 3,
              left: form.showLatestVideo !== false ? 20 : 3,
              width: 16, height: 16, borderRadius: '50%',
              background: form.showLatestVideo !== false ? '#000' : 'var(--muted)',
              transition: 'left 0.2s',
            }} />
          </button>
        </div>

        {/* Position toggle */}
        {form.showLatestVideo !== false && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)' }}>Position</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Where the video card appears on your page</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[{ value: 'top', label: '↑ Top' }, { value: 'bottom', label: '↓ Bottom' }].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => set('latestVideoPosition', opt.value)}
                  style={{
                    padding: '5px 12px', fontSize: 11, fontWeight: 600, borderRadius: 8, cursor: 'pointer',
                    border: '1px solid var(--border)',
                    background: (form.latestVideoPosition || 'top') === opt.value ? 'rgba(74,124,64,0.1)' : 'var(--surface2)',
                    color: (form.latestVideoPosition || 'top') === opt.value ? 'var(--accent)' : 'var(--text2)',
                  }}
                >{opt.label}</button>
              ))}
            </div>
          </div>
        )}

        {/* Inline preview toggle */}
        {form.showLatestVideo !== false && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)' }}>Inline preview</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Play video directly on your page instead of linking to YouTube</div>
            </div>
            <button
              onClick={() => set('latestVideoInline', !form.latestVideoInline)}
              style={{
                width: 40, height: 22, borderRadius: 100, border: 'none', cursor: 'pointer',
                background: form.latestVideoInline ? 'var(--accent)' : 'var(--surface2)',
                position: 'relative', transition: 'background 0.2s', flexShrink: 0,
              }}
            >
              <span style={{
                position: 'absolute', top: 3,
                left: form.latestVideoInline ? 20 : 3,
                width: 16, height: 16, borderRadius: '50%',
                background: form.latestVideoInline ? '#000' : 'var(--muted)',
                transition: 'left 0.2s',
              }} />
            </button>
          </div>
        )}

        {/* Video preview */}
        {video ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', background: 'var(--surface2)',
            border: '1px solid var(--border)', borderRadius: 10,
            opacity: form.showLatestVideo !== false ? 1 : 0.4,
          }}>
            <img src={video.thumbnail} alt={video.title} style={{ width: 72, height: 46, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 3 }}>▶ Now showing</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{video.title}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{new Date(video.publishedAt).toLocaleDateString()}</div>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 12, color: 'var(--muted)', padding: '8px 0' }}>
            No video loaded — make sure <code style={{ color: 'var(--accent)' }}>YOUTUBE_API_KEY</code> and <code style={{ color: 'var(--accent)' }}>YOUTUBE_CHANNEL_ID</code> are set on Vercel.
          </div>
        )}
      </div>

      {/* ── Email Capture Section ── */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', letterSpacing: 0.3 }}>EMAIL CAPTURE</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Show a newsletter signup card above your footer</div>
          </div>
          <button
            onClick={() => set('showEmailCapture', !form.showEmailCapture)}
            style={{
              width: 40, height: 22, borderRadius: 100, border: 'none', cursor: 'pointer',
              background: form.showEmailCapture ? 'var(--accent)' : 'var(--surface2)',
              position: 'relative', transition: 'background 0.2s', flexShrink: 0,
            }}
          >
            <span style={{
              position: 'absolute', top: 3,
              left: form.showEmailCapture ? 20 : 3,
              width: 16, height: 16, borderRadius: '50%',
              background: form.showEmailCapture ? '#000' : 'var(--muted)',
              transition: 'left 0.2s',
            }} />
          </button>
        </div>

        {form.showEmailCapture && (
          <>
            <Field
              label="CAPTURE HEADLINE"
              value={form.captureHeadline || ''}
              onChange={v => set('captureHeadline', v)}
              placeholder="For when you're too tired to figure this out yourself"
            />
            <Field
              label="CAPTURE SUBTEXT"
              value={form.captureSubtext || ''}
              onChange={v => set('captureSubtext', v)}
              multiline
              placeholder="I share AI tools, shortcuts, and workflows that actually save time — only when I find something worth sharing. No spam. No schedule."
            />
            <Field
              label="SOCIAL PROOF LINE"
              value={form.captureProof || ''}
              onChange={v => set('captureProof', v)}
              placeholder="Joined by 500K+ creators"
            />
            <Field
              label="BUTTON TEXT"
              value={form.captureBtn || ''}
              onChange={v => set('captureBtn', v)}
              placeholder="I need this"
            />
          </>
        )}
      </div>

      {/* ── Socials Position ── */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', letterSpacing: 0.3 }}>SOCIALS POSITION</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Where the social pills appear on your page</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['top', 'bottom'].map(pos => (
            <button
              key={pos}
              onClick={() => set('socialsPosition', pos)}
              style={{
                ...s.iconBtn, padding: '6px 14px', fontSize: 12, borderRadius: 8,
                border: '1px solid var(--border)',
                background: (form.socialsPosition || 'top') === pos ? 'rgba(74,124,64,0.1)' : 'var(--surface2)',
                color: (form.socialsPosition || 'top') === pos ? 'var(--accent)' : 'var(--text2)',
                fontWeight: (form.socialsPosition || 'top') === pos ? 600 : 400,
              }}
            >
              {pos === 'top' ? '↑ Top' : '↓ Bottom'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Contact Button ── */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', letterSpacing: 0.3 }}>CONTACT BUTTON</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Floating button at top-right that links to your email</div>
          </div>
          <button
            onClick={() => set('showContactBtn', !form.showContactBtn)}
            style={{
              width: 40, height: 22, borderRadius: 100, border: 'none', cursor: 'pointer',
              background: form.showContactBtn ? 'var(--accent)' : 'var(--surface2)',
              position: 'relative', transition: 'background 0.2s', flexShrink: 0,
            }}
          >
            <span style={{
              position: 'absolute', top: 3,
              left: form.showContactBtn ? 20 : 3,
              width: 16, height: 16, borderRadius: '50%',
              background: form.showContactBtn ? '#000' : 'var(--muted)',
              transition: 'left 0.2s',
            }} />
          </button>
        </div>
        {form.showContactBtn && (
          <>
            <div style={{ display: 'flex', gap: 6 }}>
              {[['icon', '✉ Icon only'], ['text', '✉ Icon + text']].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => set('contactBtnStyle', val)}
                  style={{
                    ...s.iconBtn, padding: '6px 14px', fontSize: 12, borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: (form.contactBtnStyle || 'text') === val ? 'rgba(74,124,64,0.1)' : 'var(--surface2)',
                    color: (form.contactBtnStyle || 'text') === val ? 'var(--accent)' : 'var(--text2)',
                    fontWeight: (form.contactBtnStyle || 'text') === val ? 600 : 400,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            {(form.contactBtnStyle || 'text') !== 'icon' && (
              <Field
                label="BUTTON LABEL"
                value={form.contactBtnLabel || ''}
                onChange={v => set('contactBtnLabel', v)}
                placeholder="Contact me"
              />
            )}
          </>
        )}
      </div>

      <SaveBtn onClick={save} />
    </div>
  )
}

// ─── SOCIALS TAB ─────────────────────────────────────────────────────────────
function SocialsTab({ data, save, onSaved }) {
  const [socials, setSocials] = useState(data.socials || [])
  const sensors = useSensors(useSensor(PointerSensor))

  const saveAll = async () => { await save({ ...data, socials }); onSaved() }
  const add = () => setSocials(s => [...s, { id: uid(), label: '', url: '', icon: 'website', visible: true }])
  const remove = (id) => setSocials(s => s.filter(x => x.id !== id))
  const update = (id, k, v) => setSocials(s => s.map(x => x.id === id ? { ...x, [k]: v } : x))
  const toggle = (id) => setSocials(s => s.map(x => x.id === id ? { ...x, visible: !x.visible } : x))

  const onDragEnd = ({ active, over }) => {
    if (active.id !== over?.id) {
      setSocials(items => {
        const oldIdx = items.findIndex(i => i.id === active.id)
        const newIdx = items.findIndex(i => i.id === over.id)
        return arrayMove(items, oldIdx, newIdx)
      })
    }
  }

  return (
    <div style={s.tabBody}>
      <div style={s.tabInfo}>Drag to reorder. Toggle visibility with the eye icon.</div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={socials.map(s => s.id)} strategy={verticalListSortingStrategy}>
          {socials.map(social => (
            <SortableSocialRow key={social.id} item={social} update={update} toggle={toggle} remove={remove} />
          ))}
        </SortableContext>
      </DndContext>
      <button style={s.addBtn} onClick={add}>+ Add Social</button>
      <SaveBtn onClick={saveAll} />
    </div>
  )
}

function SortableSocialRow({ item, update, toggle, remove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }

  return (
    <div ref={setNodeRef} style={{ ...s.row, ...style }}>
      <span {...attributes} {...listeners} style={s.drag}>⠿</span>
      <div style={s.rowFields}>
        <select value={item.icon} onChange={e => update(item.id, 'icon', e.target.value)} style={s.select}>
          {SOCIAL_ICON_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <input style={s.input} placeholder="Label (e.g. 183K TikTok)" value={item.label} onChange={e => update(item.id, 'label', e.target.value)} />
        <input style={s.input} placeholder="URL" value={item.url} onChange={e => update(item.id, 'url', e.target.value)} />
      </div>
      <div style={s.rowActions}>
        <button style={{ ...s.iconBtn, color: item.visible ? 'var(--accent)' : 'var(--muted)' }} onClick={() => toggle(item.id)}>
          {item.visible ? '👁' : '🚫'}
        </button>
        <button style={{ ...s.iconBtn, color: 'var(--red)' }} onClick={() => remove(item.id)}>✕</button>
      </div>
    </div>
  )
}

// ─── LINKS TAB ───────────────────────────────────────────────────────────────
function LinksTab({ data, save, onSaved }) {
  const [sections, setSections] = useState(data.sections || [])
  const [expandedSection, setExpandedSection] = useState(null)
  const sensors = useSensors(useSensor(PointerSensor))

  const saveAll = async () => { await save({ ...data, sections }); onSaved() }

  const addSection = () => {
    const id = uid()
    setSections(s => [...s, { id, label: 'New Section', visible: true, links: [] }])
    setExpandedSection(id)
  }

  const removeSection = (id) => setSections(s => s.filter(x => x.id !== id))
  const updateSection = (id, k, v) => setSections(s => s.map(x => x.id === id ? { ...x, [k]: v } : x))
  const toggleSection = (id) => setSections(s => s.map(x => x.id === id ? { ...x, visible: !x.visible } : x))

  const addLink = (sectionId) => {
    setSections(s => s.map(sec => sec.id === sectionId ? {
      ...sec,
      links: [...(sec.links || []), {
        id: uid(), title: '', subtitle: '', url: '',
        icon: '🔗', badge: '', featured: false, visible: true,
        startDate: '', endDate: '',
      }]
    } : sec))
  }

  const removeLink = (sectionId, linkId) =>
    setSections(s => s.map(sec => sec.id === sectionId ? { ...sec, links: sec.links.filter(l => l.id !== linkId) } : sec))

  const updateLink = (sectionId, linkId, k, v) =>
    setSections(s => s.map(sec => sec.id === sectionId ? {
      ...sec, links: sec.links.map(l => l.id === linkId ? { ...l, [k]: v } : l)
    } : sec))

  const onDragEnd = ({ active, over }) => {
    if (active.id !== over?.id) {
      setSections(items => {
        const oldIdx = items.findIndex(i => i.id === active.id)
        const newIdx = items.findIndex(i => i.id === over.id)
        return arrayMove(items, oldIdx, newIdx)
      })
    }
  }

  const onLinkDragEnd = (sectionId, { active, over }) => {
    if (active.id !== over?.id) {
      setSections(secs => secs.map(sec => {
        if (sec.id !== sectionId) return sec
        const oldIdx = sec.links.findIndex(l => l.id === active.id)
        const newIdx = sec.links.findIndex(l => l.id === over.id)
        return { ...sec, links: arrayMove(sec.links, oldIdx, newIdx) }
      }))
    }
  }

  return (
    <div style={s.tabBody}>
      <div style={s.tabInfo}>Drag sections and links to reorder. Click a section to expand and edit its links.</div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
          {sections.map(sec => (
            <SortableSectionRow
              key={sec.id}
              section={sec}
              expanded={expandedSection === sec.id}
              onToggleExpand={() => setExpandedSection(expandedSection === sec.id ? null : sec.id)}
              onUpdate={(k, v) => updateSection(sec.id, k, v)}
              onToggleVisible={() => toggleSection(sec.id)}
              onRemove={() => removeSection(sec.id)}
              onAddLink={() => addLink(sec.id)}
              onRemoveLink={(lid) => removeLink(sec.id, lid)}
              onUpdateLink={(lid, k, v) => updateLink(sec.id, lid, k, v)}
              onLinkDragEnd={(e) => onLinkDragEnd(sec.id, e)}
              sensors={sensors}
            />
          ))}
        </SortableContext>
      </DndContext>

      <button style={s.addBtn} onClick={addSection}>+ Add Section</button>
      <SaveBtn onClick={saveAll} />
    </div>
  )
}

function SortableSectionRow({ section, expanded, onToggleExpand, onUpdate, onToggleVisible, onRemove, onAddLink, onRemoveLink, onUpdateLink, onLinkDragEnd, sensors }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }

  return (
    <div ref={setNodeRef} style={style}>
      <div style={s.sectionRow}>
        <span {...attributes} {...listeners} style={s.drag}>⠿</span>
        <button style={s.expandBtn} onClick={onToggleExpand}>
          <span style={{ fontSize: 12, marginRight: 6 }}>{expanded ? '▼' : '▶'}</span>
          <input
            style={{ ...s.input, flex: 1, background: 'transparent', border: 'none', padding: 0, fontSize: 13, fontWeight: 600 }}
            value={section.label}
            onChange={e => onUpdate('label', e.target.value)}
            onClick={e => e.stopPropagation()}
          />
        </button>
        <span style={s.linkCount}>{section.links?.length || 0} links</span>
        <button style={{ ...s.iconBtn, color: section.visible ? 'var(--accent)' : 'var(--muted)' }} onClick={onToggleVisible}>
          {section.visible ? '👁' : '🚫'}
        </button>
        <button style={{ ...s.iconBtn, color: 'var(--red)' }} onClick={onRemove}>✕</button>
      </div>

      {expanded && (
        <div style={s.linksInner}>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onLinkDragEnd}>
            <SortableContext items={(section.links || []).map(l => l.id)} strategy={verticalListSortingStrategy}>
              {(section.links || []).map(link => (
                <SortableLinkRow
                  key={link.id}
                  link={link}
                  onUpdate={(k, v) => onUpdateLink(link.id, k, v)}
                  onRemove={() => onRemoveLink(link.id)}
                />
              ))}
            </SortableContext>
          </DndContext>
          <button style={{ ...s.addBtn, marginTop: 8 }} onClick={onAddLink}>+ Add Link</button>
        </div>
      )}
    </div>
  )
}

function SortableLinkRow({ link, onUpdate, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: link.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }
  const [showSchedule, setShowSchedule] = useState(!!(link.startDate || link.endDate))

  return (
    <div ref={setNodeRef} style={{ ...s.linkRow, ...style }}>
      <span {...attributes} {...listeners} style={s.drag}>⠿</span>
      <div style={s.linkFields}>

        {/* Row 1: icon, title, badge */}
        <div style={{ display: 'flex', gap: 8 }}>
          {link.iconImage ? (
            <>
              <input style={{ ...s.input, flex: 1 }} placeholder="Icon image URL (https://...)" value={link.iconImage} onChange={e => onUpdate('iconImage', e.target.value)} />
              <button type="button" style={{ ...s.iconBtn, fontSize: 11, padding: '3px 8px', border: '1px solid var(--border)', borderRadius: 6, whiteSpace: 'nowrap' }} onClick={() => { const i = document.createElement('input'); i.type='file'; i.accept='image/*'; i.onchange=async(e)=>{ const f=e.target.files?.[0]; if(!f||f.size>5*1024*1024) return; const sr=storageRef(storage,`links/${Date.now()}_${f.name}`); await uploadBytes(sr,f); onUpdate('iconImage', await getDownloadURL(sr)) }; i.click() }}>↑</button>
            </>
          ) : (
            <input style={{ ...s.input, width: 60 }} placeholder="Icon" value={link.icon || ''} onChange={e => onUpdate('icon', e.target.value)} title="Emoji icon" />
          )}
          <button
            type="button"
            title={link.iconImage ? 'Switch to emoji icon' : 'Switch to image icon'}
            style={{ ...s.iconBtn, fontSize: 11, padding: '3px 8px', border: '1px solid var(--border)', borderRadius: 6, whiteSpace: 'nowrap', background: link.iconImage ? 'rgba(74,124,64,0.12)' : 'transparent', color: link.iconImage ? 'var(--accent)' : 'var(--text2)' }}
            onClick={() => link.iconImage ? onUpdate('iconImage', '') : onUpdate('iconImage', 'https://')}
          >
            {link.iconImage ? '🖼 IMG' : '🔤 Emoji'}
          </button>
          <input style={{ ...s.input, flex: 1 }} placeholder="Title" value={link.title} onChange={e => onUpdate('title', e.target.value)} />
          <select style={s.select} value={link.badge} onChange={e => onUpdate('badge', e.target.value)}>
            <option value="">No badge</option>
            <option value="free">Free</option>
            <option value="new">New</option>
            <option value="hot">Hot</option>
          </select>
        </div>

        {/* Row 2: subtitle */}
        <input style={s.input} placeholder="Subtitle / description" value={link.subtitle} onChange={e => onUpdate('subtitle', e.target.value)} />

        {/* Row 3: URL */}
        <input style={s.input} placeholder="URL (https://...)" value={link.url} onChange={e => onUpdate('url', e.target.value)} />

        {/* Row 3b: thumbnail */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {link.thumbnail && (
            <img src={link.thumbnail} alt="" style={{ width: 48, height: 36, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border)', flexShrink: 0 }} onError={e => e.currentTarget.style.display = 'none'} />
          )}
          <ImageUploadField value={link.thumbnail || ''} onChange={v => onUpdate('thumbnail', v)} path="links" placeholder="Thumbnail image URL (optional)" />
        </div>

        {/* Row 4: checkboxes + schedule toggle */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 12, color: 'var(--text2)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <input type="checkbox" checked={link.featured} onChange={e => onUpdate('featured', e.target.checked)} />
            Featured
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <input type="checkbox" checked={link.visible} onChange={e => onUpdate('visible', e.target.checked)} />
            Visible
          </label>
          <button
            style={{ ...s.iconBtn, fontSize: 11, padding: '3px 8px', border: '1px solid var(--border)', borderRadius: 6, marginLeft: 'auto' }}
            onClick={() => setShowSchedule(v => !v)}
          >
            🗓 Schedule {showSchedule ? '▲' : '▼'}
          </button>
          {(link.startDate || link.endDate) && (
            <span style={scheduleStatusStyle(link)}>{getScheduleStatus(link)}</span>
          )}
        </div>

        {/* Schedule fields */}
        {showSchedule && (
          <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>
              Leave blank to always show. Set dates to control when this link is visible on your public page.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 4, fontWeight: 600 }}>START DATE</div>
                <input
                  type="datetime-local"
                  style={{ ...s.input, fontSize: 12 }}
                  value={link.startDate || ''}
                  onChange={e => onUpdate('startDate', e.target.value)}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 4, fontWeight: 600 }}>END DATE</div>
                <input
                  type="datetime-local"
                  style={{ ...s.input, fontSize: 12 }}
                  value={link.endDate || ''}
                  onChange={e => onUpdate('endDate', e.target.value)}
                />
              </div>
            </div>
            {(link.startDate || link.endDate) && (
              <button
                style={{ ...s.iconBtn, fontSize: 11, color: 'var(--muted)', alignSelf: 'flex-start', padding: '3px 8px', border: '1px solid var(--border)', borderRadius: 6 }}
                onClick={() => { onUpdate('startDate', ''); onUpdate('endDate', '') }}
              >
                Clear schedule
              </button>
            )}
          </div>
        )}

      </div>
      <button style={{ ...s.iconBtn, color: 'var(--red)', alignSelf: 'flex-start', marginTop: 4 }} onClick={onRemove}>✕</button>
    </div>
  )
}

// ─── PRODUCTS TAB ────────────────────────────────────────────────────────────
function ProductsTab({ onSaved }) {
  const { products, loading, save } = useProducts()
  const [items, setItems] = useState(null)
  const [layout, setLayout] = useState('rows')
  const [title, setTitle] = useState('My Products')
  const sensors = useSensors(useSensor(PointerSensor))

  React.useEffect(() => {
    if (products && !items) {
      setItems(products.items || [])
      setLayout(products.layout || 'rows')
      setTitle(products.title || 'My Products')
    }
  }, [products])

  if (loading || !items) return <Loader />

  const saveAll = async () => {
    await save({ items, layout, title })
    onSaved()
  }

  const add = () => setItems(prev => [...prev, {
    id: uid(), name: '', description: '', price: 'Free',
    url: '', thumbnailUrl: '', visible: true, featured: false,
  }])

  const remove = (id) => setItems(prev => prev.filter(p => p.id !== id))
  const update = (id, k, v) => setItems(prev => prev.map(p => p.id === id ? { ...p, [k]: v } : p))
  const toggle = (id) => setItems(prev => prev.map(p => p.id === id ? { ...p, visible: !p.visible } : p))

  const onDragEnd = ({ active, over }) => {
    if (active.id !== over?.id) {
      setItems(prev => {
        const oldIdx = prev.findIndex(p => p.id === active.id)
        const newIdx = prev.findIndex(p => p.id === over.id)
        return arrayMove(prev, oldIdx, newIdx)
      })
    }
  }

  const optionBtn = (active) => ({
    ...s.iconBtn,
    padding: '7px 14px', fontSize: 12, borderRadius: 8,
    border: '1px solid var(--border)',
    background: active ? 'rgba(74,124,64,0.1)' : 'var(--surface2)',
    color: active ? 'var(--accent)' : 'var(--text2)',
    fontWeight: active ? 600 : 400,
  })

  return (
    <div style={s.tabBody}>

      {/* Display settings */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', letterSpacing: 0.3 }}>DISPLAY SETTINGS</div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: 'var(--muted)', width: 80 }}>Section title</span>
          <input
            style={{ ...s.input, flex: 1, height: 32, fontSize: 12 }}
            placeholder="My Products"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: 'var(--muted)', width: 80 }}>Layout</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button style={optionBtn(layout === 'rows')}   onClick={() => setLayout('rows')}>≡ Rows</button>
            <button style={optionBtn(layout === 'grid')}   onClick={() => setLayout('grid')}>⊞ Grid</button>
            <button style={optionBtn(layout === 'slider')} onClick={() => setLayout('slider')}>◀▶ Slider</button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: 'var(--muted)', width: 80 }}>Price color</span>
          <span style={{ fontSize: 12, color: 'var(--text2)' }}>
            Auto — <span style={{ color: 'var(--accent)' }}>accent</span> for "Free",{' '}
            <span style={{ color: 'var(--text)' }}>white</span> for any price with a number
          </span>
        </div>
      </div>

      <div style={s.tabInfo}>Drag to reorder. Each product shows as a card on your public page above your link sections.</div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={items.map(p => p.id)} strategy={verticalListSortingStrategy}>
          {items.map(product => (
            <SortableProductRow
              key={product.id}
              product={product}
              update={(k, v) => update(product.id, k, v)}
              toggle={() => toggle(product.id)}
              remove={() => remove(product.id)}
            />
          ))}
        </SortableContext>
      </DndContext>

      <button style={s.addBtn} onClick={add}>+ Add Product</button>
      <SaveBtn onClick={saveAll} />
    </div>
  )
}

function SortableProductRow({ product, update, toggle, remove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: product.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }
  const [open, setOpen] = React.useState(!product.name)

  return (
    <div ref={setNodeRef} style={{ ...s.linkRow, ...style, flexDirection: 'column', alignItems: 'stretch', gap: 0, padding: '10px 12px' }}>
      {/* Compact header — always visible */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span {...attributes} {...listeners} style={s.drag}>⠿</span>

        {/* Thumbnail */}
        <div style={{
          width: 32, height: 32, borderRadius: 7, flexShrink: 0,
          background: 'var(--surface2)', border: '1px solid var(--border)',
          overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {product.thumbnailUrl
            ? <img src={product.thumbnailUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
            : <span style={{ fontSize: 13, color: 'var(--muted)' }}>{product.name?.[0] || '🛍'}</span>
          }
        </div>

        {/* Name */}
        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: product.name ? 'var(--text)' : 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {product.name || 'New Product'}
        </span>

        {/* Price + actions — fixed-width right group so buttons are always aligned */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, width: 140, justifyContent: 'flex-end' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: /\d/.test(product.price) ? 'var(--text)' : 'var(--accent)', minWidth: 36, textAlign: 'right' }}>
            {product.price || 'Free'}
          </span>
          {product.featured && (
            <span title="Featured" style={{ fontSize: 12, lineHeight: 1 }}>⭐</span>
          )}
          <button style={{ ...s.iconBtn, color: product.visible ? 'var(--accent)' : 'var(--muted)', padding: '2px 6px' }} onClick={toggle}>
            {product.visible ? '👁' : '🚫'}
          </button>
          <button style={{ ...s.iconBtn, color: 'var(--red)', padding: '2px 6px' }} onClick={remove}>✕</button>
          <button
            style={{ ...s.iconBtn, color: 'var(--muted)', padding: '2px 6px', fontSize: 11, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
            onClick={() => setOpen(o => !o)}
          >▾</button>
        </div>
      </div>

      {/* Expandable fields */}
      {open && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginTop: 10 }}>
          <input
            style={s.input}
            placeholder="Product name"
            value={product.name}
            onChange={e => update('name', e.target.value)}
          />
          <input
            style={s.input}
            placeholder="Price (Free / ₱299)"
            value={product.price}
            onChange={e => update('price', e.target.value)}
          />
          <input
            style={{ ...s.input, gridColumn: '1 / -1' }}
            placeholder="Short description"
            value={product.description}
            onChange={e => update('description', e.target.value)}
          />
          <input
            style={s.input}
            placeholder="Gumroad URL"
            value={product.url}
            onChange={e => update('url', e.target.value)}
          />
          <ImageUploadField value={product.thumbnailUrl} onChange={v => update('thumbnailUrl', v)} path="products" placeholder="Thumbnail URL (optional)" />
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, color: 'var(--text2)', gridColumn: '1 / -1' }}>
            <input type="checkbox" checked={product.featured || false} onChange={e => update('featured', e.target.checked)} />
            ⭐ Featured — dark card + vibrate animation
          </label>
        </div>
      )}
    </div>
  )
}

// ─── PINNED TAB ──────────────────────────────────────────────────────────────
function PinnedTab({ onSaved }) {
  const { pinned, loading, save } = usePinned()
  const [form, setForm] = useState(null)

  // Sync once pinned data arrives
  React.useEffect(() => {
    if (pinned && !form) setForm({ ...pinned })
  }, [pinned])

  if (loading || !form) return <Loader />

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    await save(form)
    onSaved()
  }

  const BADGE_OPTIONS = [
    { value: '',     label: 'No badge' },
    { value: 'free', label: 'Free' },
    { value: 'new',  label: 'New' },
    { value: 'hot',  label: '🔥 Hot' },
  ]

  return (
    <div style={{ ...s.tabBody, maxWidth: 640 }}>

      {/* Toggle row */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--surface)', border: `1px solid ${form.enabled ? 'rgba(232,255,87,0.3)' : 'var(--border)'}`,
        borderRadius: 12, padding: '16px 20px',
        transition: 'border-color 0.2s',
      }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>
            Show pinned link on public page
          </div>
          <div style={{ fontSize: 12, color: form.enabled ? 'var(--accent)' : 'var(--muted)' }}>
            {form.enabled ? '● Live — visible to everyone' : '○ Hidden — not showing'}
          </div>
        </div>
        {/* Toggle switch */}
        <div
          onClick={() => set('enabled', !form.enabled)}
          style={{
            width: 50, height: 28, borderRadius: 100, cursor: 'pointer', position: 'relative',
            background: form.enabled ? 'var(--accent)' : 'var(--surface2)',
            border: `1px solid ${form.enabled ? 'var(--accent)' : 'var(--border)'}`,
            transition: 'background 0.2s, border-color 0.2s',
            flexShrink: 0,
          }}
        >
          <div style={{
            position: 'absolute', top: 4, left: form.enabled ? 26 : 4,
            width: 18, height: 18, borderRadius: '50%',
            background: form.enabled ? '#0a0a0a' : 'var(--muted)',
            transition: 'left 0.2s',
          }} />
        </div>
      </div>

      {/* Fields */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <div style={s.field}>
          <label style={s.label}>ICON EMOJI</label>
          <input
            style={{ ...s.input, width: 64, textAlign: 'center', fontSize: 22, padding: '8px' }}
            value={form.icon}
            onChange={e => set('icon', e.target.value)}
            placeholder="📌"
          />
        </div>
        <div style={{ ...s.field, flex: 1 }}>
          <label style={s.label}>TITLE</label>
          <input style={s.input} value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. New YouTube Video" />
        </div>
        <div style={s.field}>
          <label style={s.label}>BADGE</label>
          <select style={s.select} value={form.badge} onChange={e => set('badge', e.target.value)}>
            {BADGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      <Field
        label="ICON IMAGE URL (overrides emoji above)"
        value={form.iconUrl || ''}
        onChange={v => set('iconUrl', v)}
        placeholder="https://... (png, jpg, svg — leave blank to use emoji)"
      />

      <Field label="SUBTITLE" value={form.subtitle} onChange={v => set('subtitle', v)} placeholder="e.g. Watch my latest video on AI tools" />
      <Field label="URL" value={form.url} onChange={v => set('url', v)} placeholder="https://..." />
      <ImageUploadField label="THUMBNAIL IMAGE" value={form.thumbnailUrl || ''} onChange={v => set('thumbnailUrl', v)} path="pinned" placeholder="https://... or upload" />

      {/* Live preview */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', letterSpacing: 0.3, marginBottom: 10 }}>
          LIVE PREVIEW
        </div>
        <div style={{
          background: 'var(--bg)', border: '1px solid var(--border)',
          borderRadius: 14, padding: '20px 20px 16px',
        }}>
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: 2,
            color: 'var(--accent)', marginBottom: 10, textTransform: 'uppercase',
          }}>
            📌 Pinned
          </div>
          <PinnedCardPreview pinned={form} />
          {!form.enabled && (
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 10, textAlign: 'center' }}>
              Toggle on above to make this visible on your public page.
            </div>
          )}
        </div>
      </div>

      <SaveBtn onClick={handleSave} />
    </div>
  )
}

// ─── SUBSCRIBERS TAB ─────────────────────────────────────────────────────────
// ─── EMAIL TAB ────────────────────────────────────────────────────────────────
function EmailTab({ onSaved }) {
  const { emailConfig, loading, save } = useEmailConfig()
  const [from,        setFrom]        = useState('')
  const [subject,     setSubject]     = useState('')
  const [previewText, setPreviewText] = useState('')
  const [html,        setHtml]        = useState('')
  const [preview,     setPreview]     = useState(false)

  // Populate once data loads
  React.useEffect(() => {
    if (!loading && emailConfig !== null) {
      setFrom(emailConfig.from || '')
      setSubject(emailConfig.subject || '')
      setPreviewText(emailConfig.previewText || '')
      setHtml(emailConfig.welcomeEmailHtml || '')
    }
  }, [loading, emailConfig])

  if (loading) return <Loader />

  const handleSave = async () => {
    await save({ from, subject, previewText, welcomeEmailHtml: html })
    onSaved()
  }

  return (
    <div style={{ ...s.tabBody, maxWidth: 780 }}>

      {/* Info card */}
      <div style={{
        background: 'rgba(74,124,64,0.06)', border: '1px solid rgba(74,124,64,0.2)',
        borderRadius: 10, padding: '12px 16px', fontSize: 13, color: 'var(--text2)', lineHeight: 1.6,
      }}>
        <strong style={{ color: 'var(--accent)' }}>Welcome Email</strong> — sent automatically to every new subscriber.
        Changes save to Firestore and apply to all future sends instantly.
      </div>

      {/* From / Subject / Preview Text */}
      <Field
        label='From (e.g. John Tagudin <hello@johntagudin.com>)'
        value={from}
        onChange={setFrom}
        placeholder="John Tagudin <hello@johntagudin.com>"
      />
      <Field
        label="Subject"
        value={subject}
        onChange={setSubject}
        placeholder="you made a good call 👋"
      />
      <Field
        label="Preview Text (shown in inbox before opening — keep under 90 chars)"
        value={previewText}
        onChange={setPreviewText}
        placeholder="Here's what you get access to..."
      />

      {/* HTML toolbar */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
        <label style={{ ...s.label, marginBottom: 0 }}>HTML Body</label>
        <div style={{ flex: 1 }} />
        <button
          style={{
            ...s.iconBtn, padding: '8px 14px', fontSize: 12, fontWeight: 600,
            border: '1px solid var(--border)', borderRadius: 8,
            color: preview ? 'var(--accent)' : 'var(--text2)',
            background: preview ? 'rgba(74,124,64,0.08)' : 'var(--surface2)',
          }}
          onClick={() => setPreview(p => !p)}
        >
          {preview ? '✕ Close Preview' : '👁 Preview'}
        </button>
        <span style={{ fontSize: 11, color: 'var(--muted)' }}>
          {html.length.toLocaleString()} chars
        </span>
      </div>

      {/* Preview iframe */}
      {preview && html && (
        <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', background: '#f3f3ef' }}>
          <iframe
            srcDoc={html}
            title="Email Preview"
            style={{ width: '100%', height: 600, border: 'none', display: 'block' }}
            sandbox="allow-same-origin"
          />
        </div>
      )}

      {/* HTML textarea */}
      {!preview && (
        <textarea
          style={{
            ...s.input, minHeight: 480, resize: 'vertical',
            fontFamily: "'Courier New', Courier, monospace", fontSize: 12,
            lineHeight: 1.5, whiteSpace: 'pre',
          }}
          value={html}
          onChange={e => setHtml(e.target.value)}
          placeholder="Paste your welcome email HTML here..."
          spellCheck={false}
        />
      )}

      <SaveBtn onClick={handleSave} />
    </div>
  )
}

function SubscribersTab() {
  const { subscribers, loading } = useSubscribers()
  const [search, setSearch] = useState('')

  if (loading) return <Loader />

  const filtered = search.trim()
    ? subscribers.filter(s => s.email?.toLowerCase().includes(search.trim().toLowerCase()))
    : subscribers

  const exportCSV = () => {
    const header = 'Email,Date Joined'
    const rows = subscribers.map(s => {
      const date = s.subscribedAt?.toDate
        ? s.subscribedAt.toDate().toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })
        : s.subscribedAt || ''
      return `${s.email},${date}`
    })
    const csv  = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = 'subscribers.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ ...s.tabBody, maxWidth: 680 }}>

      {/* Big total count */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 16, padding: '28px 32px',
        display: 'flex', alignItems: 'baseline', gap: 10,
      }}>
        <div style={{
          fontFamily: "'SF Pro Display', -apple-system, sans-serif",
          fontSize: 60, fontWeight: 800, lineHeight: 1, color: 'var(--text)', letterSpacing: -3,
        }}>
          {subscribers.length}
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted)', letterSpacing: 0.2 }}>subscribers</div>
      </div>

      {/* Search + Export */}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          style={{ ...s.input, flex: 1 }}
          placeholder="Search by email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button
          style={{
            ...s.iconBtn, padding: '10px 16px', fontSize: 12, fontWeight: 600,
            border: '1px solid var(--border)', borderRadius: 8,
            color: 'var(--text2)', background: 'var(--surface2)',
          }}
          onClick={exportCSV}
        >
          ↓ Export CSV
        </button>
      </div>

      {/* Subscriber list */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '32px 24px', color: 'var(--muted)', fontSize: 13, textAlign: 'center' }}>
            {search ? 'No subscribers match your search.' : 'No subscribers yet — share your page to start building your list.'}
          </div>
        ) : (
          filtered.map((sub, i) => {
            const date = sub.subscribedAt?.toDate
              ? sub.subscribedAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : sub.subscribedAt || '—'
            return (
              <div key={sub.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 20px',
                borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)',
              }}>
                <span style={{ fontSize: 13, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                  {sub.email}
                </span>
                <span style={{ fontSize: 11, color: 'var(--muted)', flexShrink: 0, marginLeft: 16 }}>
                  {date}
                </span>
              </div>
            )
          })
        )}
      </div>

    </div>
  )
}

// ─── ANALYTICS TAB ───────────────────────────────────────────────────────────
function AnalyticsTab() {
  const { clicks, pageViews, loading } = useAnalytics()
  const [range, setRange] = useState('30')

  const days = range === 'all' ? 60 : parseInt(range)

  const filterByTime = (arr) => range === 'all' ? arr : arr.filter(c => {
    if (!c.timestamp) return false
    const d = c.timestamp.toDate ? c.timestamp.toDate() : new Date(c.timestamp)
    return d > new Date(Date.now() - days * 86400000)
  })

  const filtered   = filterByTime(clicks)
  const filteredPV = filterByTime(pageViews)

  // Clicks by day for chart
  const byDay = {}
  for (let i = days - 1; i >= 0; i--) {
    const key = new Date(Date.now() - i * 86400000).toISOString().split('T')[0]
    byDay[key] = 0
  }
  filtered.forEach(c => {
    if (!c.timestamp) return
    const d = c.timestamp.toDate ? c.timestamp.toDate() : new Date(c.timestamp)
    const key = d.toISOString().split('T')[0]
    if (key in byDay) byDay[key]++
  })
  const chartData = Object.entries(byDay).map(([date, count]) => ({ date, count }))

  // Aggregate by linkId
  const byLink = {}
  filtered.forEach(c => {
    if (!byLink[c.linkId]) byLink[c.linkId] = { title: c.linkTitle || c.linkId, count: 0 }
    byLink[c.linkId].count++
  })
  const sorted = Object.entries(byLink).sort((a, b) => b[1].count - a[1].count)

  // Summary stats
  const today = new Date().toISOString().split('T')[0]
  const clicksToday = byDay[today] || 0
  const peakDay = Math.max(...Object.values(byDay), 0)
  const activeDays = Object.values(byDay).filter(v => v > 0).length
  const avgPerDay = activeDays > 0 ? (filtered.length / days).toFixed(1) : '0'

  // ── New dimension aggregations ────────────────────────────────────────────
  const aggregate = (arr, key) => {
    const map = {}
    arr.forEach(c => { const v = c[key] || 'unknown'; map[v] = (map[v] || 0) + 1 })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }

  const bySource  = aggregate(filtered, 'source')
  const byDevice  = aggregate(filtered, 'device')
  const byBrowser = aggregate(filtered, 'browser')
  const byOS      = aggregate(filtered, 'os')

  const byCountryRaw = {}
  filtered.forEach(c => {
    if (!c.country || c.country === 'unknown') return
    if (!byCountryRaw[c.country]) byCountryRaw[c.country] = { count: 0, code: c.countryCode || '' }
    byCountryRaw[c.country].count++
  })
  const byCountry = Object.entries(byCountryRaw)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)

  const flagEmoji = (code) => {
    if (!code || code.length !== 2) return '🌐'
    return String.fromCodePoint(
      ...code.toUpperCase().split('').map(c => 0x1F1E0 + c.charCodeAt(0) - 65)
    )
  }

  const SOURCE_ICONS = {
    tiktok: '🎵', facebook: '📘', instagram: '📸', youtube: '▶️',
    twitter: '𝕏', threads: '🧵', linkedin: '💼', email: '📧', direct: '🔗', unknown: '🔗',
  }

  // Date range label
  const startDate = new Date(Date.now() - (days - 1) * 86400000)
  const endDate = new Date()
  const fmt = d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const rangeLabel = range === 'all' ? 'All time' : `${fmt(startDate)} — ${fmt(endDate)}`

  if (loading) return <div style={{ color: 'var(--muted)', padding: '32px 0', fontSize: 13 }}>Loading analytics...</div>

  return (
    <div style={{ maxWidth: 820 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {[['7', 'Last 7 days'], ['30', 'Last 30 days'], ['all', 'All time']].map(([v, label]) => (
            <button key={v} style={{
              ...s.iconBtn, padding: '7px 14px', fontSize: 12,
              border: '1px solid var(--border)', borderRadius: 8,
              background: range === v ? 'rgba(232,255,87,0.08)' : 'var(--surface2)',
              color: range === v ? 'var(--accent)' : 'var(--text2)',
              fontWeight: range === v ? 600 : 400,
            }} onClick={() => setRange(v)}>{label}</button>
          ))}
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 14 }}>📅</span> {rangeLabel}
        </div>
      </div>

      {/* Main analytics card */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>

        {/* Stats row — inspired by the reference layout */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
          {[
            { label: 'Page Views',   value: filteredPV.length, accent: true },
            { label: 'Total Clicks', value: filtered.length },
            { label: 'Conv. Rate',   value: filteredPV.length > 0 ? `${((filtered.length / filteredPV.length) * 100).toFixed(1)}%` : '—' },
            { label: 'Unique Links',  value: sorted.length },
            { label: 'Today',         value: clicksToday },
            { label: 'Peak Day',      value: peakDay },
            { label: 'Avg / Day',     value: avgPerDay },
          ].map((stat, i, arr) => (
            <div key={stat.label} style={{
              flex: 1, padding: '20px 22px',
              borderRight: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8, fontWeight: 500, letterSpacing: 0.2 }}>
                {stat.label}
              </div>
              <div style={{
                fontSize: 28, fontWeight: 800, lineHeight: 1,
                fontFamily: "'SF Pro Display', -apple-system, sans-serif",
                color: stat.accent ? 'var(--accent)' : 'var(--text)',
              }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Area chart */}
        <div style={{ padding: '20px 24px 0' }}>
          {chartData.some(d => d.count > 0) ? (
            <>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>
                {Math.max(...chartData.map(d => d.count))}
              </div>
              <AreaChart data={chartData} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', paddingBottom: 4, marginTop: 2 }}>
                <span>{fmt(startDate)}</span>
                <span>{fmt(endDate)}</span>
              </div>
            </>
          ) : (
            <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 13 }}>
              No click data yet — share your page to start tracking!
            </div>
          )}
        </div>

        {/* Top links table — like the Sources table in the reference */}
        <div style={{ borderTop: '1px solid var(--border)', marginTop: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px 10px' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Top Links</span>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>Clicks ↓</span>
          </div>

          {sorted.length === 0 ? (
            <div style={{ padding: '12px 24px 20px', color: 'var(--muted)', fontSize: 13 }}>
              No clicks recorded in this period.
            </div>
          ) : (
            sorted.slice(0, 8).map(([linkId, { title, count }], i) => (
              <div key={linkId} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 24px',
                borderTop: '1px solid var(--border)',
                background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                    background: i === 0 ? 'rgba(232,255,87,0.12)' : 'var(--surface2)',
                    border: `1px solid ${i === 0 ? 'rgba(232,255,87,0.25)' : 'var(--border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700,
                    color: i === 0 ? 'var(--accent)' : 'var(--muted)',
                  }}>#{i + 1}</div>
                  <span style={{ fontSize: 13, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0, marginLeft: 16 }}>
                  <div style={{ width: 72, height: 4, background: 'var(--surface2)', borderRadius: 99 }}>
                    <div style={{
                      height: '100%', borderRadius: 99,
                      width: `${(count / (sorted[0]?.[1].count || 1)) * 100}%`,
                      background: i === 0 ? 'var(--accent)' : 'rgba(232,255,87,0.35)',
                    }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', minWidth: 28, textAlign: 'right' }}>{count}</span>
                </div>
              </div>
            ))
          )}
        </div>

      </div>

      {/* ── Dimension cards ── */}
      {filtered.length > 0 && (() => {
        const cardStyle = {
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 16, overflow: 'hidden', marginTop: 16,
        }
        const headerStyle = {
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 24px 10px',
          borderBottom: '1px solid var(--border)',
        }
        const rowStyle = (i) => ({
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 24px',
          borderTop: i > 0 ? '1px solid var(--border)' : 'none',
        })
        const bar = (count, max) => (
          <div style={{ flex: 1, height: 4, background: 'var(--surface2)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 99,
              width: `${max > 0 ? (count / max) * 100 : 0}%`,
              background: 'var(--accent)', transition: 'width 0.4s ease',
            }} />
          </div>
        )

        return (
          <>
            {/* Traffic Sources */}
            <div style={cardStyle}>
              <div style={headerStyle}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Traffic Sources</span>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>Clicks ↓</span>
              </div>
              {bySource.map(([src, count], i) => (
                <div key={src} style={rowStyle(i)}>
                  <span style={{ fontSize: 16, width: 22, textAlign: 'center', flexShrink: 0 }}>
                    {SOURCE_ICONS[src] || '🔗'}
                  </span>
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
                const pct = filtered.length > 0 ? `${((count / filtered.length) * 100).toFixed(1)}%` : '—'
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

            {/* Top Countries */}
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
        )
      })()}

    </div>
  )
}

function PinnedCardPreview({ pinned }) {
  const BADGE_MAP = {
    free: { label: 'Free',    color: '#22c55e',      bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.2)' },
    new:  { label: 'New',     color: 'var(--accent)', bg: 'rgba(232,255,87,0.1)', border: 'rgba(232,255,87,0.2)' },
    hot:  { label: '🔥 Hot',  color: '#ff6b35',      bg: 'rgba(255,107,53,0.12)', border: 'rgba(255,107,53,0.2)' },
  }
  const badge = BADGE_MAP[pinned.badge]

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '16px 18px', borderRadius: 14,
      background: 'linear-gradient(135deg, #141a0a 0%, #0f1208 100%)',
      border: '1px solid rgba(232,255,87,0.4)',
      boxShadow: '0 0 0 1px rgba(232,255,87,0.08), 0 8px 32px rgba(232,255,87,0.08)',
      opacity: pinned.enabled ? 1 : 0.45,
      transition: 'opacity 0.2s',
    }}>
      <div style={{
        width: 42, height: 42, borderRadius: 10, flexShrink: 0,
        background: 'var(--accent)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
      }}>
        {pinned.icon || '📌'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: "'SF Pro Display', -apple-system, sans-serif", fontSize: 14, fontWeight: 700,
          color: 'var(--accent)', letterSpacing: '-0.2px', marginBottom: 2,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {pinned.title || 'Link title'}
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {pinned.subtitle || 'Subtitle goes here'}
        </div>
      </div>
      {badge && (
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: 0.5, padding: '4px 8px',
          borderRadius: 6, flexShrink: 0, textTransform: 'uppercase',
          color: badge.color, background: badge.bg, border: `1px solid ${badge.border}`,
        }}>
          {badge.label}
        </span>
      )}
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: 'var(--muted)', flexShrink: 0 }}>
        <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  )
}

// Smooth bezier area chart using SVG
function AreaChart({ data }) {
  const W = 800
  const H = 110
  const PAD_X = 2
  const PAD_Y = 8
  const max = Math.max(...data.map(d => d.count), 1)
  const n = data.length

  const pts = data.map((d, i) => ({
    x: PAD_X + (i / Math.max(n - 1, 1)) * (W - PAD_X * 2),
    y: H - PAD_Y - (d.count / max) * (H - PAD_Y * 2),
  }))

  const linePath = pts.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`
    const prev = pts[i - 1]
    const cpx = (prev.x + p.x) / 2
    return `${acc} C ${cpx} ${prev.y}, ${cpx} ${p.y}, ${p.x} ${p.y}`
  }, '')

  const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${H} L ${pts[0].x} ${H} Z`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: 130, display: 'block' }}>
      <defs>
        <linearGradient id="clicksGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4A7C40" stopOpacity="0.25" />
          <stop offset="85%" stopColor="#4A7C40" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#clicksGrad)" />
      <path d={linePath} fill="none" stroke="#4A7C40" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── REVIEWS TAB ─────────────────────────────────────────────────────────────
function ReviewsTab({ profile, update, onSaved }) {
  const { reviews, loading, approve, reject, unapprove, remove, togglePin } = useAdminReviews()
  const [subTab, setSubTab] = useState('pending')

  const pending  = reviews.filter(r => r.status === 'pending')
  const approved = reviews.filter(r => r.status === 'approved')
  const rejected = reviews.filter(r => r.status === 'rejected')

  const list = subTab === 'pending' ? pending : subTab === 'approved' ? approved : rejected

  const starStr = (n) => '★'.repeat(n) + '☆'.repeat(5 - n)

  const toggleShowReviews = async () => {
    await update({ showReviews: !profile.showReviews })
    onSaved()
  }

  return (
    <div style={s.tabBody}>
      {/* Show/hide toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Show Reviews on Public Page</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Only approved reviews are visible to visitors.</div>
        </div>
        <button
          onClick={toggleShowReviews}
          style={{
            padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: profile.showReviews ? 'var(--accent)' : 'var(--surface2)',
            color: profile.showReviews ? '#fff' : 'var(--text2)',
            fontWeight: 600, fontSize: 13,
          }}
        >
          {profile.showReviews ? 'Visible' : 'Hidden'}
        </button>
      </div>

      {/* Sub-tab nav */}
      <div style={{ display: 'flex', gap: 8 }}>
        {[
          { id: 'pending',  label: `Pending (${pending.length})` },
          { id: 'approved', label: `Approved (${approved.length})` },
          { id: 'rejected', label: `Rejected (${rejected.length})` },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            style={{
              padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)',
              background: subTab === t.id ? 'var(--accent)' : 'var(--surface2)',
              color: subTab === t.id ? '#fff' : 'var(--text2)',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && <div style={{ color: 'var(--muted)', fontSize: 13 }}>Loading...</div>}

      {!loading && list.length === 0 && (
        <div style={{ color: 'var(--muted)', fontSize: 13 }}>No {subTab} reviews.</div>
      )}

      {list.map(r => {
        const date = r.createdAt?.toDate
          ? r.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : '—'
        return (
          <div key={r.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{r.name}</span>
                <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 8 }}>{date}</span>
                {r.pinned && <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', background: 'rgba(74,124,64,0.12)', borderRadius: 4, padding: '2px 6px', marginLeft: 6 }}>PINNED</span>}
              </div>
              <span style={{ fontSize: 14, color: '#f59e0b', letterSpacing: 1 }}>{starStr(r.rating)}</span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>{r.comment}</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {r.status !== 'approved' && (
                <button onClick={() => approve(r.id)} style={{ ...s.iconBtn, background: 'rgba(34,197,94,0.1)', color: 'var(--green)', border: '1px solid rgba(34,197,94,0.2)', fontSize: 12, fontWeight: 600 }}>✓ Approve</button>
              )}
              {r.status === 'approved' && (
                <button onClick={() => unapprove(r.id)} style={{ ...s.iconBtn, background: 'var(--surface2)', color: 'var(--text2)', border: '1px solid var(--border)', fontSize: 12, fontWeight: 600 }}>Unapprove</button>
              )}
              {r.status !== 'rejected' && (
                <button onClick={() => reject(r.id)} style={{ ...s.iconBtn, background: 'rgba(239,68,68,0.08)', color: 'var(--red)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 12, fontWeight: 600 }}>✗ Reject</button>
              )}
              {r.status === 'approved' && (
                <button onClick={() => togglePin(r.id, r.pinned)} style={{ ...s.iconBtn, background: 'rgba(74,124,64,0.08)', color: 'var(--accent)', border: '1px solid rgba(74,124,64,0.2)', fontSize: 12, fontWeight: 600 }}>
                  {r.pinned ? '📌 Unpin' : '📌 Pin'}
                </button>
              )}
              <button onClick={() => { if (window.confirm('Delete this review?')) remove(r.id) }} style={{ ...s.iconBtn, background: 'rgba(239,68,68,0.06)', color: 'var(--red)', border: '1px solid rgba(239,68,68,0.15)', fontSize: 12, fontWeight: 600 }}>Delete</button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── SMALL COMPONENTS ────────────────────────────────────────────────────────
function ImageUploadField({ label, value, onChange, placeholder, path = 'images' }) {
  const fileRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [uploadErr, setUploadErr] = useState('')

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setUploadErr('Max 5 MB'); return }
    setUploadErr(''); setUploading(true)
    try {
      const sr = storageRef(storage, `${path}/${Date.now()}_${file.name}`)
      await uploadBytes(sr, file)
      const url = await getDownloadURL(sr)
      onChange(url)
    } catch {
      setUploadErr('Upload failed. Try again.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div style={s.field}>
      {label && <label style={s.label}>{label}</label>}
      <div style={{ display: 'flex', gap: 8 }}>
        <input style={{ ...s.input, flex: 1 }} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder || 'https://...'} />
        <button
          type="button"
          style={{ ...s.iconBtn, fontSize: 12, padding: '6px 12px', border: '1px solid var(--border)', borderRadius: 8, whiteSpace: 'nowrap', color: uploading ? 'var(--muted)' : 'var(--text2)' }}
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? 'Uploading...' : '↑ Upload'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
      </div>
      {uploadErr && <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 4 }}>{uploadErr}</div>}
    </div>
  )
}

function Field({ label, value, onChange, multiline, placeholder }) {
  return (
    <div style={s.field}>
      <label style={s.label}>{label}</label>
      {multiline
        ? <textarea style={{ ...s.input, minHeight: 80, resize: 'vertical' }} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
        : <input style={s.input} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
      }
    </div>
  )
}

function SaveBtn({ onClick }) {
  return <button style={s.saveBtn} onClick={onClick}>Save Changes</button>
}

function Loader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--muted)' }}>
      Loading...
    </div>
  )
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const s = {
  page: { display: 'flex', minHeight: '100vh', background: 'var(--bg)' },
  sidebar: {
    width: 220, flexShrink: 0,
    background: 'var(--surface)', borderRight: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
    padding: '24px 16px', position: 'sticky', top: 0, height: '100vh',
  },
  sideTop: { display: 'flex', flexDirection: 'column', gap: 24 },
  logo: { fontFamily: "'SF Pro Display', -apple-system, sans-serif", fontSize: 18, fontWeight: 800, color: 'var(--accent)', letterSpacing: '-0.3px' },
  nav: { display: 'flex', flexDirection: 'column', gap: 4 },
  navBtn: {
    background: 'transparent', border: 'none', borderRadius: 8,
    padding: '10px 12px', color: 'var(--text2)', fontSize: 13,
    fontWeight: 500, textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s',
  },
  navActive: { background: 'rgba(74,124,64,0.1)', color: 'var(--accent)', fontWeight: 600 },
  sideBottom: { display: 'flex', flexDirection: 'column' },
  userInfo: { display: 'flex', alignItems: 'center', gap: 8 },
  userAvatar: { width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' },
  userEmail: { fontSize: 11, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  previewBtn: {
    flex: 1, padding: '8px 0',
    background: 'rgba(74,124,64,0.08)', border: '1px solid rgba(74,124,64,0.2)',
    borderRadius: 8, color: 'var(--accent)', fontSize: 12, fontWeight: 500,
    textAlign: 'center', cursor: 'pointer',
  },
  logoutBtn: {
    padding: '8px 12px', background: 'var(--surface2)',
    border: '1px solid var(--border)', borderRadius: 8,
    color: 'var(--text2)', fontSize: 12, cursor: 'pointer',
  },
  main: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '24px 32px 0', marginBottom: 24,
  },
  headerTitle: { fontFamily: "'SF Pro Display', -apple-system, sans-serif", fontSize: 22, fontWeight: 800, color: 'var(--text)' },
  savedBadge: {
    fontSize: 12, fontWeight: 600, color: 'var(--green)',
    background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
    borderRadius: 8, padding: '6px 12px',
  },
  content: { padding: '0 32px 40px', overflow: 'auto' },
  tabBody: { display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 680 },
  tabInfo: { fontSize: 12, color: 'var(--muted)', marginBottom: 4 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 12, fontWeight: 600, color: 'var(--text2)', letterSpacing: 0.3 },
  input: {
    background: 'var(--surface2)', border: '1px solid var(--border)',
    borderRadius: 8, padding: '10px 12px', color: 'var(--text)',
    fontSize: 13, outline: 'none', width: '100%', transition: 'border-color 0.15s',
  },
  select: {
    background: 'var(--surface2)', border: '1px solid var(--border)',
    borderRadius: 8, padding: '10px 12px', color: 'var(--text)',
    fontSize: 13, outline: 'none', cursor: 'pointer',
  },
  saveBtn: {
    marginTop: 8, padding: '12px 24px', background: 'var(--accent)',
    border: 'none', borderRadius: 10, color: '#FFFFFF',
    fontSize: 14, fontWeight: 700, cursor: 'pointer',
    fontFamily: "'SF Pro Display', -apple-system, sans-serif", alignSelf: 'flex-start',
  },
  addBtn: {
    padding: '10px 16px', background: 'var(--surface2)',
    border: '1px dashed var(--border2)', borderRadius: 10,
    color: 'var(--text2)', fontSize: 13, cursor: 'pointer',
  },
  row: {
    display: 'flex', alignItems: 'center', gap: 10,
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 10, padding: '10px 12px',
  },
  rowFields: { display: 'flex', gap: 8, flex: 1 },
  rowActions: { display: 'flex', gap: 4 },
  drag: { color: 'var(--muted)', cursor: 'grab', fontSize: 18, userSelect: 'none', flexShrink: 0 },
  iconBtn: { background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 14, padding: '4px 6px', borderRadius: 6 },
  sectionRow: {
    display: 'flex', alignItems: 'center', gap: 10,
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 10, padding: '10px 12px', marginBottom: 2,
  },
  expandBtn: {
    display: 'flex', alignItems: 'center', flex: 1,
    background: 'transparent', border: 'none', cursor: 'pointer',
    color: 'var(--text)', textAlign: 'left', padding: 0,
  },
  linkCount: { fontSize: 11, color: 'var(--muted)', flexShrink: 0 },
  linksInner: {
    background: 'var(--surface2)', border: '1px solid var(--border)',
    borderTop: 'none', borderRadius: '0 0 10px 10px',
    padding: '12px', marginBottom: 8,
    display: 'flex', flexDirection: 'column', gap: 8,
  },
  linkRow: {
    display: 'flex', alignItems: 'flex-start', gap: 10,
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 8, padding: '10px 12px',
  },
  linkFields: { display: 'flex', flexDirection: 'column', gap: 8, flex: 1 },
}
