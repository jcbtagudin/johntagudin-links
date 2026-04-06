import { useState, useEffect } from 'react'
import {
  doc, onSnapshot, setDoc, updateDoc, deleteDoc,
  collection, addDoc, serverTimestamp, query, orderBy, limit, where
} from 'firebase/firestore'
import { db } from '../lib/firebase'

const PROFILE_DOC   = 'config/profile'
const LINKS_DOC     = 'config/links'
const PINNED_DOC    = 'config/pinned'
const PRODUCTS_DOC  = 'config/products'
const EMAIL_DOC     = 'config/email'

// Default data seeded on first run
const DEFAULT_PROFILE = {
  name: 'John Tagudin',
  handle: '@john.tagudin',
  bio: 'Teaching 500K+ creators how to use AI tools, build smarter workflows, and actually make money online.',
  bioHighlight: 'AI tools',
  avatarUrl: 'https://framerusercontent.com/images/pr8jf2nk4dZcnTuIcpLEnUZpHg.png',
  email: 'john@johntagudin.com',
  footerText: 'For brand collabs & partnerships',
  status: 'Creating',
  showLatestVideo: true,
  latestVideoInline: false,
  latestVideoPosition: 'top',
}

const DEFAULT_LINKS = {
  socials: [
    { id: 's1', label: '183K TikTok', url: 'https://www.tiktok.com/@john.tagudin', icon: 'tiktok', visible: true },
    { id: 's2', label: '300K Facebook', url: 'https://facebook.com/john.tagudin', icon: 'facebook', visible: true },
    { id: 's3', label: '29K Instagram', url: 'https://instagram.com/john.tagudin', icon: 'instagram', visible: true },
    { id: 's4', label: 'YouTube', url: 'https://youtube.com/@johntagudin', icon: 'youtube', visible: true },
  ],
  sections: [
    {
      id: 'sec1',
      label: '🎁 Free Stuff',
      visible: true,
      links: [
        { id: 'l1', title: 'Float Ad Gen', subtitle: 'Free 3D floating product ad image generator', url: 'https://johntagudin.gumroad.com/l/FloatAdGen', icon: '🎨', badge: 'free', featured: true, visible: true },
        { id: 'l2', title: 'Free Creator Kit', subtitle: 'Premiere Pro templates, web app tools & more', url: 'https://johntagudin.gumroad.com/', icon: '🧰', badge: 'free', featured: false, visible: true },
      ]
    },
    {
      id: 'sec2',
      label: '⚡ Tools I Actually Use',
      visible: true,
      links: [
        { id: 'l3', title: 'WayinVideo', subtitle: 'Find clip moments from streams — 200 free credits', url: 'https://wayin.ai/tools/clip-maker/?ref=john.tagudin', icon: '✂️', badge: 'new', featured: false, visible: true },
        { id: 'l4', title: 'OpusClip', subtitle: 'Turn long videos into viral short clips automatically', url: 'https://clip.opus.pro/dashboard?coupon_code=2026CONTENT', icon: '🎬', badge: 'hot', featured: false, visible: true },
        { id: 'l5', title: 'Full Toolkit', subtitle: 'Every tool I use for content & side hustles', url: 'https://johntagudin.com/toolkit', icon: '🛠️', badge: '', featured: false, visible: true },
      ]
    },
    {
      id: 'sec3',
      label: '📚 Resources',
      visible: true,
      links: [
        { id: 'l6', title: 'Video Resources', subtitle: 'All links, guides & tools mentioned in my videos', url: 'https://johntagudin.com/comments', icon: '📎', badge: '', featured: false, visible: true },
      ]
    }
  ]
}

