import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "Cookie policy for Xiangliang Remove.",
}

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight">Cookie Policy</h1>
        <p className="mt-3 text-sm text-muted-foreground">Last updated: Feb 10, 2026</p>

        <section className="mt-8 space-y-4 text-sm text-muted-foreground">
          <p>
            This Cookie Policy explains how Xiangliang Remove uses cookies and similar technologies when you visit or
            use our website and services.
          </p>

          <p>
            Cookies are small text files stored on your device. They help us remember your preferences, keep your
            session secure, and understand how the service is used.
          </p>

          <p>We use cookies for the following purposes:</p>

          <ul className="list-disc space-y-2 pl-5">
            <li>Essential cookies: required for core features such as sign-in and account session handling.</li>
            <li>Preference cookies: remember settings such as language or UI preferences.</li>
            <li>Security and abuse prevention: help detect suspicious activity and protect service integrity.</li>
            <li>Analytics cookies: help us measure performance and improve product quality.</li>
          </ul>

          <p>
            Some cookies may be set by third-party providers we use to operate the service, such as hosting,
            authentication, and analytics providers.
          </p>

          <p>
            You can control or delete cookies through your browser settings. Please note that disabling essential
            cookies may affect site functionality.
          </p>

          <p>
            If you have any questions about our use of cookies, please contact us at{" "}
            <a href="mailto:dophucloan878@gmail.com" className="text-primary hover:underline">
              dophucloan878@gmail.com
            </a>
            .
          </p>
        </section>
      </main>
    </div>
  )
}
