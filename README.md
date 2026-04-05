# John Tagudin — Link in Bio

Full-stack link-in-bio with Firebase backend and admin dashboard.

---

## Tech Stack
- React + Vite
- Firebase (Firestore + Google Auth)
- @dnd-kit (drag & drop)
- Vercel (hosting)

---

## Setup (30 minutes total)

### 1. Create Firebase Project

1. Go to https://console.firebase.google.com
2. Click "Add project" → name it `johntagudin-links`
3. Disable Google Analytics (not needed) → Create project

### 2. Enable Firestore

1. In Firebase console → Build → Firestore Database
2. Click "Create database"
3. Choose "Start in test mode" (we'll lock it down later)
4. Pick any region → Done

### 3. Enable Google Auth

1. Build → Authentication → Get started
2. Sign-in method → Google → Enable
3. Add your email as authorized domain
4. Save

### 4. Get Firebase Config

1. Project Settings (gear icon) → Your apps → Add app → Web
2. Register app (name it anything)
3. Copy the firebaseConfig values

### 5. Configure Environment Variables

```bash
cp .env.example .env.local
```

Fill in your values from step 4:
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_ADMIN_EMAIL=your@gmail.com  ← YOUR Gmail that can log in
```

### 6. Install & Run

```bash
npm install
npm run dev
```

Open http://localhost:5173

### 7. Lock Down Firestore (Security Rules)

In Firebase Console → Firestore → Rules, paste this:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Public can read
    match /config/{document} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.email == "YOUR_EMAIL_HERE";
    }
  }
}
```

Replace `YOUR_EMAIL_HERE` with your Gmail.

### 8. Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Add your `.env.local` variables in Vercel dashboard:
- Project Settings → Environment Variables → add each VITE_ variable

---

## Admin Dashboard

Go to `yourdomain.com/admin` → Login with Google

### What you can do:
- **Profile tab** — Edit name, handle, avatar, bio, email, footer text
- **Socials tab** — Add/remove/reorder social pills, toggle visibility
- **Links tab** — Add/remove/reorder sections and links, set badges, toggle featured style

All changes save to Firestore and update the public page in real time.

---

## File Structure

```
src/
  lib/firebase.js        ← Firebase init
  hooks/
    useAuth.js           ← Auth state
    useData.js           ← Firestore read/write
  components/
    SocialIcon.jsx       ← SVG icons
  pages/
    PublicPage.jsx       ← The link-in-bio (public)
    PublicPage.module.css
    LoginPage.jsx        ← Google login
    AdminPage.jsx        ← Full admin dashboard
  App.jsx                ← Router
  main.jsx               ← Entry point
  index.css              ← Global styles
```
