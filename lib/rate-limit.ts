import { MONTHLY_FREE_LIMIT, PER_MINUTE_LIMIT } from "@/lib/limits"

type Counter = {
  count: number
  resetAt: number
}

type RateLimitStore = {
  monthly: Map<string, Counter>
  minute: Map<string, Counter>
}

const globalStore = globalThis as typeof globalThis & {
  __rateLimitStore?: RateLimitStore
}

const store: RateLimitStore =
  globalStore.__rateLimitStore ??
  (globalStore.__rateLimitStore = {
    monthly: new Map(),
    minute: new Map(),
  })

const ONE_MINUTE_MS = 60_000

const getMonthKey = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  return `${year}-${month}`
}

const getNextMonthReset = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1).getTime()
}

const getCounter = (map: Map<string, Counter>, key: string, resetAt: number, now: number) => {
  const existing = map.get(key)
  if (!existing || now >= existing.resetAt) {
    const counter = { count: 0, resetAt }
    map.set(key, counter)
    return counter
  }

  return existing
}

type RateLimitResult = { ok: true } | { ok: false; status: number; error: string }

export const getClientIp = (request: Request) => {
  const forwardedFor = request.headers.get("x-forwarded-for")
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown"
  }

  return request.headers.get("x-real-ip") || "unknown"
}

export const checkRateLimit = (ip: string, fingerprint: string) => {
  const now = new Date()
  const nowMs = now.getTime()
  const monthKey = getMonthKey(now)
  const monthResetAt = getNextMonthReset(now)

  const minuteCounter = getCounter(store.minute, `ip-minute:${ip}`, nowMs + ONE_MINUTE_MS, nowMs)
  if (minuteCounter.count >= PER_MINUTE_LIMIT) {
    return {
      ok: false,
      status: 429,
      error: "Too many requests. Please wait a minute and try again.",
    } satisfies RateLimitResult
  }

  const ipMonthly = getCounter(store.monthly, `ip-month:${ip}:${monthKey}`, monthResetAt, nowMs)
  if (ipMonthly.count >= MONTHLY_FREE_LIMIT) {
    return {
      ok: false,
      status: 429,
      error: "This IP has reached the monthly free quota (20 images).",
    } satisfies RateLimitResult
  }

  const fpKey = fingerprint || "unknown"
  const fpMonthly = getCounter(store.monthly, `fp-month:${fpKey}:${monthKey}`, monthResetAt, nowMs)
  if (fpMonthly.count >= MONTHLY_FREE_LIMIT) {
    return {
      ok: false,
      status: 429,
      error: "This device has reached the monthly free quota (20 images).",
    } satisfies RateLimitResult
  }

  minuteCounter.count += 1
  ipMonthly.count += 1
  fpMonthly.count += 1

  return { ok: true } satisfies RateLimitResult
}
