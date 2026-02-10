import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { toHdPngDataUrl, toLimitedPngDataUrl, toOriginalPngDataUrl } from "@/lib/image-processing"
import { FREE_MAX_OUTPUT_EDGE_PX, PRO_MAX_OUTPUT_EDGE_PX } from "@/lib/limits"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"

type OpenRouterContentItem =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } }

type OpenRouterImage = { image_url?: { url?: string } }

type DeductCreditsResult = {
  ok: boolean
  error_code: string | null
  credits_remaining: number | null
}

type EffectiveTier = "guest" | "free" | "pro" | "business"

type DbErrorLike = {
  code?: string
  message?: string
}

const BACKGROUND_REMOVAL_PROMPT =
  "Remove the background from the subject and return a PNG with a transparent background. " +
  "Keep the subject unchanged, preserve original colors, and do not crop or add new elements."

const jsonError = (status: number, errorCode: string, message: string) => {
  return NextResponse.json(
    {
      ok: false,
      error_code: errorCode,
      message,
    },
    { status }
  )
}

const extractImagesFromMessage = (message: any) => {
  const images: string[] = []

  if (Array.isArray(message?.images)) {
    message.images.forEach((item: OpenRouterImage) => {
      if (item.image_url?.url) images.push(item.image_url.url)
    })
  }

  if (images.length === 0 && Array.isArray(message?.content)) {
    message.content.forEach((item: OpenRouterContentItem) => {
      if (item.type === "image_url" && item.image_url?.url) {
        images.push(item.image_url.url)
      }
    })
  }

  return images
}

const mapDeductCreditsDbError = (error: DbErrorLike) => {
  const code = (error.code || "").toUpperCase()

  if (code === "42P01") {
    return {
      status: 500,
      errorCode: "SUBSCRIPTIONS_TABLE_MISSING",
      message: "Subscription table is missing. Please run latest database migrations.",
    }
  }

  if (code === "42883" || code === "PGRST202") {
    return {
      status: 500,
      errorCode: "DEDUCT_CREDITS_FUNCTION_MISSING",
      message: "Credit deduction function is missing. Please run latest database migrations.",
    }
  }

  if (code === "42501") {
    return {
      status: 500,
      errorCode: "DEDUCT_CREDITS_PERMISSION_DENIED",
      message: "Credit deduction permission is invalid. Please verify database function grants.",
    }
  }

  return {
    status: 500,
    errorCode: "DB_ERROR",
    message: "Failed to deduct credits.",
  }
}

