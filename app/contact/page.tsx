import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Xiangliang Remove support and business team.",
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight">Contact</h1>

        <section className="mt-8 space-y-4 text-sm text-muted-foreground">
          <p>
            Have questions, feedback, or need support?
            <br />
            We would love to hear from you.
          </p>

          <p>
            📧 Email: <a href="mailto:dophucloan878@gmail.com" className="text-primary hover:underline">dophucloan878@gmail.com</a>
          </p>

          <p>We aim to respond to all inquiries within 24 hours on business days.</p>

          <p>
            For business, partnerships, or large-scale usage, please contact us via email and include a brief
            description of your needs.
          </p>
        </section>
      </main>
    </div>
  )
}
