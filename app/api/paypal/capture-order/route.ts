import { NextResponse } from "next/server"
import { getPayPalAccessToken, getPayPalApiBase } from "@/lib/paypal"

export async function POST(request: Request) {
  try {
    const { orderId } = await request.json()

    if (!orderId || typeof orderId !== "string") {
      return NextResponse.json({ ok: false, message: "Missing orderId." }, { status: 400 })
    }

    const accessToken = await getPayPalAccessToken()
    const apiBase = getPayPalApiBase()

    const response = await fetch(`${apiBase}/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { ok: false, message: data?.message || "Failed to capture PayPal order." },
        { status: 502 }
      )
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
