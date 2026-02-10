import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getPayPalAccessToken, getPayPalApiBase } from "@/lib/paypal"

type Plan = "pro" | "business"
type BillingCycle = "monthly" | "annual"

const isPlan = (value: string): value is Plan => value === "pro" || value === "business"
const isBillingCycle = (value: string): value is BillingCycle => value === "monthly" || value === "annual"

const addDays = (days: number) => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString()
}

const getPlanCredits = (plan: Plan, billingCycle: BillingCycle) => {
  const proMonthly = Number(process.env.PRO_MONTHLY_CREDITS || "200")
  const businessMonthly = Number(process.env.BUSINESS_MONTHLY_CREDITS || "1000")
  const proAnnual = Number(process.env.PRO_ANNUAL_CREDITS || proMonthly)
  const businessAnnual = Number(process.env.BUSINESS_ANNUAL_CREDITS || businessMonthly)

  if (plan === "pro") {
    return billingCycle === "annual" ? proAnnual : proMonthly
  }

  return billingCycle === "annual" ? businessAnnual : businessMonthly
}

export async function POST(request: Request) {
  try {
    const { orderId, plan, billingCycle, captureResult } = await request.json()

    if (!orderId || typeof orderId !== "string") {
      return NextResponse.json({ ok: false, message: "Missing orderId." }, { status: 400 })
    }

    if (!isPlan(plan) || !isBillingCycle(billingCycle)) {
      return NextResponse.json({ ok: false, message: "Invalid plan or billing cycle." }, { status: 400 })
    }

    let data: any = null

    if (captureResult && typeof captureResult === "object") {
      data = captureResult
    } else {
      const accessToken = await getPayPalAccessToken()
      const apiBase = getPayPalApiBase()

      const response = await fetch(`${apiBase}/v2/checkout/orders/${orderId}/capture`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      })

      data = await response.json()

      if (!response.ok) {
        return NextResponse.json(
          { ok: false, message: data?.message || "Failed to capture PayPal order." },
          { status: 502 }
        )
      }
    }

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
    const firstUnit = Array.isArray(data?.purchase_units) ? data.purchase_units[0] : null
    const amount = firstUnit?.payments?.captures?.[0]?.amount
    const status = (data?.status || "COMPLETED").toLowerCase()
    const providerReference = data?.id || orderId

    const { data: existingBilling, error: existingBillingError } = await admin
      .from("billing_records")
      .select("id")
      .eq("provider", "paypal")
      .eq("provider_reference", providerReference)
      .limit(1)
      .maybeSingle()

    if (existingBillingError) {
      return NextResponse.json(
        { ok: false, message: `Failed to query billing records: ${existingBillingError.message}` },
        { status: 500 }
      )
    }

    if (!existingBilling) {
      const { error: insertBillingError } = await admin.from("billing_records").insert({
        user_id: user.id,
        provider: "paypal",
        provider_reference: providerReference,
        plan,
        billing_cycle: billingCycle,
        amount: amount?.value || null,
        currency: amount?.currency_code || "USD",
        status,
        metadata: {
          source: "checkout_capture",
          order: data,
        },
      })

      if (insertBillingError) {
        return NextResponse.json(
          { ok: false, message: `Failed to insert billing record: ${insertBillingError.message}` },
          { status: 500 }
        )
      }
    }

    const periodEnd = billingCycle === "annual" ? addDays(365) : addDays(30)
    const credits = getPlanCredits(plan, billingCycle)

    const { error: subscriptionError } = await admin.from("subscriptions").upsert(
      {
        user_id: user.id,
        plan,
        status: "active",
        current_period_end: periodEnd,
        credits_remaining: credits,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )

    if (subscriptionError) {
      return NextResponse.json(
        { ok: false, message: `Failed to sync subscription: ${subscriptionError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      synced: true,
      status: data?.status || "COMPLETED",
      orderId: data?.id || orderId,
      result: data,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Failed to capture order.",
      },
      { status: 500 }
    )
  }
}