const runOpenRouter = async (imageDataUrl: string, openRouterKey: string, origin: string) => {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openRouterKey}`,
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
            { type: "text", text: BACKGROUND_REMOVAL_PROMPT },
            { type: "image_url", image_url: { url: imageDataUrl } },
          ],
        },
      ],
    }),
  })

  const data = await response.json()
  if (!response.ok) {
    const message = data?.error?.message || "Third-party image processing failed."
    throw new Error(message)
  }

  const images = extractImagesFromMessage(data?.choices?.[0]?.message)
  if (images.length === 0) {
    throw new Error("No image was returned from the model.")
  }

  return images[0]
}

export async function POST(request: Request) {
  const startedAt = Date.now()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const openRouterKey = process.env.OPENROUTER_API_KEY

  if (!openRouterKey) {
    return jsonError(500, "SERVER_MISCONFIGURED", "OPENROUTER_API_KEY is not set.")
  }

  const hasAuthConfig = Boolean(supabaseUrl && supabaseAnonKey)
  const hasAdminConfig = Boolean(supabaseUrl && serviceRoleKey)

  const body = await request.json()
  const imageDataUrl = typeof body?.imageDataUrl === "string" ? body.imageDataUrl : null
  const imageDataUrls = Array.isArray(body?.imageDataUrls)
    ? body.imageDataUrls.filter((item: unknown) => typeof item === "string")
    : []

  const inputs = imageDataUrl ? [imageDataUrl] : imageDataUrls

  if (inputs.length === 0) {
    return jsonError(400, "BAD_REQUEST", "Missing image input.")
  }

  const authHeader = request.headers.get("authorization") || request.headers.get("Authorization")
  const authToken = authHeader?.startsWith("Bearer ") ? authHeader : null

  const admin = hasAdminConfig ? createClient(supabaseUrl!, serviceRoleKey!) : null

  let effectiveTier: EffectiveTier = "guest"
  let userId: string | null = null
  let creditsRemaining: number | null = null

  const appendUsageLog = async (params: {
    status: "success" | "failed" | "rate_limited" | "insufficient_credits"
    failureReason?: string
    processingMs?: number
  }) => {
    if (!admin || !userId) return

    try {
      await admin.from("usage_logs").insert({
        user_id: userId,
        plan: effectiveTier === "guest" ? "free" : effectiveTier,
        image_count: inputs.length,
        processing_ms: params.processingMs ?? null,
        status: params.status,
        failure_reason: params.failureReason || null,
      })
    } catch {
      // Logging failure should never block the main response.
    }
  }

  if (authToken && hasAuthConfig) {
    const authClient = createClient(supabaseUrl!, supabaseAnonKey!, {
      global: { headers: { Authorization: authToken } },
    })

    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser()

    if (authError || !user) {
      return jsonError(401, "UNAUTHORIZED", "User authentication failed.")
    }

    userId = user.id
    effectiveTier = "free"

    // Critical: backend DB is the source of truth for plan/tier.
    if (admin) {
      const { data: subscription, error: subscriptionError } = await admin
        .from("subscriptions")
        .select("plan,status,current_period_end")
        .eq("user_id", user.id)
        .maybeSingle()

      if (subscriptionError) {
        // Fallback: subscription lookup issues should not block free usage.
        console.error("subscriptions lookup failed, fallback to free", {
          code: subscriptionError.code,
          message: subscriptionError.message,
        })
        effectiveTier = "free"
      } else {
        const isActivePaid =
          !!subscription &&
          (subscription.plan === "pro" || subscription.plan === "business") &&
          subscription.status === "active" &&
          new Date(subscription.current_period_end).getTime() > Date.now()

        effectiveTier = isActivePaid ? (subscription!.plan as "pro" | "business") : "free"
      }
    }
  }

  const isPaid = effectiveTier === "pro" || effectiveTier === "business"

  if (!isPaid && inputs.length > 1) {
    await appendUsageLog({
      status: "failed",
      failureReason: "Guest/free single upload restriction.",
    })
    return jsonError(400, "SINGLE_UPLOAD_ONLY", "Guest and free users can upload one image at a time.")
  }

  if (!isPaid) {
    const ip = getClientIp(request)
    const fingerprint = request.headers.get("x-client-fp") || "unknown"
    const rateLimit = checkRateLimit({
      ip,
      fingerprint,
      tier: effectiveTier === "guest" ? "guest" : "free",
      userId,
    })
    if (!rateLimit.ok) {
      const code = rateLimit.error.toLowerCase().includes("monthly")
        ? "MONTHLY_LIMIT_REACHED"
        : "RATE_LIMITED"
      await appendUsageLog({
        status: code === "RATE_LIMITED" ? "rate_limited" : "failed",
        failureReason: rateLimit.error,
      })
      return jsonError(rateLimit.status, code, rateLimit.error)
    }
  }

  if (isPaid && userId && admin) {
    // Critical: atomic deduction before expensive third-party call.
    const { data: deductData, error: deductError } = await admin
      .rpc("deduct_credits", { p_user_id: userId, p_amount: inputs.length })
      .single<DeductCreditsResult>()

    if (deductError) {
      const mapped = mapDeductCreditsDbError(deductError)
      await appendUsageLog({
        status: "failed",
        failureReason: `${mapped.errorCode}: ${deductError.message || "unknown db error"}`,
      })
      return jsonError(mapped.status, mapped.errorCode, mapped.message)
    }

    if (!deductData) {
      await appendUsageLog({
        status: "failed",
        failureReason: "DB_ERROR: deduct_credits returned empty result.",
      })
      return jsonError(500, "DB_ERROR", "Failed to deduct credits.")
    }

    if (!deductData.ok) {
      if (deductData.error_code === "INSUFFICIENT_CREDITS") {
        await appendUsageLog({
          status: "insufficient_credits",
          failureReason: "Not enough credits.",
        })
        return jsonError(402, "INSUFFICIENT_CREDITS", "Not enough credits.")
      }

      await appendUsageLog({
        status: "failed",
        failureReason: "Subscription no longer active for paid tier.",
      })
      return jsonError(403, "UPGRADE_REQUIRED", "Active Pro or Business subscription required.")
    }

    creditsRemaining = deductData.credits_remaining
  }

  const origin = request.headers.get("origin") || "http://localhost:3000"

  const rawOutputs: string[] = []
  try {
    for (const input of inputs) {
      rawOutputs.push(await runOpenRouter(input, openRouterKey, origin))
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Third-party image processing failed."
    await appendUsageLog({
      status: "failed",
      failureReason: message,
      processingMs: Date.now() - startedAt,
    })
    return jsonError(502, "UPSTREAM_ERROR", message)
  }

  const outputImages = await Promise.all(
    rawOutputs.map((image) => {
      if (effectiveTier === "business") {
        return toOriginalPngDataUrl(image)
      }

      if (effectiveTier === "pro") {
        return toHdPngDataUrl(image, PRO_MAX_OUTPUT_EDGE_PX)
      }

      return toLimitedPngDataUrl(image, FREE_MAX_OUTPUT_EDGE_PX)
    })
  )

  if (!isPaid) {
    const elapsedMs = Date.now() - startedAt
    const remainingMs = 4000 - elapsedMs
    if (remainingMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, remainingMs))
    }
  }

  await appendUsageLog({
    status: "success",
    processingMs: Date.now() - startedAt,
  })

  return NextResponse.json({
    ok: true,
    plan: effectiveTier,
    credits_remaining: isPaid ? creditsRemaining : null,
    images: outputImages,
    result: {
      images: outputImages,
    },
  })
}
