import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

type Plan = "free" | "pro" | "business"
type PlanStatus = "active" | "trialing" | "past_due" | "canceled" | "expired"
type BillingCycle = "monthly" | "annual"

type PayPalWebhookEvent = {
  id?: string
  event_type?: string
  resource?: {
    id?: string
    status?: string
    plan_id?: string
    custom_id?: string
    subscriber?: {
      email_address?: string
    }
    payer?: {
      email_address?: string
    }
    billing_info?: {
      next_billing_time?: string
    }
  }
}

const statusFromPayPal = (value?: string): PlanStatus => {
  const status = (value || "").toUpperCase()
  if (status === "ACTIVE") return "active"
  if (status === "APPROVAL_PENDING") return "trialing"
  if (status === "SUSPENDED") return "past_due"
  if (status === "CANCELLED") return "canceled"
  if (status === "EXPIRED") return "expired"
  return "active"
}

const addDays = (days: number) => {
  const next = new Date()
  next.setDate(next.getDate() + days)
  return next.toISOString()
}

const toIsoOrNull = (value?: string) => {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString()
}

const getPayPalAccessToken = async (apiBase: string, clientId: string, clientSecret: string) => {
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")
  const response = await fetch(`${apiBase}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  })

  const data = await response.json()
  if (!response.ok || !data?.access_token) {
    throw new Error("Failed to get PayPal access token.")
  }

  return data.access_token as string
}

const verifyWebhookSignature = async (
  apiBase: string,
  accessToken: string,
  webhookId: string,
  event: PayPalWebhookEvent,
  request: Request
) => {
  const transmissionId = request.headers.get("paypal-transmission-id")
  const transmissionTime = request.headers.get("paypal-transmission-time")
  const certUrl = request.headers.get("paypal-cert-url")
  const authAlgo = request.headers.get("paypal-auth-algo")
  const transmissionSig = request.headers.get("paypal-transmission-sig")

  if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig) {
    return false
  }

  const response = await fetch(`${apiBase}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      transmission_id: transmissionId,
      transmission_time: transmissionTime,
      cert_url: certUrl,
      auth_algo: authAlgo,
      transmission_sig: transmissionSig,
      webhook_id: webhookId,
      webhook_event: event,
    }),
  })

  const data = await response.json()
  return response.ok && data?.verification_status === "SUCCESS"
}

const getMappedPlan = (
  planId: string | undefined,
  planMap: Record<string, { plan: Plan; billingCycle: BillingCycle }>
) => {
  if (!planId) return null
  return planMap[planId] || null
}

