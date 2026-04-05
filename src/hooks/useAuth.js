import { useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../lib/firebase'

export function useAuth() {
  const [user, setUser] = useState(undefined) // undefined = loading

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u))
    return unsub
  }, [])

  const isAdmin = user?.email === import.meta.env.VITE_ADMIN_EMAIL
  const loading = user === undefined

  return { user, isAdmin, loading }
}
