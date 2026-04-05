import React, { useState, useCallback } from 'react'
import { signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { useNavigate } from 'react-router-dom'
import { useProfile, useLinks, usePinned, useProducts, useAnalytics } from '../hooks/useData'
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
              { id: 'pinned',    label: '📌 Pinned' },
              { id: 'analytics', label: '📊 Analytics' },
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
            {tab === 'pinned'    && 'Pinned Link'}
            {tab === 'analytics' && 'Click Analytics'}
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
          {tab === 'analytics' && (
            <AnalyticsTab />
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
      <Field label="Avatar URL" value={form.avatarUrl} onChange={v => set('avatarUrl', v)} />
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
          <input style={{ ...s.input, width: 60 }} placeholder="Icon" value={link.icon} onChange={e => onUpdate('icon', e.target.value)} title="Emoji icon" />
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
    url: '', thumbnailUrl: '', visible: true,
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
            <button style={optionBtn(layout === 'rows')} onClick={() => setLayout('rows')}>≡ Rows</button>
            <button style={optionBtn(layout === 'grid')} onClick={() => setLayout('grid')}>⊞ Grid</button>
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
    <div ref={setNodeRef} style={{ ...s.linkRow, ...style, flexDirection: 'column', gap: 0, padding: '10px 12px' }}>
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

        {/* Name + price */}
        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: product.name ? 'var(--text)' : 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {product.name || 'New Product'}
        </span>
        <span style={{ fontSize: 12, fontWeight: 700, color: /\d/.test(product.price) ? 'var(--text)' : 'var(--accent)', flexShrink: 0 }}>
          {product.price || 'Free'}
        </span>

        {/* Actions */}
        <button style={{ ...s.iconBtn, color: product.visible ? 'var(--accent)' : 'var(--muted)', padding: '2px 4px' }} onClick={toggle}>
          {product.visible ? '👁' : '🚫'}
        </button>
        <button style={{ ...s.iconBtn, color: 'var(--red)', padding: '2px 4px' }} onClick={remove}>✕</button>

        {/* Expand toggle */}
        <button
          style={{ ...s.iconBtn, color: 'var(--muted)', padding: '2px 4px', fontSize: 11, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
          onClick={() => setOpen(o => !o)}
        >▾</button>
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
          <input
            style={s.input}
            placeholder="Thumbnail URL (optional)"
            value={product.thumbnailUrl}
            onChange={e => update('thumbnailUrl', e.target.value)}
          />
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
          <label style={s.label}>ICON</label>
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

      <Field label="SUBTITLE" value={form.subtitle} onChange={v => set('subtitle', v)} placeholder="e.g. Watch my latest video on AI tools" />
      <Field label="URL" value={form.url} onChange={v => set('url', v)} placeholder="https://..." />

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

// ─── ANALYTICS TAB ───────────────────────────────────────────────────────────
function AnalyticsTab() {
  const { clicks, loading } = useAnalytics()
  const [range, setRange] = useState('30')

  const days = range === 'all' ? 60 : parseInt(range)

  const filtered = range === 'all' ? clicks : clicks.filter(c => {
    if (!c.timestamp) return false
    const d = c.timestamp.toDate ? c.timestamp.toDate() : new Date(c.timestamp)
    return d > new Date(Date.now() - days * 86400000)
  })

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
            { label: 'Total Clicks', value: filtered.length, accent: true },
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

// ─── SMALL COMPONENTS ────────────────────────────────────────────────────────
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
