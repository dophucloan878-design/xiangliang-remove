import { Star } from "lucide-react"

const testimonials = [
  {
    name: "Alice Reynolds",
    role: "Graphic Designer",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    rating: 5,
    content:
      "This tool is incredible! As a designer, I needed to quickly remove backgrounds from hundreds of product photos. I couldn't believe how fast it was — 5 seconds, and my transparent images were ready. No more spending hours on manual editing!",
  },
  {
    name: "James Chen",
    role: "Professional Photographer",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    rating: 5,
    content:
      "I use this for my clients' portraits, and the results are perfect every time. The AI is so accurate — it handles hair and fine details flawlessly. My clients love the quality, and it's become an essential part of my workflow.",
  },
  {
    name: "Sarah Mitchell",
    role: "E-commerce Seller",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    rating: 4,
    content:
      "I was blown away by how quickly I could process all my product photos. In under 10 seconds, I had PNG files ready to upload to my store. The quality is incredible, and the transparent background makes everything look so professional.",
  },
  {
    name: "Michael Torres",
    role: "Social Media Manager",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
    rating: 5,
    content:
      "Creating content for multiple brands means I need quick, reliable tools. Xiangliang Remove has saved me countless hours. The batch processing feature is a game-changer for managing multiple campaigns simultaneously.",
  },
  {
    name: "Emily Park",
    role: "Marketing Director",
    avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop",
    rating: 5,
    content:
      "Our marketing team uses Xiangliang Remove daily for creating promotional materials. The consistency and speed are unmatched. It's become an indispensable tool for our creative workflow.",
  },
  {
    name: "David Kim",
    role: "Freelance Designer",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    rating: 5,
    content:
      "As a freelancer, efficiency is everything. Xiangliang Remove lets me deliver high-quality work to clients faster than ever. The AI precision is remarkable — even complex images come out perfectly clean.",
  },
]

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-20 md:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Loved by <span className="text-primary">Thousands</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground text-balance">
            See what designers, photographers, and businesses are saying about Xiangliang Remove.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/50"
            >
              {/* Stars */}
              <div className="mb-4 flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < testimonial.rating
                        ? "fill-primary text-primary"
                        : "fill-muted text-muted"
                    }`}
                  />
                ))}
              </div>

              {/* Content */}
              <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                &ldquo;{testimonial.content}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <img
                  src={testimonial.avatar || "/placeholder.svg"}
                  alt={testimonial.name}
                  className="h-10 w-10 rounded-full object-cover"
                  crossOrigin="anonymous"
                />
                <div>
                  <p className="text-sm font-medium">{testimonial.name}</p>
                  <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>

              {/* Decorative gradient */}
              <div className="pointer-events-none absolute -right-20 -bottom-20 h-40 w-40 rounded-full bg-primary/5 blur-3xl transition-all group-hover:bg-primary/10" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
