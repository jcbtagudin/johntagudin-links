// Vercel serverless function — fetches latest YouTube video
// Caches result in memory for 1 hour to avoid hitting API rate limits
//
// IMPORTANT: The YOUTUBE_API_KEY must have Application Restrictions set to "None"
// in Google Cloud Console. "HTTP referrers" restriction blocks server-side calls
// from Vercel since no Referer header is sent. Only API restriction (YouTube Data
// API v3) is needed.

const CACHE_DURATION = 60 * 60 * 1000 // 1 hour

let _cache = null
let _cacheAt = 0

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  // Return cached response if still fresh
  if (_cache && Date.now() - _cacheAt < CACHE_DURATION) {
    res.setHeader('X-Cache', 'HIT')
    return res.status(200).json(_cache)
  }

  const { YOUTUBE_API_KEY, YOUTUBE_CHANNEL_ID } = process.env

  // Gracefully return empty — card will silently hide, no console errors
  if (!YOUTUBE_API_KEY || !YOUTUBE_CHANNEL_ID) {
    return res.status(200).json({ error: 'not_configured' })
  }

  try {
    const endpoint =
      `https://www.googleapis.com/youtube/v3/search` +
      `?key=${YOUTUBE_API_KEY}` +
      `&channelId=${YOUTUBE_CHANNEL_ID}` +
      `&part=snippet` +
      `&order=date` +
      `&maxResults=1` +
      `&type=video`

    const r = await fetch(endpoint)
    if (!r.ok) throw new Error(`YouTube API responded with ${r.status}`)
    const data = await r.json()

    if (!data.items?.length) {
      return res.status(200).json({ error: 'no_videos' })
    }

    const { id, snippet } = data.items[0]
    const video = {
      videoId: id.videoId,
      title: snippet.title,
      thumbnail:
        snippet.thumbnails.medium?.url ||
        snippet.thumbnails.high?.url ||
        snippet.thumbnails.default?.url,
      publishedAt: snippet.publishedAt,
      url: `https://www.youtube.com/watch?v=${id.videoId}`,
    }

    _cache = video
    _cacheAt = Date.now()

    res.setHeader('X-Cache', 'MISS')
    return res.status(200).json(video)
  } catch (err) {
    // Always return 200 so the browser doesn't log a red error
    return res.status(200).json({ error: 'fetch_failed' })
  }
}
