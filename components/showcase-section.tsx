"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

const showcaseItems = [
  {
    id: 1,
    title: "Portrait Photography",
    category: "Portraits",
    original: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=600&fit=crop",
    description: "Perfect for professional headshots and personal photos",
  },
  {
    id: 2,
    title: "Product Photography",
    category: "E-commerce",
    original: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop",
    description: "Clean product images ready for your online store",
  },
  {
    id: 3,
    title: "Fashion & Lifestyle",
    category: "Fashion",
    original: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=600&fit=crop",
    description: "Showcase clothing and accessories with style",
  },
  {
    id: 4,
    title: "Social Media Content",
    category: "Social",
    original: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=600&fit=crop",
    description: "Create eye-catching content for your feeds",
  },
  {
    id: 5,
    title: "Pet Photography",
    category: "Pets",
    original: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&h=600&fit=crop",
    description: "Even complex fur is handled with precision",
  },
  {
    id: 6,
    title: "Food Photography",
    category: "Food",
    original: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=600&fit=crop",
    description: "Make your dishes pop with clean backgrounds",
  },
]

const categories = ["All", ...new Set(showcaseItems.map((item) => item.category))]

export function ShowcaseSection() {
  const [activeCategory, setActiveCategory] = useState("All")
  const [hoveredItem, setHoveredItem] = useState<number | null>(null)

  const filteredItems =
    activeCategory === "All"
      ? showcaseItems
      : showcaseItems.filter((item) => item.category === activeCategory)

  return (
    <section id="showcase" className="bg-secondary/30 py-20 md:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            See It In <span className="text-primary">Action</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground text-balance">
            Browse through examples processed with our AI. Hover to see the before/after comparison.
          </p>
        </div>

        {/* Category Filter */}
        <div className="mt-10 flex flex-wrap justify-center gap-2">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-all",
                activeCategory === category
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
              )}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card"
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <div className="relative aspect-square overflow-hidden">
                {/* Checkered background (for transparent effect) */}
                <div
                  className={cn(
                    "absolute inset-0 transition-opacity duration-500",
                    hoveredItem === item.id ? "opacity-100" : "opacity-0"
                  )}
                  style={{
                    backgroundImage: `url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMjAyMDIwIi8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMyMDIwMjAiLz48cmVjdCB4PSIxMCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMmEyYTJhIi8+PHJlY3QgeT0iMTAiIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgZmlsbD0iIzJhMmEyYSIvPjwvc3ZnPg==")`,
                  }}
                />

                {/* Image */}
                <img
                  src={item.original || "/placeholder.svg"}
                  alt={item.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  crossOrigin="anonymous"
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

                {/* Labels */}
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="rounded-full bg-background/80 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                    {item.category}
                  </span>
                </div>

                {/* Hover indicator */}
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                    {hoveredItem === item.id ? "After" : "Before"}
                  </span>
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-semibold">{item.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
