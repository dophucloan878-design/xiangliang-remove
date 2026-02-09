"use client"

import { useEffect, useId, useState } from "react"
import { createClient } from "@/lib/supabase/client"

type BillingCycle = "monthly" | "annual"
type PaidPlan = "pro" | "business"

type PayPalCheckoutButtonProps = {
  plan: PaidPlan
  billingCycle: BillingCycle
}

declare global {
  interface Window {
    paypal?: {
      Buttons: (options: {
        createOrder: (
          data: unknown,
          actions: {
            order: {
              create: (payload: {
                intent: "CAPTURE"
                purchase_units: Array<{
                  description: string
                  amount: { currency_code: "USD"; value: string }
                }>
              }) => Promise<string>
            }
          }
        ) => Promise<string>
        onApprove: (
          data: { orderID: string },
          actions: {
            order: {
              capture: () => Promise<{ id?: string; status?: string }>
            }
          }
        ) => Promise<void>
        onError: (error: { message?: string }) => void
        style?: {
          layout?: "vertical" | "horizontal"
          shape?: "pill" | "rect"
          color?: "gold" | "blue" | "silver" | "white" | "black"
          label?: "paypal" | "checkout" | "pay" | "buynow"
          height?: number
        }
      }) => {
        render: (selector: string) => Promise<void>
      }
    }
  }
}

const amountMap: Record<PaidPlan, Record<BillingCycle, string>> = {
  pro: {
    monthly: "9.00",
    annual: "69.00",
  },
  business: {
    monthly: "19.00",
    annual: "149.00",
  },
}

export function PayPalCheckoutButton({ plan, billingCycle }: PayPalCheckoutButtonProps) {
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const reactId = useId()
  const containerId = `paypal-buttons-${plan}-${billingCycle}-${reactId.replace(/[:]/g, "")}`
  const [supabase] = useState(() => createClient())

  useEffect(() => {
    let cancelled = false
    let retries = 0

    setLoadFailed(false)
    setStatusMessage(null)

    const renderButtons = async () => {
      if (cancelled) return

      const target = document.getElementById(containerId)
      if (!target) return

      if (!window.paypal?.Buttons) {
        retries += 1
        if (retries <= 20) {
          window.setTimeout(renderButtons, 250)
        } else {
          setLoadFailed(true)
        }
        return
      }

      target.innerHTML = ""

      const buttons = window.paypal.Buttons({
        style: {
          layout: "vertical",
          shape: "rect",
          color: "gold",
          label: "paypal",
          height: 48,
        },
        createOrder: async (_data, actions) => {
          return actions.order.create({
            intent: "CAPTURE",
            purchase_units: [
              {
                description: `Xiangliang Remove ${plan.toUpperCase()} (${billingCycle})`,
                amount: {
                  currency_code: "USD",
                  value: amountMap[plan][billingCycle],
                },
              },
            ],
          })
        },
        onApprove: async (data, actions) => {
          const capture = await actions.order.capture()
          if (capture?.status && capture.status !== "COMPLETED") {
            setStatusMessage(`Payment status: ${capture.status}. Please contact support if needed.`)
            return
          }

          const { data: sessionData } = await supabase.auth.getSession()
          const accessToken = sessionData.session?.access_token

          const logResponse = await fetch("/api/paypal/capture-order", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            },
            body: JSON.stringify({
              orderId: data.orderID,
              plan,
              billingCycle,
              captureResult: capture,
            }),
          })

          if (!logResponse.ok) {
            const payload = await logResponse.json().catch(() => null)
            setStatusMessage(
              payload?.message || "Payment completed, but billing sync is pending. Please refresh dashboard shortly."
            )
            return
          }

          setStatusMessage("Payment completed. Your access will sync shortly.")
        },
        onError: (error) => {
          setStatusMessage(error?.message || "Payment failed. Please try again.")
        },
      })

      await buttons.render(`#${containerId}`)
    }

    void renderButtons()

    return () => {
      cancelled = true
    }
  }, [billingCycle, containerId, plan, supabase])

  return (
    <div>
      <div id={containerId} />
      {loadFailed ? (
        <p className="mt-2 text-xs text-muted-foreground">PayPal failed to load. Refresh and try again.</p>
      ) : null}
      {statusMessage ? <p className="mt-2 text-xs text-muted-foreground">{statusMessage}</p> : null}
    </div>
  )
}
