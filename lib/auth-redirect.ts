export const getConfiguredSiteUrl = () => {
  const value = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL
  if (!value) return null
  return value.replace(/\/$/, "")
}

export const getOAuthCallbackUrl = () => {
  const configured = getConfiguredSiteUrl()
  if (configured) {
    return `${configured}/auth/callback`
  }

  if (typeof window !== "undefined") {
    return `${window.location.origin}/auth/callback`
  }

  return "/auth/callback"
}
