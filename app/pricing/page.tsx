"use client"

import { useMemo, useState } from "react"
import Script from "next/script"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { PayPalCheckoutButton } from "@/components/paypal-checkout-button"

type BillingCycle = "monthly" | "annual"

type PricingCard = {
  key: "free" | "pro" | "business"
  badge?: string
  title: string
  subtitle: string
  price: string
  features: string[]
  note: string
  recommended?: boolean
}

const monthlyCards: PricingCard[] = [
  {
    key: "free",
    title: "Free",
    subtitle: "For trying out and light use",
    price: "$0 / month",
    features: [
      "Full background removal",
      "Web-ready exports (up to 1280px)",
      "Single image upload",
      "Standard processing speed",
      "Personal and occasional use",
    ],
    note: "Great for quick edits and product trials.",
  },
  {
    key: "pro",
    badge: "Most Popular",
    title: "Pro",
    subtitle: "For creators and growing stores",
    price: "$9 / month",
    features: [
      "HD exports (up to 2048px)",
      "No watermark",
      "Faster processing",
      "Batch uploads",
      "Commercial use",
    ],
    note: "Designed for everyday creative workflows.",
    recommended: true,
  },
  {
    key: "business",
    title: "Business",
    subtitle: "For teams and high-volume operations",
    price: "$19 / month",
    features: [
      "Everything in Pro",
      "Original-resolution exports",
      "Priority queue",
      "Large-scale batch processing",
      "Priority support",
    ],
    note: "Built for agencies and commercial image pipelines.",
  },
]

const annualCards: PricingCard[] = [
  {
    key: "free",
    title: "Free",
    subtitle: "For trying out and light use",
    price: "$0 / month",
    features: [
      "Full background removal",
      "Web-ready exports (up to 1280px)",
      "Single image upload",
      "Standard processing speed",
      "Personal and occasional use",
    ],
    note: "Great for quick edits and product trials.",
  },
  {
    key: "pro",
    badge: "Most Popular",
    title: "Pro Plan — Annual",
    subtitle: "Best for everyday creative work",
    price: "$69 / year",
    features: [
      "High-resolution exports (up to 2048px)",
      "Watermark-free downloads",
      "Faster processing speed",
      "Batch image uploads",
      "Licensed for commercial use",
    ],
    note: "Billed yearly. Cancel anytime.",
    recommended: true,
  },
  {
    key: "business",
    title: "Business Plan — Annual",
    subtitle: "For teams and high-volume workflows",
    price: "$149 / year",
    features: [
      "Everything in Pro",
      "Original-resolution exports",
      "Priority processing queue",
      "Large-scale batch processing",
      "Priority customer support",
    ],
    note: "Billed yearly. Cancel anytime.",
  },
]

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly")
  const paypalClientId =
    process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ||
    process.env.NEXT_PUBLIC_PayPal_CLIENT_ID ||
    "Ab7GmVwQIO7BjH-KgEX0sPyoIA9aU_oczGPx8S2J27fbhSC-yxeOkKkFPJh1pRDppqIsp8tdO65WrSdf"

  const cards = useMemo(
    () => (billingCycle === "monthly" ? monthlyCards : annualCards),
    [billingCycle]
  )

  const scriptSrc = paypalClientId
    ? `https://www.paypal.com/sdk/js?client-id=${paypalClientId}&components=buttons&currency=USD`
    : null

  return (
    <div className="min-h-screen bg-background text-foreground">
      {scriptSrc ? <Script src={scriptSrc} strategy="afterInteractive" /> : null}
      <Header />
      <main className="pt-28 md:pt-32">
        <section className="pb-20 md:pb-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-medium text-primary">Pricing</p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                Remove backgrounds at your scale
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                Start free and upgrade when your workflow grows. Built for creators, stores, and teams.
              </p>

              <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-border bg-card p-1">
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

            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              {cards.map((card) => (
                <div
                  key={card.key}
                  className={`rounded-2xl border bg-card p-6 ${
                    card.recommended ? "border-primary/60 shadow-lg shadow-primary/10" : "border-border"
                  }`}
                >
                  {card.badge ? (
                    <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      {card.badge}
                    </span>
                  ) : null}

                  <h2 className="mt-4 text-2xl font-semibold tracking-tight">{card.title}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{card.subtitle}</p>
                  <p className="mt-4 text-3xl font-bold">{card.price}</p>

                  <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
                    {card.features.map((feature) => (
                      <li key={feature}>• {feature}</li>
                    ))}
                  </ul>

                  <p className="mt-5 text-sm text-muted-foreground">{card.note}</p>

                  {card.key !== "free" ? (
                    <div className="mt-6">
                      {paypalClientId ? (
                        <PayPalCheckoutButton
                          plan={card.key}
                          billingCycle={billingCycle}
                        />
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Missing `NEXT_PUBLIC_PAYPAL_CLIENT_ID`. Configure it to show checkout buttons.
                        </p>
                      )}
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
