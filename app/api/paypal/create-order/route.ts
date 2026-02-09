import { NextResponse } from "next/server"
import { getPayPalAccessToken, getPayPalApiBase, getPlanAmount } from "@/lib/paypal"

type BillingCycle = "monthly" | "annual"
type PaidPlan = "pro" | "business"

const isPaidPlan = (value: string): value is PaidPlan => {
  return value === "pro" || value === "business"
}

const isBillingCycle = (value: string): value is BillingCycle => {
  return value === "monthly" || value === "annual"
}

export async function POST(request: Request) {
  try {
    const { plan, billingCycle } = await request.json()

    if (!isPaidPlan(plan) || !isBillingCycle(billingCycle)) {
      return NextResponse.json(
        { ok: false, message: "Invalid plan or billing cycle." },
        { status: 400 }
      )
    }

    const accessToken = await getPayPalAccessToken()
    const apiBase = getPayPalApiBase()
    const amount = getPlanAmount(plan, billingCycle)

    const response = await fetch(`${apiBase}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            description: `Xiangliang Remove ${plan.toUpperCase()} (${billingCycle})`,
            amount: {
              currency_code: "USD",
              value: amount,
            },
          },
        ],
      }),
    })

    const data = await response.json()

    if (!response.ok || !data?.id) {
      return NextResponse.json(
        { ok: false, message: data?.message || "Failed to create PayPal order." },
        { status: 502 }
      )
    }

    return NextResponse.json({ ok: true, orderId: data.id })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Failed to create order.",
      },
      { status: 500 }
    )
  }
}
