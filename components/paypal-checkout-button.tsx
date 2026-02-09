"use client"

import { useEffect, useId, useState } from "react"

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
        createOrder: () => Promise<string>
        onApprove: (data: { orderID: string }) => Promise<void>
        onError: (error: unknown) => void
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

export function PayPalCheckoutButton({ plan, billingCycle }: PayPalCheckoutButtonProps) {
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const reactId = useId()
  const containerId = `paypal-buttons-${plan}-${billingCycle}-${reactId.replace(/[:]/g, "")}`

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
        createOrder: async () => {
          const response = await fetch("/api/paypal/create-order", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ plan, billingCycle }),
          })

          const data = await response.json()
          if (!response.ok || !data?.orderId) {
            throw new Error(data?.message || "Unable to create PayPal order.")
          }

          return data.orderId
        },
        onApprove: async (data) => {
          const response = await fetch("/api/paypal/capture-order", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ orderId: data.orderID }),
          })

          const payload = await response.json()
          if (!response.ok) {
            setStatusMessage(payload?.message || "Payment capture failed.")
            return
          }

          setStatusMessage("Payment completed. Your access will sync shortly.")
        },
        onError: () => {
          setStatusMessage("Payment failed. Please try again.")
        },
      })

      await buttons.render(`#${containerId}`)
    }

    void renderButtons()

    return () => {
      cancelled = true
    }
  }, [billingCycle, containerId, plan])

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
