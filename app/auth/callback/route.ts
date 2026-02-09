import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const getSiteBaseUrl = (request: Request, origin: string) => {
  const forwardedHost = request.headers.get("x-forwarded-host")
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https"

  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`
  }

  const configured = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL
  if (configured) {
    return configured.replace(/\/$/, "")
  }

  return origin
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  let next = searchParams.get("next") ?? "/"

  if (!next.startsWith("/")) {
    next = "/"
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const isLocalEnv = process.env.NODE_ENV === "development"
      const siteBaseUrl = getSiteBaseUrl(request, origin)

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      }

      return NextResponse.redirect(`${siteBaseUrl}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
