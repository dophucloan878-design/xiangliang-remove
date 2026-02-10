"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

type CancelSubscriptionButtonProps = {
  enabled: boolean
  fallbackManageUrl?: string
  disabledReason?: string
}

export function CancelSubscriptionButton({
  enabled,
  fallbackManageUrl,
  disabledReason,
}: CancelSubscriptionButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [supabase] = useState(() => createClient())
  const router = useRouter()

  const handleCancel = async () => {
    if (isSubmitting) {
      return
    }

    if (!enabled) {
      if (fallbackManageUrl) {
        window.open(fallbackManageUrl, "_blank", "noopener,noreferrer")
      }
      return
    }

    const confirmed = window.confirm(
      "Cancel your subscription now? You will keep access until the current paid period ends."
    )
    if (!confirmed) {
      return
    }

    setIsSubmitting(true)
    setMessage(null)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const accessToken = session?.access_token
      if (!accessToken) {
        setMessage("Please sign in again and retry.")
        return
      }

      const response = await fetch("/api/paypal/cancel-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ reason: "Canceled by user from dashboard." }),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok || !payload?.ok) {
        const nextMessage = payload?.message || "Failed to cancel subscription."
        if (fallbackManageUrl) {
          setMessage(`${nextMessage} Please continue cancellation in PayPal Manage.`)
        } else {
          setMessage(nextMessage)
        }
        return
      }

      setMessage("Subscription canceled. Status will refresh in a moment.")
      router.refresh()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to cancel subscription.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button variant="outline" onClick={handleCancel} disabled={isSubmitting || (!enabled && !fallbackManageUrl)}>
        {isSubmitting ? "Canceling..." : "Cancel Subscription"}
      </Button>
      {!enabled && disabledReason ? <p className="text-xs text-muted-foreground">{disabledReason}</p> : null}
      {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
    </div>
  )
}
