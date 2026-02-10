import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getPayPalAccessToken, getPayPalApiBase } from "@/lib/paypal"

type SubscriptionRow = {
  plan: "free" | "pro" | "business"
  status: "active" | "trialing" | "past_due" | "canceled" | "expired"
  paypal_subscription_id: string | null
}

const CANCELLABLE_STATUSES = new Set(["active", "trialing", "past_due"])

const normalizeReason = (value: unknown) => {
  if (typeof value !== "string") return "Canceled by user from dashboard."
  const trimmed = value.trim()
  if (!trimmed) return "Canceled by user from dashboard."
  return trimmed.slice(0, 127)
}

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const authHeader = request.headers.get("authorization") || request.headers.get("Authorization")

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      return NextResponse.json({ ok: false, message: "Missing Supabase configuration." }, { status: 500 })
    }

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ ok: false, message: "Missing authenticated user context." }, { status: 401 })
    }

    let payload: { reason?: unknown } = {}
    try {
      payload = await request.json()
    } catch {
      payload = {}
    }
    const reason = normalizeReason(payload.reason)

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    })

    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ ok: false, message: "Unable to resolve authenticated user." }, { status: 401 })
    }

    const admin = createClient(supabaseUrl, serviceRoleKey)

    const { data: subscription, error: subscriptionError } = await admin
      .from("subscriptions")
      .select("plan,status,paypal_subscription_id")
      .eq("user_id", user.id)
      .maybeSingle<SubscriptionRow>()

    if (subscriptionError) {
      return NextResponse.json(
        { ok: false, message: `Failed to read subscription: ${subscriptionError.message}` },
        { status: 500 }
      )
    }

    if (!subscription || subscription.plan === "free") {
      return NextResponse.json({ ok: false, message: "No paid subscription found for this account." }, { status: 400 })
    }

    if (!CANCELLABLE_STATUSES.has(subscription.status)) {
      return NextResponse.json(
        { ok: false, message: `Subscription is already ${subscription.status}.` },
        { status: 400 }
      )
    }

    if (!subscription.paypal_subscription_id) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "This subscription does not have a PayPal subscription ID yet. Please cancel it from PayPal Manage page.",
        },
        { status: 400 }
      )
    }

    const accessToken = await getPayPalAccessToken()
    const apiBase = getPayPalApiBase()

    const cancelResponse = await fetch(
      `${apiBase}/v1/billing/subscriptions/${subscription.paypal_subscription_id}/cancel`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason }),
      }
    )

    if (!cancelResponse.ok && cancelResponse.status !== 204) {
      const cancelPayload = await cancelResponse.json().catch(() => null)
      return NextResponse.json(
        { ok: false, message: cancelPayload?.message || "Failed to cancel PayPal subscription." },
        { status: 502 }
      )
    }

    const nowIso = new Date().toISOString()

    const { error: updateError } = await admin
      .from("subscriptions")
      .update({
        status: "canceled",
        updated_at: nowIso,
      })
      .eq("user_id", user.id)

    if (updateError) {
      return NextResponse.json(
        { ok: false, message: `Canceled in PayPal, but failed to update local status: ${updateError.message}` },
        { status: 500 }
      )
    }

    await admin.from("billing_records").insert({
      user_id: user.id,
      provider: "paypal",
      provider_reference: subscription.paypal_subscription_id,
      plan: subscription.plan,
      billing_cycle: null,
      status: "canceled",
      refund_note: "Canceled by user from dashboard.",
      metadata: {
        source: "dashboard_cancel",
        reason,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Failed to cancel subscription.",
      },
      { status: 500 }
    )
  }
}
