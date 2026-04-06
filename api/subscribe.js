// Vercel serverless function — handles email newsletter subscriptions
// Flow: atomic duplicate check → save to Firestore → add to Resend Audience → send welcome email
//
// Duplicate prevention strategy:
//   Uses the email (base64url encoded) as the Firestore document ID.
//   PATCH with currentDocument.exists=false fails atomically if the doc already exists —
//   no separate read query needed, no auth required, works with allow create: if true.

import { Resend } from 'resend'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email } = req.body || {}

  // Validate email format
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())) {
    return res.status(400).json({ error: "That doesn't look like an email" })
  }

  const cleanEmail = String(email).trim().toLowerCase()
  const projectId  = process.env.VITE_FIREBASE_PROJECT_ID
  const apiKey     = process.env.VITE_FIREBASE_API_KEY

  // Use base64url of the email as the Firestore document ID.
  // base64url chars (A-Za-z0-9-_) are all valid in Firestore doc IDs.
  const emailDocId = Buffer.from(cleanEmail).toString('base64url')

  // ── 1. Atomic write to Firestore ──────────────────────────────────────────
  // POST with ?documentId= creates a document with a specific ID.
  // If the document already exists Firestore returns 409 ALREADY_EXISTS —
  // this is the reliable duplicate check that requires no prior read or auth.
  let isNewSubscriber = true
  try {
    const now   = new Date().toISOString()
    const fsUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/subscribers?documentId=${emailDocId}&key=${apiKey}`

    const fsRes = await fetch(fsUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          email:        { stringValue: cleanEmail },
          subscribedAt: { timestampValue: now },
          source:       { stringValue: 'linkinbio' },
        },
      }),
    })

    if (fsRes.status === 409) {
      // ALREADY_EXISTS — already subscribed, skip Resend entirely
      isNewSubscriber = false
    } else if (!fsRes.ok) {
      const err = await fsRes.text()
      console.error('[subscribe] Firestore write failed:', fsRes.status, err)
      return res.status(500).json({ error: 'Something went wrong. Please try again.' })
    }
  } catch (err) {
    console.error('[subscribe] Firestore error:', err)
    return res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }

  // Already subscribed — no duplicate email, no duplicate Resend contact
  if (!isNewSubscriber) {
    return res.status(200).json({ success: true })
  }

  // ── 2. Resend — add to audience + send welcome email ──────────────────────
  const RESEND_API_KEY     = process.env.RESEND_API_KEY
  const RESEND_AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID

  // Read sender address from Firestore config/profile (publicly readable, no auth needed)
  let fromAddress = 'John Tagudin <hello@johntagudin.com>'
  try {
    const profileUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/config/profile?key=${apiKey}`
    const profileRes = await fetch(profileUrl)
    if (profileRes.ok) {
      const profileData = await profileRes.json()
      const resendFrom  = profileData?.fields?.resendFrom?.stringValue
      if (resendFrom && resendFrom.trim()) fromAddress = resendFrom.trim()
    }
  } catch (_) { /* Fall back to default sender */ }

  if (RESEND_API_KEY && RESEND_AUDIENCE_ID) {
    const resend = new Resend(RESEND_API_KEY)

    // Add contact to Resend Audience
    try {
      const { error: audienceError } = await resend.contacts.create({
        audienceId: RESEND_AUDIENCE_ID,
        email: cleanEmail,
        unsubscribed: false,
      })
      if (audienceError) console.error('[subscribe] Resend audience error:', audienceError)
    } catch (err) { console.error('[subscribe] Resend audience exception:', err) }

    // Send welcome email
    try {
      const { error: emailError } = await resend.emails.send({
        from: fromAddress,
        to: [cleanEmail],
        subject: 'you made a good call 👋',
        html: `
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;color:#1a1a1a;padding:40px 24px;line-height:1.7;">
            <p style="font-size:16px;margin-bottom:20px;">
              Hey — genuinely glad you're here.
            </p>
            <p style="font-size:16px;margin-bottom:20px;">
              I only send when I find something actually worth your time — an AI tool that saved me hours, a workflow I've been quietly using, or something I built that felt too good not to share. No schedule. No filler. No "thought leadership."
            </p>
            <p style="font-size:16px;margin-bottom:28px;">
              Since you're here, here's something I made that people use every day: <a href="https://johntagudin.gumroad.com/l/FloatAdGen" style="color:#4A7C40;font-weight:600;text-decoration:none;">Float Ad Gen</a> — generate 3D floating product ad images, completely free. Takes about 30 seconds. No design skills needed.
            </p>
            <p style="font-size:16px;margin-bottom:4px;">Talk soon,</p>
            <p style="font-size:16px;font-weight:700;">John</p>
          </div>
        `,
      })
      if (emailError) console.error('[subscribe] Resend email error:', emailError)
    } catch (err) { console.error('[subscribe] Resend email exception:', err) }
  }

  return res.status(200).json({ success: true })
}