export function useProfile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const ref = doc(db, ...PROFILE_DOC.split('/'))
    const unsub = onSnapshot(ref, async (snap) => {
      if (snap.exists()) {
        setProfile(snap.data())
      } else {
        await setDoc(ref, DEFAULT_PROFILE)
        setProfile(DEFAULT_PROFILE)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  const update = async (data) => {
    const ref = doc(db, ...PROFILE_DOC.split('/'))
    await updateDoc(ref, data)
  }

  return { profile, loading, update }
}

// ─── PINNED LINK ─────────────────────────────────────────────────────────────

const DEFAULT_PINNED = {
  enabled: false,
  icon: '📌',
  iconUrl: '',
  title: '',
  subtitle: '',
  url: '',
  badge: '',
  thumbnailUrl: '',
}

export function usePinned() {
  const [pinned, setPinned] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const ref = doc(db, ...PINNED_DOC.split('/'))
    const unsub = onSnapshot(ref, async (snap) => {
      if (snap.exists()) {
        setPinned(snap.data())
      } else {
        await setDoc(ref, DEFAULT_PINNED)
        setPinned(DEFAULT_PINNED)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  const save = async (data) => {
    const ref = doc(db, ...PINNED_DOC.split('/'))
    await setDoc(ref, data)
  }

  return { pinned, loading, save }
}

// ─── CLICK ANALYTICS ─────────────────────────────────────────────────────────

export async function logClick(linkId, linkTitle, sectionId, metadata = {}) {
  try {
    await addDoc(collection(db, 'clicks'), {
      linkId,
      linkTitle,
      sectionId,
      source:      metadata.source      || 'direct',
      device:      metadata.device      || 'unknown',
      browser:     metadata.browser     || 'unknown',
      os:          metadata.os          || 'unknown',
      country:     metadata.country     || 'unknown',
      countryCode: metadata.countryCode || 'unknown',
      date: new Date().toISOString().slice(0, 10),
      timestamp: serverTimestamp(),
    })
  } catch (_) {
    // Silently fail — analytics should never break the public page
  }
}

export async function logPageView(metadata = {}) {
  try {
    await addDoc(collection(db, 'pageviews'), {
      source:      metadata.source      || 'direct',
      device:      metadata.device      || 'unknown',
      browser:     metadata.browser     || 'unknown',
      os:          metadata.os          || 'unknown',
      country:     metadata.country     || 'unknown',
      countryCode: metadata.countryCode || 'unknown',
      date: new Date().toISOString().slice(0, 10),
      timestamp: serverTimestamp(),
    })
  } catch (_) {}
}

export function useLinks() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const ref = doc(db, ...LINKS_DOC.split('/'))
    const unsub = onSnapshot(ref, async (snap) => {
      if (snap.exists()) {
        setData(snap.data())
      } else {
        await setDoc(ref, DEFAULT_LINKS)
        setData(DEFAULT_LINKS)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  const save = async (newData) => {
    const ref = doc(db, ...LINKS_DOC.split('/'))
    await setDoc(ref, newData)
  }

  return { data, loading, save }
}


// ─── EMAIL SUBSCRIBERS ───────────────────────────────────────────────────────

export function useSubscribers() {
  const [subscribers, setSubscribers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'subscribers'), orderBy('subscribedAt', 'desc'), limit(5000))
    const unsub = onSnapshot(q, snap => {
      setSubscribers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, () => setLoading(false))
    return unsub
  }, [])

  return { subscribers, loading }
}

export async function removeSubscriber(id) {
  await deleteDoc(doc(db, 'subscribers', id))
}

export function useAnalytics() {
  const [clicks, setClicks] = useState([])
  const [pageViews, setPageViews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let clicksDone = false
    let pvDone = false
    const tryDone = () => { if (clicksDone && pvDone) setLoading(false) }

    const q1 = query(collection(db, 'clicks'), orderBy('timestamp', 'desc'), limit(5000))
    const unsub1 = onSnapshot(q1, snap => {
      setClicks(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      clicksDone = true; tryDone()
    })

    const q2 = query(collection(db, 'pageviews'), orderBy('timestamp', 'desc'), limit(5000))
    const unsub2 = onSnapshot(q2, snap => {
      setPageViews(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      pvDone = true; tryDone()
    })

    return () => { unsub1(); unsub2() }
  }, [])

  return { clicks, pageViews, loading }
}

// ─── REVIEWS ──────────────────────────────────────────────────────────────────

// Public: approved reviews only, pinned first, newest first, max 20
export function useApprovedReviews() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(
      collection(db, 'reviews'),
      where('status', '==', 'approved'),
      limit(20)
    )
    const unsub = onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      data.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1
        if (!a.pinned && b.pinned) return 1
        const ta = a.createdAt?.toMillis?.() || 0
        const tb = b.createdAt?.toMillis?.() || 0
        return tb - ta
      })
      setReviews(data)
      setLoading(false)
    }, () => setLoading(false))
    return unsub
  }, [])

  return { reviews, loading }
}

