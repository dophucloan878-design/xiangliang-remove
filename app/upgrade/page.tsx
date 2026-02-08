"use client"

import { useMemo, useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { PayPalHostedButton } from "@/components/paypal-hosted-button"

type BillingCycle = "monthly" | "annual"

type PlanCard = {
  key: string
  heading: string
  title: string
  subtitle: string
  features: string[]
  note: string
  highlight: boolean
  paypalButtonId: string
}

const paypalButtonIds = {
  free: process.env.NEXT_PUBLIC_PAYPAL_HOSTED_BUTTON_ID_FREE || "",
  proMonthly: process.env.NEXT_PUBLIC_PAYPAL_HOSTED_BUTTON_ID_PRO || "854TA3FVC8C2C",
  businessMonthly: process.env.NEXT_PUBLIC_PAYPAL_HOSTED_BUTTON_ID_BUSINESS || "GE8JF4CD4MB8J",
  proAnnual:
    process.env.NEXT_PUBLIC_PAYPAL_HOSTED_BUTTON_ID_PRO_ANNUAL ||
    process.env.NEXT_PUBLIC_PAYPAL_HOSTED_BUTTON_ID_PRO ||
    "8J4MLH4LZCM7W",
  businessAnnual:
    process.env.NEXT_PUBLIC_PAYPAL_HOSTED_BUTTON_ID_BUSINESS_ANNUAL ||
    process.env.NEXT_PUBLIC_PAYPAL_HOSTED_BUTTON_ID_BUSINESS ||
    "A3GNMAZU43NAN",
}

const monthlyPlans: PlanCard[] = [
  {
    key: "free",
    heading: "Free",
    title: "Free — $0 / month",
    subtitle: "For trying out and light use",
    features: [
      "Full background removal functionality",
      "Web-ready exports (up to 1280px)",
      "Single image upload",
      "Standard processing speed",
      "Free for personal and occasional use",
    ],
    note: "Great for quick edits and testing the tool.",
    highlight: false,
    paypalButtonId: paypalButtonIds.free,
  },
  {
    key: "pro",
    heading: "Most Popular",
    title: "Pro — $9 / month",
    subtitle: "Most Popular · For everyday creative work",
    features: [
      "High-resolution exports (up to 2048px)",
      "No watermark",
      "Faster processing",
      "Batch image uploads",
      "Commercial use included",
    ],
    note: "Perfect for e-commerce sellers, creators, and designers.",
    highlight: true,
    paypalButtonId: paypalButtonIds.proMonthly,
  },
  {
    key: "business",
    heading: "Business",
    title: "Business — $19 / month",
    subtitle: "For teams and high-volume workflows",
    features: [
      "Everything in Pro",
      "Original-resolution exports",
      "Priority processing queue",
      "Large-scale batch processing",
      "Priority customer support",
    ],
    note: "Built for agencies and businesses working with images at scale.",
    highlight: false,
    paypalButtonId: paypalButtonIds.businessMonthly,
  },
]

const annualPlans: PlanCard[] = [
  {
    key: "free",
    heading: "Free",
    title: "Free — $0 / month",
    subtitle: "For trying out and light use",
    features: [
      "Full background removal functionality",
      "Web-ready exports (up to 1280px)",
      "Single image upload",
      "Standard processing speed",
      "Free for personal and occasional use",
    ],
    note: "Great for quick edits and testing the tool.",
    highlight: false,
    paypalButtonId: paypalButtonIds.free,
  },
  {
    key: "pro",
    heading: "Most Popular",
    title: "Pro Plan — Annual",
    subtitle: "Pro — $69 / year",
    features: [
      "Best for everyday creative work",
      "High-resolution exports (up to 2048px)",
      "Watermark-free downloads",
      "Faster processing speed",
      "Batch image uploads",
      "Licensed for commercial use",
    ],
    note: "Billed yearly. Cancel anytime.",
    highlight: true,
    paypalButtonId: paypalButtonIds.proAnnual,
  },
  {
    key: "business",
    heading: "Business",
    title: "Business Plan — Annual",
    subtitle: "Business — $149 / year",
    features: [
      "For teams and high-volume workflows",
      "Everything in Pro",
      "Original-resolution exports",
      "Priority processing queue",
      "Large-scale batch processing",
      "Priority customer support",
    ],
    note: "Billed yearly. Cancel anytime.",
    highlight: false,
    paypalButtonId: paypalButtonIds.businessAnnual,
  },
]

export default function UpgradePage() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly")

  const plans = useMemo(() => {
    return billingCycle === "monthly" ? monthlyPlans : annualPlans
  }, [billingCycle])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="pt-28 md:pt-32">
        <section className="pb-20 md:pb-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-medium text-primary">Upgrade Plan</p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                Choose the plan that fits your workflow
              </h1>
              <p className="mt-4 text-lg text-muted-foreground text-balance">
                Flexible pricing for casual users, creators, and high-volume teams. Upgrade anytime and keep
                your projects moving fast.
              </p>

              <div className="mt-8 flex items-center justify-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card p-1">
                  <button
                    type="button"
                    onClick={() => setBillingCycle("monthly")}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      billingCycle === "monthly"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingCycle("annual")}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      billingCycle === "annual"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Annual (Save 35%)
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              {plans.map((plan) => (
                <div
                  key={plan.key}
                  className={`relative overflow-hidden rounded-2xl border bg-card p-6 transition-all ${
                    plan.highlight
                      ? "border-primary/50 shadow-lg shadow-primary/10"
                      : "border-border"
                  }`}
                >
                  {plan.highlight ? (
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      {plan.heading}
                    </span>
                  ) : null}
                  <h2 className="mt-4 text-xl font-semibold">{plan.title}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{plan.subtitle}</p>

                  <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
                    {plan.features.map((feature) => (
                      <li key={feature}>• {feature}</li>
                    ))}
                  </ul>

                  <p className="mt-5 text-sm text-muted-foreground">{plan.note}</p>

                  {plan.paypalButtonId ? (
                    <div className="mt-5">
                      <PayPalHostedButton hostedButtonId={plan.paypalButtonId} />
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
