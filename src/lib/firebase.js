// src/lib/firebase.js
// Replace these with your actual Firebase project config
// Get them from: Firebase Console → Project Settings → Your Apps → Web App

import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            || 'AIzaSyACoWXbmoaXZF6dR9GKVinEtsgI9ThTXUI',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        || 'my-link-in-bio-c4918.firebaseapp.com',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         || 'my-link-in-bio-c4918',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     || 'my-link-in-bio-c4918.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '465708074859',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             || '1:465708074859:web:3c5694e9f1e8460484ae2e',
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()
