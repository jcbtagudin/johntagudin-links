import React, { useState, useCallback } from 'react'
import { signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { useNavigate } from 'react-router-dom'
import { useProfile, useLinks } from '../hooks/useData'
import { useAuth } from '../hooks/useAuth'
import SocialIcon, { SOCIAL_ICON_OPTIONS } from '../components/SocialIcon'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragOverlay
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// ─── HELPERS ────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9)

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

  return (
    <div style={s.page}>
      {/* SIDEBAR */}
      <aside style={s.sidebar}>
        <div style={s.sideTop}>
          <div style={s.logo}>⚙ Admin</div>
          <nav style={s.nav}>
            {[
              { id: 'profile', label: '👤 Profile' },
              { id: 'socials', label: '📲 Socials' },
              { id: 'links',   label: '🔗 Links' },
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
            {tab === 'profile' && 'Profile Settings'}
            {tab === 'socials' && 'Social Links'}
            {tab === 'links' && 'Link Sections'}
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
        </div>
      </main>
    </div>
  )
}

// ─── PROFILE TAB ─────────────────────────────────────────────────────────────
function ProfileTab({ profile, update, onSaved }) {
  const [form, setForm] = useState({ ...profile })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const save = async () => {
    await update(form)
    onSaved()
  }

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
      <Field label="Footer Text" value={form.footerText} onChange={v => set('footerText', v)} />
      <Field label="Contact Email" value={form.email} onChange={v => set('email', v)} />
      <SaveBtn onClick={save} />
    </div>
  )
}

// ─── SOCIALS TAB ─────────────────────────────────────────────────────────────
function SocialsTab({ data, save, onSaved }) {
  const [socials, setSocials] = useState(data.socials || [])
  const sensors = useSensors(useSensor(PointerSensor))

  const saveAll = async () => {
    await save({ ...data, socials })
    onSaved()
  }

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
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={{ ...s.row, ...style }}>
      <span {...attributes} {...listeners} style={s.drag}>⠿</span>
      <div style={s.rowFields}>
        <select
          value={item.icon}
          onChange={e => update(item.id, 'icon', e.target.value)}
          style={s.select}
        >
          {SOCIAL_ICON_OPTIONS.map(o => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        <input style={s.input} placeholder="Label (e.g. 183K TikTok)" value={item.label} onChange={e => update(item.id, 'label', e.target.value)} />
        <input style={s.input} placeholder="URL" value={item.url} onChange={e => update(item.id, 'url', e.target.value)} />
      </div>
      <div style={s.rowActions}>
        <button style={{ ...s.iconBtn, color: item.visible ? 'var(--accent)' : 'var(--muted)' }} onClick={() => toggle(item.id)} title="Toggle visibility">
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

  const saveAll = async () => {
    await save({ ...data, sections })
    onSaved()
  }

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
      links: [...(sec.links || []), { id: uid(), title: '', subtitle: '', url: '', icon: '🔗', badge: '', featured: false, visible: true }]
    } : sec))
  }

  const removeLink = (sectionId, linkId) => {
    setSections(s => s.map(sec => sec.id === sectionId ? { ...sec, links: sec.links.filter(l => l.id !== linkId) } : sec))
  }

  const updateLink = (sectionId, linkId, k, v) => {
    setSections(s => s.map(sec => sec.id === sectionId ? {
      ...sec,
      links: sec.links.map(l => l.id === linkId ? { ...l, [k]: v } : l)
    } : sec))
  }

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

  return (
    <div ref={setNodeRef} style={{ ...s.linkRow, ...style }}>
      <span {...attributes} {...listeners} style={s.drag}>⠿</span>
      <div style={s.linkFields}>
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
        <input style={s.input} placeholder="Subtitle / description" value={link.subtitle} onChange={e => onUpdate('subtitle', e.target.value)} />
        <input style={s.input} placeholder="URL (https://...)" value={link.url} onChange={e => onUpdate('url', e.target.value)} />
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 12, color: 'var(--text2)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <input type="checkbox" checked={link.featured} onChange={e => onUpdate('featured', e.target.checked)} />
            Featured (accent style)
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <input type="checkbox" checked={link.visible} onChange={e => onUpdate('visible', e.target.checked)} />
            Visible
          </label>
        </div>
      </div>
      <button style={{ ...s.iconBtn, color: 'var(--red)', alignSelf: 'flex-start', marginTop: 4 }} onClick={onRemove}>✕</button>
    </div>
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
  return (
    <button style={s.saveBtn} onClick={onClick}>Save Changes</button>
  )
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
  page: {
    display: 'flex',
    minHeight: '100vh',
    background: 'var(--bg)',
  },
  sidebar: {
    width: 220,
    flexShrink: 0,
    background: 'var(--surface)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '24px 16px',
    position: 'sticky',
    top: 0,
    height: '100vh',
  },
  sideTop: { display: 'flex', flexDirection: 'column', gap: 24 },
  logo: {
    fontFamily: 'Syne, sans-serif',
    fontSize: 18,
    fontWeight: 800,
    color: 'var(--accent)',
    letterSpacing: '-0.3px',
  },
  nav: { display: 'flex', flexDirection: 'column', gap: 4 },
  navBtn: {
    background: 'transparent',
    border: 'none',
    borderRadius: 8,
    padding: '10px 12px',
    color: 'var(--text2)',
    fontSize: 13,
    fontWeight: 500,
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  navActive: {
    background: 'rgba(232,255,87,0.08)',
    color: 'var(--accent)',
  },
  sideBottom: { display: 'flex', flexDirection: 'column' },
  userInfo: { display: 'flex', alignItems: 'center', gap: 8 },
  userAvatar: { width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' },
  userEmail: { fontSize: 11, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  previewBtn: {
    flex: 1,
    padding: '8px 0',
    background: 'rgba(232,255,87,0.08)',
    border: '1px solid rgba(232,255,87,0.15)',
    borderRadius: 8,
    color: 'var(--accent)',
    fontSize: 12,
    fontWeight: 500,
    textAlign: 'center',
    cursor: 'pointer',
  },
  logoutBtn: {
    padding: '8px 12px',
    background: 'var(--surface2)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    color: 'var(--text2)',
    fontSize: 12,
    cursor: 'pointer',
  },
  main: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '24px 32px 0',
    marginBottom: 24,
  },
  headerTitle: {
    fontFamily: 'Syne, sans-serif',
    fontSize: 22,
    fontWeight: 800,
    color: 'var(--text)',
  },
  savedBadge: {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--green)',
    background: 'rgba(34,197,94,0.1)',
    border: '1px solid rgba(34,197,94,0.2)',
    borderRadius: 8,
    padding: '6px 12px',
  },
  content: { padding: '0 32px 40px', overflow: 'auto' },
  tabBody: { display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 680 },
  tabInfo: { fontSize: 12, color: 'var(--muted)', marginBottom: 4 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 12, fontWeight: 600, color: 'var(--text2)', letterSpacing: 0.3 },
  input: {
    background: 'var(--surface2)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '10px 12px',
    color: 'var(--text)',
    fontSize: 13,
    outline: 'none',
    width: '100%',
    transition: 'border-color 0.15s',
  },
  select: {
    background: 'var(--surface2)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '10px 12px',
    color: 'var(--text)',
    fontSize: 13,
    outline: 'none',
    cursor: 'pointer',
  },
  saveBtn: {
    marginTop: 8,
    padding: '12px 24px',
    background: 'var(--accent)',
    border: 'none',
    borderRadius: 10,
    color: '#0a0a0a',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'Syne, sans-serif',
    alignSelf: 'flex-start',
  },
  addBtn: {
    padding: '10px 16px',
    background: 'var(--surface2)',
    border: '1px dashed var(--border2)',
    borderRadius: 10,
    color: 'var(--text2)',
    fontSize: 13,
    cursor: 'pointer',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    padding: '10px 12px',
  },
  rowFields: { display: 'flex', gap: 8, flex: 1 },
  rowActions: { display: 'flex', gap: 4 },
  drag: { color: 'var(--muted)', cursor: 'grab', fontSize: 18, userSelect: 'none', flexShrink: 0 },
  iconBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: 14,
    padding: '4px 6px',
    borderRadius: 6,
  },
  sectionRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    padding: '10px 12px',
    marginBottom: 2,
  },
  expandBtn: {
    display: 'flex',
    alignItems: 'center',
    flex: 1,
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text)',
    textAlign: 'left',
    padding: 0,
  },
  linkCount: { fontSize: 11, color: 'var(--muted)', flexShrink: 0 },
  linksInner: {
    background: 'var(--surface2)',
    border: '1px solid var(--border)',
    borderTop: 'none',
    borderRadius: '0 0 10px 10px',
    padding: '12px',
    marginBottom: 8,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  linkRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '10px 12px',
  },
  linkFields: { display: 'flex', flexDirection: 'column', gap: 8, flex: 1 },
}
