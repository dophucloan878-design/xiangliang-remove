type BillingCycle = "monthly" | "annual"
type PaidPlan = "pro" | "business"

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

const PAYPAL_LIVE_API_BASE = "https://api-m.paypal.com"
const PAYPAL_SANDBOX_API_BASE = "https://api-m.sandbox.paypal.com"

export const getPayPalApiBase = () => {
  const configured = process.env.PAYPAL_API_BASE?.trim()
  if (configured) {
    return configured
  }

  return process.env.NODE_ENV === "production" ? PAYPAL_LIVE_API_BASE : PAYPAL_SANDBOX_API_BASE
}

export const getPayPalCredentials = () => {
  const clientId = process.env.PAYPAL_CLIENT_ID
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error("Missing PayPal API credentials.")
  }

  return { clientId, clientSecret }
}

export const getPlanAmount = (plan: PaidPlan, billingCycle: BillingCycle) => {
  return amountMap[plan][billingCycle]
}

export const getPayPalAccessToken = async () => {
  const { clientId, clientSecret } = getPayPalCredentials()
  const apiBase = getPayPalApiBase()
  const basicToken = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")

  const response = await fetch(`${apiBase}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicToken}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  })

  const data = await response.json()

  if (!response.ok || !data?.access_token) {
    throw new Error(data?.error_description || "Failed to get PayPal access token.")
  }

  return data.access_token as string
}
