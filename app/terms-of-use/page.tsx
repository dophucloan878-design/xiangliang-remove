import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Terms of use for Xiangliang Remove.",
}

export default function TermsOfUsePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight">Terms of Use</h1>
        <p className="mt-3 text-sm text-muted-foreground">Last updated: Feb 5, 2026</p>

        <section className="mt-8 space-y-4 text-sm text-muted-foreground">
          <p>
            By accessing or using Xiangliang Remove, you agree to these Terms of Use. If you do not agree,
            please do not use the service.
          </p>
          <p>
            You are responsible for the content you upload. You must have the necessary rights to upload and
            process the images. You agree not to use the service for unlawful, harmful, or abusive purposes.
          </p>
          <p>
            The service is provided “as is” and may change or be discontinued at any time. We do not guarantee
            that results will be error-free or uninterrupted. We are not liable for any damages resulting from
            your use of the service.
          </p>
          <p>
            Usage limits apply to both guest users (not signed in) and free accounts. If you exceed your free
            quota, you may need to wait until the next billing period or upgrade to a paid plan to continue.
          </p>
          <p>
            We may update these Terms from time to time. Continued use of the service after changes means you
            accept the updated Terms.
          </p>
        </section>
      </main>
    </div>
  )
}
