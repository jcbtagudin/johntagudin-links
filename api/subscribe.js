// Vercel serverless function — handles email newsletter subscriptions
// Flow: check duplicate → save to Firestore → add to Resend Audience → send welcome email
// Resend failures are silently caught — the email is always safe in Firestore first.

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

  // ── 0. Duplicate check — silently succeed if already subscribed ───────────
  try {
    const queryUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery?key=${apiKey}`
    const queryRes = await fetch(queryUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'subscribers' }],
          where: {
            fieldFilter: {
              field: { fieldPath: 'email' },
              op: 'EQUAL',
              value: { stringValue: cleanEmail },
            },
          },
          limit: 1,
        },
      }),
    })
    if (queryRes.ok) {
      const results = await queryRes.json()
      if (results[0]?.document) {
        // Already subscribed — return success silently, no duplicate insert or email
        return res.status(200).json({ success: true })
      }
    }
  } catch (_) { /* If the check fails, continue and let the insert proceed */ }

  // ── 1. Save to Firestore — always do this first ───────────────────────────
  try {
    const now = new Date().toISOString()
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/subscribers?key=${apiKey}`
    const fsRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          email:        { stringValue: cleanEmail },
          subscribedAt: { timestampValue: now },
          source:       { stringValue: 'linkinbio' },
        }
      }),
    })
    if (!fsRes.ok) {
      const err = await fsRes.text()
      console.error('Firestore write failed:', err)
      return res.status(500).json({ error: 'Something went wrong. Please try again.' })
    }
  } catch (err) {
    console.error('Firestore error:', err)
    return res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }

  // ── 2 & 3. Resend — fire and forget, silently fail ────────────────────────
  const RESEND_API_KEY     = process.env.RESEND_API_KEY
  const RESEND_AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID

  // Read sender address from Firestore config/profile (publicly readable)
  let fromAddress = 'John Tagudin <hello@johntagudin.com>'
  try {
    const profileUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/config/profile?key=${apiKey}`
    const profileRes = await fetch(profileUrl)
    if (profileRes.ok) {
      const profileData = await profileRes.json()
      const resendFrom = profileData?.fields?.resendFrom?.stringValue
      if (resendFrom && resendFrom.trim()) fromAddress = resendFrom.trim()
    }
  } catch (_) { /* Fall back to default sender */ }

  if (RESEND_API_KEY && RESEND_AUDIENCE_ID) {
    // Add contact to audience
    try {
      await fetch(`https://api.resend.com/audiences/${RESEND_AUDIENCE_ID}/contacts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: cleanEmail, unsubscribed: false }),
      })
    } catch (_) { /* Silently fail — email is already saved in Firestore */ }

    // Send welcome email
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromAddress,
          to: cleanEmail,
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
        }),
      })
    } catch (_) { /* Silently fail — email is already saved in Firestore */ }
  }

  return res.status(200).json({ success: true })
}
