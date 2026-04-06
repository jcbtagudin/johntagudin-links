// Vercel serverless function — handles email unsubscribe requests
// GET /api/unsubscribe?email=encoded@email.com
// Deletes subscriber from Firestore + marks unsubscribed in Resend Audience

import { Resend } from 'resend'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).send('Method not allowed')

  const email = req.query.email ? decodeURIComponent(req.query.email) : null

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).send(page('Invalid unsubscribe link.', false))
  }

  const cleanEmail  = email.trim().toLowerCase()
  const emailDocId  = Buffer.from(cleanEmail).toString('base64url')
  const projectId   = process.env.VITE_FIREBASE_PROJECT_ID
  const apiKey      = process.env.VITE_FIREBASE_API_KEY

  // ── 1. Delete from Firestore ──────────────────────────────────────────────
  try {
    const fsUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/subscribers/${emailDocId}?key=${apiKey}`
    await fetch(fsUrl, { method: 'DELETE' })
  } catch (err) {
    console.error('[unsubscribe] Firestore delete error:', err)
  }

  // ── 2. Mark unsubscribed in Resend Audience ───────────────────────────────
  const RESEND_API_KEY     = process.env.RESEND_API_KEY
  const RESEND_AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID

  if (RESEND_API_KEY && RESEND_AUDIENCE_ID) {
    try {
      const resend = new Resend(RESEND_API_KEY)
      await resend.contacts.update({
        audienceId: RESEND_AUDIENCE_ID,
        email: cleanEmail,
        unsubscribed: true,
      })
    } catch (err) {
      console.error('[unsubscribe] Resend update error:', err)
    }
  }

  return res.status(200).send(page("You've been unsubscribed.", true))
}

function page(message, success) {
  const color = success ? '#22C55E' : '#DC2626'
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Unsubscribe</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 24px; }
    .card { background: #fff; border-radius: 16px; padding: 48px 40px; max-width: 420px; width: 100%; text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .icon { font-size: 40px; margin-bottom: 16px; }
    h1 { font-size: 22px; font-weight: 700; color: #111; margin-bottom: 10px; }
    p { font-size: 14px; color: #666; line-height: 1.6; }
    a { color: ${color}; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${success ? '✓' : '✗'}</div>
    <h1>${message}</h1>
    <p>${success ? "You won't receive any more emails from us.<br/>Changed your mind? <a href='https://johntagudin-links.vercel.app'>Re-subscribe here.</a>" : 'Please try again or contact <a href="mailto:hello@johntagudin.com">hello@johntagudin.com</a>.'}</p>
  </div>
</body>
</html>`
}