const findUserIdByEmail = async (
  supabaseUrl: string,
  serviceRoleKey: string,
  email: string
) => {
  const admin = createClient(supabaseUrl, serviceRoleKey)

  let page = 1
  const perPage = 200

  while (page <= 20) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) {
      throw error
    }

    const users = data?.users || []
    const matched = users.find((user) => (user.email || "").toLowerCase() === email.toLowerCase())
    if (matched) {
      return matched.id
    }

    if (users.length < perPage) break
    page += 1
  }

  return null
}

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const paypalClientId = process.env.PAYPAL_CLIENT_ID
  const paypalClientSecret = process.env.PAYPAL_CLIENT_SECRET
  const paypalWebhookId = process.env.PAYPAL_WEBHOOK_ID
  const paypalApiBase = process.env.PAYPAL_API_BASE || "https://api-m.paypal.com"

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ ok: false, message: "Missing Supabase configuration." }, { status: 500 })
  }

  if (!paypalClientId || !paypalClientSecret || !paypalWebhookId) {
    return NextResponse.json({ ok: false, message: "Missing PayPal webhook configuration." }, { status: 500 })
  }

  let event: PayPalWebhookEvent
  try {
    const rawBody = await request.text()
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid webhook payload." }, { status: 400 })
  }

  let accessToken: string
  try {
    accessToken = await getPayPalAccessToken(paypalApiBase, paypalClientId, paypalClientSecret)
  } catch {
    return NextResponse.json({ ok: false, message: "Failed to authenticate with PayPal." }, { status: 502 })
  }

  const isValidSignature = await verifyWebhookSignature(
    paypalApiBase,
    accessToken,
    paypalWebhookId,
    event,
    request
  )

  if (!isValidSignature) {
    return NextResponse.json({ ok: false, message: "Invalid webhook signature." }, { status: 401 })
  }

  const eventType = event.event_type || ""

  const planMap: Record<string, { plan: Plan; billingCycle: BillingCycle }> = {}
  const proMonthlyId = process.env.PAYPAL_PLAN_ID_PRO_MONTHLY
  const proAnnualId = process.env.PAYPAL_PLAN_ID_PRO_ANNUAL
  const businessMonthlyId = process.env.PAYPAL_PLAN_ID_BUSINESS_MONTHLY
  const businessAnnualId = process.env.PAYPAL_PLAN_ID_BUSINESS_ANNUAL
  if (proMonthlyId) planMap[proMonthlyId] = { plan: "pro", billingCycle: "monthly" }
  if (proAnnualId) planMap[proAnnualId] = { plan: "pro", billingCycle: "annual" }
  if (businessMonthlyId) planMap[businessMonthlyId] = { plan: "business", billingCycle: "monthly" }
  if (businessAnnualId) planMap[businessAnnualId] = { plan: "business", billingCycle: "annual" }

  const resource = event.resource || {}
  const payerEmail = resource.subscriber?.email_address || resource.payer?.email_address || ""
  const customId = resource.custom_id || ""

  let userId: string | null = null
  if (customId && /^[0-9a-fA-F-]{36}$/.test(customId)) {
    userId = customId
  } else if (payerEmail) {
    try {
      userId = await findUserIdByEmail(supabaseUrl, serviceRoleKey, payerEmail)
    } catch {
      return NextResponse.json({ ok: false, message: "Failed to resolve user for webhook." }, { status: 500 })
    }
  }

  if (!userId) {
    return NextResponse.json({ ok: true, ignored: true, reason: "User not resolved." })
  }

  const admin = createClient(supabaseUrl, serviceRoleKey)

  const proCredits = Number(process.env.PRO_MONTHLY_CREDITS || "200")
  const businessCredits = Number(process.env.BUSINESS_MONTHLY_CREDITS || "1000")

  const defaultCreditsForPlan = (plan: Plan) => {
    if (plan === "pro") return proCredits
    if (plan === "business") return businessCredits
    return 0
  }

  const upsertSubscription = async (plan: Plan, status: PlanStatus, periodEnd: string) => {
    const { data: existing } = await admin
      .from("subscriptions")
      .select("credits_remaining")
      .eq("user_id", userId)
      .maybeSingle()

    const credits = existing?.credits_remaining ?? defaultCreditsForPlan(plan)

    const { error } = await admin.from("subscriptions").upsert(
      {
        user_id: userId,
        plan,
        status,
        current_period_end: periodEnd,
        credits_remaining: credits,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )

    if (error) {
      throw error
    }
  }

  const updateStatusOnly = async (status: PlanStatus) => {
    const { error } = await admin
      .from("subscriptions")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)

    if (error) {
      throw error
    }
  }

  const appendBillingRecord = async (params: {
    plan: Plan | null
    billingCycle: BillingCycle | null
    status: string
    refundNote?: string
  }) => {
    const payload = {
      user_id: userId,
      provider: "paypal",
      provider_event_id: event.id || null,
      provider_reference: resource.id || null,
      plan: params.plan,
      billing_cycle: params.billingCycle,
      status: params.status,
      refund_note: params.refundNote || null,
      metadata: {
        event_type: eventType,
        resource,
      },
    }

    if (event.id) {
      await admin.from("billing_records").upsert(payload, { onConflict: "provider_event_id" })
      return
    }

    await admin.from("billing_records").insert(payload)
  }

  const getCurrentSubscription = async () => {
    const { data } = await admin
      .from("subscriptions")
      .select("plan")
      .eq("user_id", userId)
      .maybeSingle<{ plan: Plan }>()
    return data?.plan || null
  }

  try {
    if (
      eventType === "BILLING.SUBSCRIPTION.CREATED" ||
      eventType === "BILLING.SUBSCRIPTION.ACTIVATED" ||
      eventType === "BILLING.SUBSCRIPTION.UPDATED"
    ) {
      const mappedPlan = getMappedPlan(resource.plan_id, planMap)
      if (!mappedPlan || mappedPlan.plan === "free") {
        return NextResponse.json({ ok: true, ignored: true, reason: "Plan mapping not found." })
      }

      const status = statusFromPayPal(resource.status)
      const periodEnd =
        toIsoOrNull(resource.billing_info?.next_billing_time) ||
        (mappedPlan.billingCycle === "annual" ? addDays(365) : addDays(30))

      await upsertSubscription(mappedPlan.plan, status, periodEnd)
      await appendBillingRecord({
        plan: mappedPlan.plan,
        billingCycle: mappedPlan.billingCycle,
        status,
      })
      return NextResponse.json({ ok: true })
    }

    if (eventType === "BILLING.SUBSCRIPTION.CANCELLED") {
      await updateStatusOnly("canceled")
      await appendBillingRecord({
        plan: await getCurrentSubscription(),
        billingCycle: null,
        status: "canceled",
      })
      return NextResponse.json({ ok: true })
    }

    if (eventType === "BILLING.SUBSCRIPTION.EXPIRED") {
      await updateStatusOnly("expired")
      await appendBillingRecord({
        plan: await getCurrentSubscription(),
        billingCycle: null,
        status: "expired",
      })
      return NextResponse.json({ ok: true })
    }

    if (eventType === "BILLING.SUBSCRIPTION.SUSPENDED" || eventType === "BILLING.SUBSCRIPTION.PAYMENT.FAILED") {
      await updateStatusOnly("past_due")
      await appendBillingRecord({
        plan: await getCurrentSubscription(),
        billingCycle: null,
        status: "past_due",
        refundNote: "Payment failed. Please update payment method in PayPal.",
      })
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ ok: true, ignored: true, reason: "Event not handled." })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Failed to process webhook.",
      },
      { status: 500 }
    )
  }
}
