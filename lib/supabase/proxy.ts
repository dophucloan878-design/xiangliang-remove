import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { getRequiredSupabaseClientEnv } from "@/lib/supabase/env"

type ResponseCookieOptions = Parameters<NextResponse["cookies"]["set"]>[2]
type CookieToSet = { name: string; value: string; options?: ResponseCookieOptions }

export async function updateSession(request: NextRequest) {
  const { url, publishableKey } = getRequiredSupabaseClientEnv()

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    url,
    publishableKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  await supabase.auth.getClaims()

  return response
}
