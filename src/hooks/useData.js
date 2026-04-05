import { useState, useEffect } from 'react'
import {
  doc, onSnapshot, setDoc, updateDoc,
  collection, addDoc, serverTimestamp, query, orderBy, limit
} from 'firebase/firestore'
import { db } from '../lib/firebase'

const PROFILE_DOC   = 'config/profile'
const LINKS_DOC     = 'config/links'
const PINNED_DOC    = 'config/pinned'
const PRODUCTS_DOC  = 'config/products'

// Default data seeded on first run
const DEFAULT_PROFILE = {
  name: 'John Tagudin',
  handle: '@john.tagudin',
  bio: 'Teaching 500K+ creators how to use AI tools, build smarter workflows, and actually make money online.',
  bioHighlight: 'AI tools',
  avatarUrl: 'https://framerusercontent.com/images/pr8jf2nk4dZcnTuIcpLEnUZpHg.png',
  email: 'john@johntagudin.com',
  footerText: 'For brand collabs & partnerships',
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
  title: '',
  subtitle: '',
  url: '',
  badge: '',
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

export async function logClick(linkId, linkTitle, sectionId) {
  try {
    await addDoc(collection(db, 'clicks'), {
      linkId,
      linkTitle,
      sectionId,
      timestamp: serverTimestamp(),
    })
  } catch (_) {
    // Silently fail — analytics should never break the public page
  }
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


export function useAnalytics() {
  const [clicks, setClicks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(
      collection(db, 'clicks'),
      orderBy('timestamp', 'desc'),
      limit(5000)
    )
    const unsub = onSnapshot(q, snap => {
      setClicks(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [])

  return { clicks, loading }
}

// ─── GUMROAD PRODUCTS ────────────────────────────────────────────────────────

const DEFAULT_PRODUCTS = {
  layout: 'rows',       // 'rows' | 'grid'
  priceColor: 'accent', // 'accent' | 'white'
  items: [
    {
      id: 'gp1',
      name: 'Float Ad Gen',
      description: 'Free 3D floating product ad image generator',
      price: 'Free',
      url: 'https://johntagudin.gumroad.com/l/FloatAdGen',
      thumbnailUrl: '',
      visible: true,
    },
    {
      id: 'gp2',
      name: 'Free Creator Kit',
      description: 'Premiere Pro templates and web tools',
      price: 'Free',
      url: 'https://johntagudin.gumroad.com/',
      thumbnailUrl: '',
      visible: true,
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
