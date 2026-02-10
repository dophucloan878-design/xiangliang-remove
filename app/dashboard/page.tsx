import Link from "next/link"
import { redirect } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { CancelSubscriptionButton } from "@/components/cancel-subscription-button"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { FREE_MONTHLY_LIMIT } from "@/lib/limits"

type SubscriptionRow = {
  plan: "free" | "pro" | "business"
  status: "active" | "trialing" | "past_due" | "canceled" | "expired"
  current_period_end: string
  credits_remaining: number | null
  paypal_subscription_id: string | null
}

type BillingRow = {
  id: number
  plan: "free" | "pro" | "business" | null
  billing_cycle: "monthly" | "annual" | null
  amount: string | number | null
  currency: string | null
  status: string
  refund_note: string | null
  created_at: string
}

type UsageRow = {
  id: number
  plan: "free" | "pro" | "business"
  image_count: number
  processing_ms: number | null
  status: "success" | "failed" | "rate_limited" | "insufficient_credits"
  failure_reason: string | null
  created_at: string
}

const formatDate = (value?: string | null) => {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleString()
}

const formatMoney = (amount: string | number | null, currency?: string | null) => {
  if (amount === null || amount === undefined || amount === "") return "-"
  const value = Number(amount)
  if (Number.isNaN(value)) return "-"
  return `${value.toFixed(2)} ${currency || "USD"}`
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/")
  }

  const [subscriptionResult, billingResult, usageResult, freeUsageCountResult] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("plan,status,current_period_end,credits_remaining,paypal_subscription_id")
      .eq("user_id", user.id)
      .maybeSingle<SubscriptionRow>(),
    supabase
      .from("billing_records")
      .select("id,plan,billing_cycle,amount,currency,status,refund_note,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("usage_logs")
      .select("id,plan,image_count,processing_ms,status,failure_reason,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("usage_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("plan", "free")
      .gte("created_at", monthStart.toISOString())
      .in("status", ["success", "failed"]),
  ])

  const subscription = subscriptionResult.error ? null : subscriptionResult.data
  const billingRows = billingResult.error ? [] : ((billingResult.data || []) as BillingRow[])
  const usageRows = usageResult.error ? [] : ((usageResult.data || []) as UsageRow[])

  const currentPlan = subscription?.plan || "free"
  const currentStatus = subscription?.status || "active"
  const periodEnd = subscription?.current_period_end || null
  const creditsRemaining = subscription?.credits_remaining ?? null
  const paypalSubscriptionId = subscription?.paypal_subscription_id || null
  const freeMonthlyUsed = freeUsageCountResult.error ? 0 : freeUsageCountResult.count || 0
  const freeRemaining = Math.max(FREE_MONTHLY_LIMIT - freeMonthlyUsed, 0)
  const creditsLabel = currentPlan === "free" ? "Monthly Free Remaining" : "Credits Remaining"
  const creditsValue = currentPlan === "free" ? `${freeRemaining} / ${FREE_MONTHLY_LIMIT}` : creditsRemaining === null ? "-" : creditsRemaining
  const isPaidPlan = currentPlan === "pro" || currentPlan === "business"
  const canCancelStatus = currentStatus === "active" || currentStatus === "trialing" || currentStatus === "past_due"
  const canCancelDirectly = Boolean(isPaidPlan && canCancelStatus && paypalSubscriptionId)
  const canUseManageFallback = Boolean(isPaidPlan && canCancelStatus && !paypalSubscriptionId)
  const cancelDisabledReason = !isPaidPlan
    ? "Free plan does not require cancellation."
    : !canCancelStatus
      ? `Subscription is already ${currentStatus}.`
      : !paypalSubscriptionId
        ? "Direct cancel unavailable for this order. Click to continue in PayPal Manage."
        : undefined

  const paypalManageUrl =
    process.env.NEXT_PUBLIC_PAYPAL_MANAGE_SUBSCRIPTION_URL ||
    "https://www.paypal.com/myaccount/autopay"

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="pt-28 md:pt-32">
        <section className="pb-20 md:pb-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight">User Dashboard</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Manage your plan, billing history, usage records, and subscription actions.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <section className="rounded-2xl border border-border bg-card p-6">
                <h2 className="text-xl font-semibold">User Center</h2>
                <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <p>
                    <span className="font-medium text-foreground">Current Plan:</span> {currentPlan}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Status:</span> {currentStatus}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Current Period End:</span> {formatDate(periodEnd)}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">{creditsLabel}:</span> {creditsValue}
                  </p>
                </div>
              </section>

              <section className="rounded-2xl border border-border bg-card p-6">
                <h2 className="text-xl font-semibold">Subscription Management</h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  Upgrade, downgrade, or cancel your subscription directly from the actions below.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Button asChild>
                    <Link href="/pricing">Upgrade / Downgrade</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <a href={paypalManageUrl} target="_blank" rel="noreferrer">
                      Manage in PayPal
                    </a>
                  </Button>
                  <CancelSubscriptionButton
                    enabled={canCancelDirectly}
                    fallbackManageUrl={canUseManageFallback ? paypalManageUrl : undefined}
                    disabledReason={cancelDisabledReason}
                  />
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Refund note: Refund processing follows your plan policy and PayPal settlement rules.
                </p>
              </section>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <section className="rounded-2xl border border-border bg-card p-6">
                <h2 className="text-xl font-semibold">Billing Center</h2>
                <p className="mt-2 text-sm text-muted-foreground">Payment records, statuses, and refund notes.</p>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-muted-foreground">
                      <tr>
                        <th className="pb-2">Time</th>
                        <th className="pb-2">Plan</th>
                        <th className="pb-2">Cycle</th>
                        <th className="pb-2">Amount</th>
                        <th className="pb-2">Status</th>
                        <th className="pb-2">Refund Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {billingRows.length === 0 ? (
                        <tr>
                          <td className="py-3 text-muted-foreground" colSpan={6}>
                            No billing records yet.
                          </td>
                        </tr>
                      ) : (
                        billingRows.map((row) => (
                          <tr key={row.id} className="border-t border-border/60">
                            <td className="py-3 pr-4">{formatDate(row.created_at)}</td>
                            <td className="py-3 pr-4">{row.plan || "-"}</td>
                            <td className="py-3 pr-4">{row.billing_cycle || "-"}</td>
                            <td className="py-3 pr-4">{formatMoney(row.amount, row.currency)}</td>
                            <td className="py-3 pr-4">{row.status}</td>
                            <td className="py-3 pr-4">{row.refund_note || "No refund request."}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="rounded-2xl border border-border bg-card p-6">
                <h2 className="text-xl font-semibold">Usage Records</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Track processing time, image count, status, and failure reasons.
                </p>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-muted-foreground">
                      <tr>
                        <th className="pb-2">Time</th>
                        <th className="pb-2">Images</th>
                        <th className="pb-2">Plan</th>
                        <th className="pb-2">Processing</th>
                        <th className="pb-2">Status</th>
                        <th className="pb-2">Failure Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usageRows.length === 0 ? (
                        <tr>
                          <td className="py-3 text-muted-foreground" colSpan={6}>
                            No usage records yet.
                          </td>
                        </tr>
                      ) : (
                        usageRows.map((row) => (
                          <tr key={row.id} className="border-t border-border/60">
                            <td className="py-3 pr-4">{formatDate(row.created_at)}</td>
                            <td className="py-3 pr-4">{row.image_count}</td>
                            <td className="py-3 pr-4">{row.plan}</td>
                            <td className="py-3 pr-4">
                              {row.processing_ms === null ? "-" : `${(row.processing_ms / 1000).toFixed(2)}s`}
                            </td>
                            <td className="py-3 pr-4">{row.status}</td>
                            <td className="py-3 pr-4">{row.failure_reason || "-"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