// Admin: all reviews, newest first
export function useAdminReviews() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'), limit(500))
    const unsub = onSnapshot(q, snap => {
      setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, () => setLoading(false))
    return unsub
  }, [])

  const approve   = (id) => updateDoc(doc(db, 'reviews', id), { status: 'approved' })
  const reject    = (id) => updateDoc(doc(db, 'reviews', id), { status: 'rejected' })
  const unapprove = (id) => updateDoc(doc(db, 'reviews', id), { status: 'pending' })
  const remove    = (id) => deleteDoc(doc(db, 'reviews', id))
  const togglePin = (id, current) => updateDoc(doc(db, 'reviews', id), { pinned: !current })

  return { reviews, loading, approve, reject, unapprove, remove, togglePin }
}

// Submit a new review (public)
export async function submitReview({ name, rating, comment }) {
  await addDoc(collection(db, 'reviews'), {
    name, rating, comment,
    status: 'pending',
    pinned: false,
    createdAt: serverTimestamp(),
  })
}

// ─── EMAIL CONFIG ─────────────────────────────────────────────────────────────

export function useEmailConfig() {
  const [emailConfig, setEmailConfig] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const ref = doc(db, ...EMAIL_DOC.split('/'))
    const unsub = onSnapshot(ref, snap => {
      setEmailConfig(snap.exists() ? snap.data() : {})
      setLoading(false)
    })
    return unsub
  }, [])

  const save = async (data) => {
    const ref = doc(db, ...EMAIL_DOC.split('/'))
    await setDoc(ref, data, { merge: true })
  }

  return { emailConfig, loading, save }
}

// ─── GUMROAD PRODUCTS ────────────────────────────────────────────────────────

const DEFAULT_PRODUCTS = {
  layout: 'rows', // 'rows' | 'grid'
  title: 'My Products',
  items: [
    {
      id: 'gp1',
      name: 'Float Ad Gen',
      description: 'Free 3D floating product ad image generator',
      price: 'Free',
      url: 'https://johntagudin.gumroad.com/l/FloatAdGen',
      thumbnailUrl: '',
      visible: true,
      featured: false,
    },
    {
      id: 'gp2',
      name: 'Free Creator Kit',
      description: 'Premiere Pro templates and web tools',
      price: 'Free',
      url: 'https://johntagudin.gumroad.com/',
      thumbnailUrl: '',
      visible: true,
      featured: false,
    },
  ]
}

export function useProducts() {
  const [products, setProducts] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const ref = doc(db, ...PRODUCTS_DOC.split('/'))
    const unsub = onSnapshot(ref, async (snap) => {
      if (snap.exists()) {
        setProducts(snap.data())
      } else {
        await setDoc(ref, DEFAULT_PRODUCTS)
        setProducts(DEFAULT_PRODUCTS)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  const save = async (data) => {
    const ref = doc(db, ...PRODUCTS_DOC.split('/'))
    await setDoc(ref, data)
  }

  return { products, loading, save }
}
