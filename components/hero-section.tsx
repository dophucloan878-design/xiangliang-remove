"use client"

import { Upload, Sparkles, Zap } from "lucide-react"
import { ImageUploader } from "./image-uploader"

export function HeroSection() {
  return (
    <section id="remove-background" className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-32">
      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 left-1/2 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-1/4 right-0 h-[400px] w-[400px] rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-2 text-sm">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">AI-Powered Background Removal</span>
          </div>

          <h1 className="mb-6 text-4xl font-bold tracking-tight text-balance sm:text-5xl md:text-6xl lg:text-7xl">
            Remove Background
            <span className="block text-primary">In Seconds</span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground text-balance md:text-xl">
            Instantly remove image backgrounds — 100% automatic, free, and done in just 5 seconds with our advanced AI technology.
          </p>

          <div className="mb-8 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span>5-Second Processing</span>
            </div>
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4 text-primary" />
              <span>PNG, JPG, WEBP</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>100% Free</span>
            </div>
          </div>

          <ImageUploader />
        </div>
      </div>
    </section>
  )
}
