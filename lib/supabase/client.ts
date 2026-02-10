import { createBrowserClient } from "@supabase/ssr"
import { getRequiredSupabaseClientEnv } from "@/lib/supabase/env"

export function createClient() {
  const { url, publishableKey } = getRequiredSupabaseClientEnv()
  return createBrowserClient(url, publishableKey)
}
