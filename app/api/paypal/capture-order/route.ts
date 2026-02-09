import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getPayPalAccessToken, getPayPalApiBase } from "@/lib/paypal"

type Plan = "pro" | "business"
type BillingCycle = "monthly" | "annual"

const isPlan = (value: string): value is Plan => value === "pro" || value === "business"
const isBillingCycle = (value: string): value is BillingCycle => value === "monthly" || value === "annual"

export async function POST(request: Request) {
  try {
    const { orderId, plan, billingCycle, captureResult } = await request.json()

    if (!orderId || typeof orderId !== "string") {
      return NextResponse.json({ ok: false, message: "Missing orderId." }, { status: 400 })
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

    if (authHeader?.startsWith("Bearer ") && supabaseUrl && supabaseAnonKey && serviceRoleKey) {
      const authClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      })

      const {
        data: { user },
      } = await authClient.auth.getUser()

      if (user) {
        const admin = createClient(supabaseUrl, serviceRoleKey)
        const firstUnit = Array.isArray(data?.purchase_units) ? data.purchase_units[0] : null
        const amount = firstUnit?.payments?.captures?.[0]?.amount
        const status = (data?.status || "COMPLETED").toLowerCase()

        const { data: existing } = await admin
          .from("billing_records")
          .select("id")
          .eq("provider", "paypal")
          .eq("provider_reference", data?.id || orderId)
          .limit(1)
          .maybeSingle()

        if (existing) {
          return NextResponse.json({
            ok: true,
            status: data?.status || "COMPLETED",
            orderId: data?.id || orderId,
            result: data,
          })
        }

        await admin.from("billing_records").insert({
          user_id: user.id,
          provider: "paypal",
          provider_reference: data?.id || orderId,
          plan: typeof plan === "string" && isPlan(plan) ? plan : null,
          billing_cycle: typeof billingCycle === "string" && isBillingCycle(billingCycle) ? billingCycle : null,
          amount: amount?.value || null,
          currency: amount?.currency_code || "USD",
          status,
          metadata: {
            source: "checkout_capture",
            order: data,
          },
        })
      }
    }

    return NextResponse.json({
      ok: true,
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
