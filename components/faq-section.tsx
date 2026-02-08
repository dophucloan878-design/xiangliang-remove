"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const faqs = [
  {
    question: "Is Xiangliang Remove really free to use?",
    answer:
      "Yes, you can remove backgrounds for free using our tool. Our free plan is ideal for casual users and small projects, allowing you to remove a few images easily. For faster processing, higher-quality results, batch processing, and commercial use, flexible and affordable upgrade plans are available — with no hidden fees.",
  },
  {
    question: "Can I remove the background on my phone?",
    answer:
      "Absolutely! Our image background remover is fully compatible with mobile devices. You can easily remove backgrounds from your photos directly on your smartphone, creating transparent images on the go. The process is simple and efficient.",
  },
  {
    question: "What image formats does Xiangliang Remove support?",
    answer:
      "Our background remover supports JPG, PNG, and WEBP formats. We're constantly working to add more formats based on user feedback to provide greater flexibility and compatibility with all types of images.",
  },
  {
    question: "How does Xiangliang Remove ensure image quality?",
    answer:
      "Our tool uses advanced AI algorithms and optimization techniques during both the upload and processing stages to ensure your image's clarity, edges, and fine details are perfectly preserved. Every processed image maintains professional-grade quality.",
  },
  {
    question: "Can I batch process multiple images?",
    answer:
      "Yes! Our background remover supports batch processing. You can upload and remove backgrounds from multiple images at once, making it easy and efficient for users who need to process large volumes of photos.",
  },
  {
    question: "How long does it take to process an image?",
    answer:
      "Most images are processed in just 5 seconds or less! Our AI-powered system is optimized for speed without compromising on quality. Complex images with intricate details may take slightly longer.",
  },
  {
    question: "What makes Xiangliang Remove different from other tools?",
    answer:
      "Xiangliang Remove combines lightning-fast processing with AI precision. Unlike other tools, we offer free batch processing, edge refinement for complex details like hair, and high-quality transparent outputs — all without requiring any technical skills.",
  },
]

export function FaqSection() {
  return (
    <section id="faq" className="bg-secondary/30 py-20 md:py-32">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Frequently Asked <span className="text-primary">Questions</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground text-balance">
            Everything you need to know about Xiangliang Remove. Can&apos;t find what you&apos;re looking for? Contact our support team.
          </p>
        </div>

        <div className="mt-12">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="overflow-hidden rounded-xl border border-border bg-card px-6 data-[state=open]:border-primary/50"
              >
                <AccordionTrigger className="py-4 text-left font-medium hover:no-underline [&[data-state=open]>svg]:text-primary">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="pb-4 text-muted-foreground leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}
