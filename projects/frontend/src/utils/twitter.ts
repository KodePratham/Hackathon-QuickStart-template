const TWITTER_HOSTS = new Set([
  'x.com',
  'www.x.com',
  'twitter.com',
  'www.twitter.com',
  'mobile.twitter.com',
])

function parsePossibleUrl(value: string): URL | null {
  const raw = value.trim()
  if (!raw) return null

  try {
    return new URL(raw)
  } catch {
    try {
      return new URL(`https://${raw}`)
    } catch {
      return null
    }
  }
}

export function normalizeTwitterUrlInput(value: string): string | null {
  const parsed = parsePossibleUrl(value)
  if (!parsed) return null
  if (!TWITTER_HOSTS.has(parsed.hostname.toLowerCase())) return null
  if (!parsed.pathname || parsed.pathname === '/') return null
  return parsed.toString()
}

export function normalizeTwitterStatusUrlInput(value: string): string | null {
  const normalized = normalizeTwitterUrlInput(value)
  if (!normalized) return null
  const parsed = new URL(normalized)

  const segments = parsed.pathname.split('/').filter(Boolean)
  const statusIndex = segments.findIndex((segment) => segment.toLowerCase() === 'status')
  if (statusIndex < 1 || statusIndex === segments.length - 1) return null

  const statusId = segments[statusIndex + 1]
  if (!/^\d+$/.test(statusId)) return null

  return parsed.toString()
}
