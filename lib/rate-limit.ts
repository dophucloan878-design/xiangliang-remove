import { FREE_MONTHLY_LIMIT, GUEST_MONTHLY_LIMIT, PER_MINUTE_LIMIT } from "@/lib/limits"

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
type RateLimitTier = "guest" | "free"

type CheckRateLimitParams = {
  ip: string
  fingerprint: string
  tier: RateLimitTier
  userId?: string | null
}

export const getClientIp = (request: Request) => {
  const forwardedFor = request.headers.get("x-forwarded-for")
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown"
  }

  return request.headers.get("x-real-ip") || "unknown"
}

export const checkRateLimit = ({ ip, fingerprint, tier, userId }: CheckRateLimitParams) => {
  const now = new Date()
  const nowMs = now.getTime()
  const monthKey = getMonthKey(now)
  const monthResetAt = getNextMonthReset(now)
  const monthlyLimit = tier === "guest" ? GUEST_MONTHLY_LIMIT : FREE_MONTHLY_LIMIT

  const minuteScope = tier === "free" && userId ? `user-minute:${userId}` : `ip-minute:${ip}`
  const minuteCounter = getCounter(store.minute, minuteScope, nowMs + ONE_MINUTE_MS, nowMs)
  if (minuteCounter.count >= PER_MINUTE_LIMIT) {
    return {
      ok: false,
      status: 429,
      error: "Too many requests. Please wait a minute and try again.",
    } satisfies RateLimitResult
  }

  if (tier === "free" && userId) {
    const userMonthly = getCounter(store.monthly, `user-month:${userId}:${monthKey}`, monthResetAt, nowMs)
    if (userMonthly.count >= monthlyLimit) {
      return {
        ok: false,
        status: 429,
        error: `Your free account has reached the monthly quota (${monthlyLimit} images).`,
      } satisfies RateLimitResult
    }

    minuteCounter.count += 1
    userMonthly.count += 1
    return { ok: true } satisfies RateLimitResult
  }

  const ipMonthly = getCounter(store.monthly, `ip-month:${ip}:${monthKey}`, monthResetAt, nowMs)
  if (ipMonthly.count >= monthlyLimit) {
    return {
      ok: false,
      status: 429,
      error: `This IP has reached the monthly guest quota (${monthlyLimit} images).`,
    } satisfies RateLimitResult
  }

  const fpKey = fingerprint || "unknown"
  const fpMonthly = getCounter(store.monthly, `fp-month:${fpKey}:${monthKey}`, monthResetAt, nowMs)
  if (fpMonthly.count >= monthlyLimit) {
    return {
      ok: false,
      status: 429,
      error: `This device has reached the monthly guest quota (${monthlyLimit} images).`,
    } satisfies RateLimitResult
  }

  minuteCounter.count += 1
  ipMonthly.count += 1
  fpMonthly.count += 1

  return { ok: true } satisfies RateLimitResult
}
