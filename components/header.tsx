"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Menu, X, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { getOAuthCallbackUrl } from "@/lib/auth-redirect"
import googleLogo from "@/images/google-color.png"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSignInOpen, setIsSignInOpen] = useState(false)
  const [userLabel, setUserLabel] = useState<string | null>(null)
  const signInRef = useRef<HTMLDivElement | null>(null)
  const supabase = createClient()

  const handleGoogleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: getOAuthCallbackUrl(),
      },
    })
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  useEffect(() => {
    let isMounted = true

    const loadSession = async () => {
      const { data } = await supabase.auth.getSession()
      const session = data.session
      if (!isMounted) return

      if (session?.user) {
        const meta = session.user.user_metadata || {}
        const name = meta.name || meta.full_name || session.user.email
        setUserLabel(name ?? "User")
      } else {
        setUserLabel(null)
      }
    }

    loadSession()

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user
      const meta = nextUser?.user_metadata || {}
      const name = meta.name || meta.full_name || nextUser?.email
      setUserLabel(nextUser ? name ?? "User" : null)
    })

    return () => {
      isMounted = false
      authListener.subscription.unsubscribe()
    }
  }, [supabase])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (signInRef.current && !signInRef.current.contains(event.target as Node)) {
        setIsSignInOpen(false)
      }
    }

    if (isSignInOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isSignInOpen])

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl"
      suppressHydrationWarning
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight">Xiangliang Remove</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link href="/#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Features
          </Link>
          <Link href="/pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Pricing
          </Link>
          <Link href="/#testimonials" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Reviews
          </Link>
          <Link href="/#faq" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            FAQ
          </Link>
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          {userLabel ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Welcome, {userLabel}!</span>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                Sign out
              </Button>
            </div>
          ) : (
            <div ref={signInRef} className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSignInOpen((open) => !open)}
                aria-expanded={isSignInOpen}
                aria-haspopup="dialog"
              >
                Sign In
              </Button>
              {isSignInOpen && (
                <div className="absolute right-0 top-full mt-3 w-72 rounded-2xl border border-border bg-background/95 p-4 shadow-xl backdrop-blur">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-semibold">Sign in with Google</p>
                      <p className="mt-1 text-xs text-muted-foreground">Currently, only Google accounts are supported.</p>
                    </div>
                    <ol className="space-y-1 text-xs text-muted-foreground">
                      <li>1. Click the button below to continue</li>
                      <li>2. Choose your Google account</li>
                      <li>3. You’ll be redirected back automatically</li>
                    </ol>
                    <Button
                      size="sm"
                      className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={handleGoogleSignIn}
                    >
                      <Image src={googleLogo} alt="Google" width={20} height={20} className="h-5 w-5" />
                      Continue with Google
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link href="/pricing">Upgrade Plan</Link>
          </Button>
          <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90" asChild>
            <Link href="/#remove-background">Get Started Free</Link>
          </Button>
        </div>

        <button
          type="button"
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {isMenuOpen && (
        <div className="border-t border-border bg-background md:hidden">
          <nav className="flex flex-col gap-4 p-4">
            <Link href="/#features" className="text-sm text-muted-foreground hover:text-foreground">
              Features
            </Link>
            <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground">
              Pricing
            </Link>
            <Link href="/#testimonials" className="text-sm text-muted-foreground hover:text-foreground">
              Reviews
            </Link>
            <Link href="/#faq" className="text-sm text-muted-foreground hover:text-foreground">
              FAQ
            </Link>
            {userLabel ? (
              <div className="flex flex-col gap-2">
                <span className="text-sm text-muted-foreground">Welcome, {userLabel}!</span>
                <Button variant="outline" size="sm" className="w-fit" onClick={handleSignOut}>
                  Sign out
                </Button>
              </div>
            ) : (
              <Button variant="ghost" size="sm" className="w-fit" onClick={handleGoogleSignIn}>
                Sign In
              </Button>
            )}
            <Button variant="outline" size="sm" className="w-fit" asChild>
              <Link href="/pricing">Upgrade Plan</Link>
            </Button>
            <Button size="sm" className="w-fit bg-primary text-primary-foreground" asChild>
              <Link href="/#remove-background">Get Started Free</Link>
            </Button>
          </nav>
        </div>
      )}
    </header>
  )
}
