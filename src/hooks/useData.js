import { useState, useEffect } from 'react'
import {
  doc, onSnapshot, setDoc, updateDoc, getDoc
} from 'firebase/firestore'
import { db } from '../lib/firebase'

const PROFILE_DOC = 'config/profile'
const LINKS_DOC = 'config/links'

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
        // Seed default
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
