import { NextResponse } from "next/server"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import { toHdPngDataUrl, toLimitedPngDataUrl, toOriginalPngDataUrl } from "@/lib/image-processing"
import { FREE_MAX_OUTPUT_EDGE_PX, PRO_MAX_OUTPUT_EDGE_PX } from "@/lib/limits"

type OpenRouterContentItem =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } }

type OpenRouterImage = { image_url?: { url?: string } }

export async function POST(request: Request) {
  const { prompt, imageDataUrl } = await request.json()

  if (!prompt || !imageDataUrl) {
    return NextResponse.json({ error: "Missing prompt or image." }, { status: 400 })
  }

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "OPENROUTER_API_KEY is not set." }, { status: 500 })
  }

  const ip = getClientIp(request)
  const fingerprint = request.headers.get("x-client-fp") || "unknown"
  const rateLimit = checkRateLimit(ip, fingerprint)
  if (!rateLimit.ok) {
    return NextResponse.json({ error: rateLimit.error }, { status: rateLimit.status })
  }

  const origin = request.headers.get("origin") || "http://localhost:3000"

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": origin,
      "X-Title": "Xiangliang Remove",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image",
      modalities: ["image", "text"],
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageDataUrl } },
          ],
        },
      ],
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    const message = data?.error?.message || "Failed to generate image."
    return NextResponse.json({ error: message }, { status: response.status })
  }

  const message = data?.choices?.[0]?.message
  const images: string[] = []

  if (Array.isArray(message?.images)) {
    message.images.forEach((item: OpenRouterImage) => {
      if (item.image_url?.url) {
        images.push(item.image_url.url)
      }
    })
  }

  if (images.length === 0 && Array.isArray(message?.content)) {
    message.content.forEach((item: OpenRouterContentItem) => {
      if (item.type === "image_url" && item.image_url?.url) {
        images.push(item.image_url.url)
      }
    })
  }

  if (images.length === 0) {
    return NextResponse.json({ error: "No image was returned from the model." }, { status: 502 })
  }

  const tier = (request.headers.get("x-user-tier") || "guest").toLowerCase()

  const outputImages = await Promise.all(
    images.map((image) => {
      if (tier === "business") {
        return toOriginalPngDataUrl(image)
      }

      if (tier === "pro") {
        return toHdPngDataUrl(image, PRO_MAX_OUTPUT_EDGE_PX)
      }

      return toLimitedPngDataUrl(image, FREE_MAX_OUTPUT_EDGE_PX)
    })
  )

  return NextResponse.json({ images: outputImages })
}
