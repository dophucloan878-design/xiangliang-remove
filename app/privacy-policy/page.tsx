import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy policy for Xiangliang Remove.",
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
        <p className="mt-3 text-sm text-muted-foreground">Last updated: Feb 5, 2026</p>

        <section className="mt-8 space-y-4 text-sm text-muted-foreground">
          <p>
            This Privacy Policy explains how Xiangliang Remove (“we”, “us”, or “our”) collects, uses, and
            protects information when you use our background removal service.
          </p>
          <p>
            We process the images you upload solely to provide the background removal result. We do not sell
            your personal data. We may store minimal technical data (such as IP address, device identifiers, and
            usage metrics) to protect the service, enforce limits, and improve reliability.
          </p>
          <p>
            If you create an account using Google sign-in, we receive your basic profile information (such as
            name and email) from Google and use it to authenticate you and manage your subscription. We do not
            access your Google password.
          </p>
          <p>
            We may use third-party providers (such as cloud hosting, analytics, and AI inference providers) to
            deliver our service. These providers are bound by their own privacy policies and are used only to
            operate the service.
          </p>
          <p>
            You can contact us if you have questions about your data or wish to request deletion. We will
            respond as required by applicable law.
          </p>
        </section>
      </main>
    </div>
  )
}
