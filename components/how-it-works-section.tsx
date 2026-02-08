import { Upload, Wand2, Download } from "lucide-react"

const steps = [
  {
    icon: Upload,
    step: "01",
    title: "Upload Your Image",
    description:
      "Simply drag and drop or click to upload your image. We support JPG, PNG, and WEBP formats.",
  },
  {
    icon: Wand2,
    step: "02",
    title: "AI Removes Background",
    description:
      "Our advanced AI automatically detects the subject and removes the background in just 5 seconds.",
  },
  {
    icon: Download,
    step: "03",
    title: "Download Your Image",
    description:
      "Preview your image with transparent background and download it as a high-quality PNG file.",
  },
]

export function HowItWorksSection() {
  return (
    <section className="border-y border-border bg-secondary/30 py-20 md:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            How It <span className="text-primary">Works</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground text-balance">
            Remove backgrounds in three simple steps. No technical skills required.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="absolute top-12 left-1/2 hidden h-0.5 w-full bg-border md:block" />
              )}

              <div className="relative flex flex-col items-center text-center">
                {/* Step number */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-background px-3 py-1 text-xs font-bold text-primary">
                  {step.step}
                </div>

                {/* Icon */}
                <div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-2xl border border-border bg-card shadow-lg transition-all hover:border-primary/50 hover:shadow-primary/10">
                  <step.icon className="h-10 w-10 text-primary" />
                </div>

                {/* Content */}
                <h3 className="mt-6 text-xl font-semibold">{step.title}</h3>
                <p className="mt-2 max-w-xs text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
