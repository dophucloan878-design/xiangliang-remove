import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn more about Xiangliang Remove.",
}

export default function AboutUsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight">About Us</h1>

        <section className="mt-8 space-y-4 text-sm text-muted-foreground">
          <p>We build simple, powerful tools to help people work faster with images.</p>
          <p>
            Our background removal tool is designed to be fast, accurate, and easy to use - whether you are editing a
            single image or processing thousands at scale. We believe great tools should remove friction, not add
            complexity.
          </p>
          <p>
            From creators and online stores to growing teams, our mission is to make background removal effortless,
            affordable, and accessible to everyone.
          </p>
          <p>
            We are continuously improving our product based on real user feedback, focusing on performance, quality,
            and reliability.
          </p>
        </section>
      </main>
    </div>
  )
}
