const readEnv = (key: string) => process.env[key]?.trim() || ""

export const getSupabaseUrl = () => readEnv("NEXT_PUBLIC_SUPABASE_URL")

export const getSupabasePublishableKey = () => {
  return readEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") || readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
}

export const getRequiredSupabaseClientEnv = () => {
  const url = getSupabaseUrl()
  const publishableKey = getSupabasePublishableKey()

  if (!url || !publishableKey) {
    throw new Error(
      "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)."
    )
  }

  return { url, publishableKey }
}
