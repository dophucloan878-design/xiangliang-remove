import { Zap, Sparkles, Layers, Download, Palette, ImageIcon } from "lucide-react"

const features = [
  {
    icon: Sparkles,
    title: "AI-Powered Precision",
    description:
      "Advanced AI technology accurately detects subjects and removes backgrounds, even with complex edges and fine details like hair.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description:
      "Remove backgrounds in just 5 seconds — much faster than manual methods. Save time and boost your productivity.",
  },
  {
    icon: Layers,
    title: "Transparent PNG Output",
    description:
      "Get clean, high-quality transparent PNG files ready for any design project, e-commerce listing, or social media post.",
  },
  {
    icon: Palette,
    title: "Custom Backgrounds",
    description:
      "Not just removal — add solid colors, custom images, or any backdrop you choose to create the perfect visual.",
  },
  {
    icon: ImageIcon,
    title: "Batch Processing",
    description:
      "Upload and process multiple images at once. Perfect for e-commerce sellers handling hundreds of product photos.",
  },
  {
    icon: Download,
    title: "Multiple Formats",
    description:
      "Supports JPG, PNG, and WEBP formats. Download your results in high resolution without any quality loss.",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 md:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Why Choose <span className="text-primary">Xiangliang Remove</span>?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground text-balance">
            Professional-grade background removal powered by cutting-edge AI technology. No complicated software required.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:bg-card/80"
            >
              <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-3">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              
              {/* Hover effect */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
