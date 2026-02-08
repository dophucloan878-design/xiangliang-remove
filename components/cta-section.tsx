import { ArrowRight, Sparkles } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function CtaSection() {
  return (
    <section className="py-20 md:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card">
          {/* Background decoration */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-primary/5 blur-3xl" />
          </div>

          <div className="relative px-6 py-16 text-center sm:px-12 md:py-24">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm text-primary">
              <Sparkles className="h-4 w-4" />
              <span>Start removing backgrounds today</span>
            </div>

            <h2 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Ready to Transform
              <span className="block text-primary">Your Images?</span>
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground text-balance">
              Join thousands of designers, photographers, and businesses who trust Xiangliang Remove for their background removal needs. It&apos;s free, fast, and incredibly easy.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90" asChild>
                <Link href="/#remove-background">
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <p className="mt-6 text-sm text-muted-foreground">
              No credit card required • Free plan available • Upgrade or cancel anytime
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
