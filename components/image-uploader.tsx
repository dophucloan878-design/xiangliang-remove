"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Download, ImageIcon, Loader2, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FREE_MONTHLY_LIMIT, GUEST_MONTHLY_LIMIT } from "@/lib/limits"
import { createClient } from "@/lib/supabase/client"
import { getOAuthCallbackUrl } from "@/lib/auth-redirect"

type UserTier = "guest" | "free" | "pro" | "business"
type UsageScope = "guest" | "free"

type UploadItem = {
  id: string
  name: string
  original: string
  processed?: string
}

export function ImageUploader() {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploads, setUploads] = useState<UploadItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [usageCount, setUsageCount] = useState<number | null>(null)
  const [resetMonth, setResetMonth] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userTier, setUserTier] = useState<UserTier>("guest")
  const [limitModalType, setLimitModalType] = useState<"guest" | "free" | null>(null)
  const supabase = createClient()

  const isPaid = userTier === "pro" || userTier === "business"
  const allowMultiple = isPaid

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const getMonthKey = () => {
    const now = new Date()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    return `${now.getFullYear()}-${month}`
  }

  const getUsageStorageKeys = (scope: UsageScope) => {
    if (scope === "free") {
      return {
        countKey: "bg_rm_free_used_count",
        monthKey: "bg_rm_free_reset_month",
      }
    }

    return {
      countKey: "bg_rm_guest_used_count",
      monthKey: "bg_rm_guest_reset_month",
    }
  }

  const syncUsageCookie = (count: number, monthKey: string) => {
    const maxAge = 60 * 60 * 24 * 40
    document.cookie = `bg_rm_used_count=${count}; path=/; max-age=${maxAge}`
    document.cookie = `bg_rm_reset_month=${monthKey}; path=/; max-age=${maxAge}`
  }

  const readUsage = (scope: UsageScope) => {
    const keys = getUsageStorageKeys(scope)
    const monthKey = getMonthKey()
    const storedMonth = localStorage.getItem(keys.monthKey)
    const storedCount = Number(localStorage.getItem(keys.countKey) || "0")
    const isValidCount = Number.isFinite(storedCount) && storedCount >= 0

    if (storedMonth !== monthKey || !isValidCount) {
      localStorage.setItem(keys.monthKey, monthKey)
      localStorage.setItem(keys.countKey, "0")
      syncUsageCookie(0, monthKey)
      setUsageCount(0)
      setResetMonth(monthKey)
      return { monthKey, count: 0 }
    }

    syncUsageCookie(storedCount, monthKey)
    setUsageCount(storedCount)
    setResetMonth(monthKey)
    return { monthKey, count: storedCount }
  }

  const updateUsage = (scope: UsageScope, nextCount: number, monthKey: string) => {
    const keys = getUsageStorageKeys(scope)
    localStorage.setItem(keys.countKey, String(nextCount))
    localStorage.setItem(keys.monthKey, monthKey)
    syncUsageCookie(nextCount, monthKey)
    setUsageCount(nextCount)
    setResetMonth(monthKey)
  }

  const getFingerprint = async () => {
    const cached = localStorage.getItem("bg_rm_fingerprint")
    if (cached) return cached

    const parts = [
      navigator.userAgent,
      `${window.screen?.width || 0}x${window.screen?.height || 0}`,
      Intl.DateTimeFormat().resolvedOptions().timeZone || "unknown",
      navigator.language || "unknown",
    ]
    const raw = parts.join("|")

    try {
      const data = new TextEncoder().encode(raw)
      const hash = await crypto.subtle.digest("SHA-256", data)
      const bytes = Array.from(new Uint8Array(hash))
      const hex = bytes.map((byte) => byte.toString(16).padStart(2, "0")).join("")
      localStorage.setItem("bg_rm_fingerprint", hex)
      return hex
    } catch {
      localStorage.setItem("bg_rm_fingerprint", raw)
      return raw
    }
  }

  const normalizeTier = (value: string | null | undefined): UserTier => {
    if (!value) return "free"
    const lower = value.toLowerCase()
    if (lower === "pro" || lower === "business") return lower
    return "free"
  }

  useEffect(() => {
    readUsage("guest")
  }, [])

  useEffect(() => {
    let isMounted = true

    const loadSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (!isMounted) return
      const user = data.session?.user
      if (user) {
        const tier =
          user.user_metadata?.plan ||
          user.app_metadata?.plan ||
          user.user_metadata?.tier ||
          user.app_metadata?.tier ||
          "free"
        setUserTier(normalizeTier(tier))
        setIsAuthenticated(true)
      } else {
        setUserTier("guest")
        setIsAuthenticated(false)
      }
    }

    loadSession()

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user
      if (user) {
        const tier =
          user.user_metadata?.plan ||
          user.app_metadata?.plan ||
          user.user_metadata?.tier ||
          user.app_metadata?.tier ||
          "free"
        setUserTier(normalizeTier(tier))
        setIsAuthenticated(true)
      } else {
        setUserTier("guest")
        setIsAuthenticated(false)
      }
    })

    return () => {
      isMounted = false
      authListener.subscription.unsubscribe()
    }
  }, [supabase])

  useEffect(() => {
    readUsage(isAuthenticated ? "free" : "guest")
  }, [isAuthenticated])

  const openLimitModal = () => {
    setLimitModalType(isAuthenticated ? "free" : "guest")
  }

  const handleGoogleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: getOAuthCallbackUrl(),
      },
    })
  }

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error("Failed to read file."))
      reader.readAsDataURL(file)
    })

  const requestProcessing = async (imageUrls: string[]) => {
    const usageScope: UsageScope = isAuthenticated ? "free" : "guest"
    const monthlyLimit = usageScope === "free" ? FREE_MONTHLY_LIMIT : GUEST_MONTHLY_LIMIT
    const usageSnapshot = readUsage(usageScope)
    if (!isPaid && usageSnapshot.count >= monthlyLimit) {
      setError(null)
      openLimitModal()
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const fingerprint = await getFingerprint()
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token
      const response = await fetch("/api/remove-background", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Client-FP": fingerprint,
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(
          imageUrls.length > 1 ? { imageDataUrls: imageUrls } : { imageDataUrl: imageUrls[0] }
        ),
      })

      const data = await response.json()

      if (!response.ok) {
        const errorCode = data?.error_code
        const message = data?.message || data?.error || "Failed to process image."
        if (errorCode === "MONTHLY_LIMIT_REACHED") {
          openLimitModal()
          return
        }
        throw new Error(message)
      }

      const outputs = Array.isArray(data?.images)
        ? data.images
        : Array.isArray(data?.result?.images)
          ? data.result.images
          : []
      if (outputs.length === 0) {
        throw new Error("No processed image returned.")
      }

      setUploads((prev) =>
        prev.map((item, index) => ({
          ...item,
          processed: outputs[index] ?? item.processed,
        }))
      )

      const serverPlan = typeof data?.plan === "string" ? data.plan : userTier
      const isServerPaid = serverPlan === "pro" || serverPlan === "business"
      if (!isServerPaid) {
        updateUsage(usageScope, usageSnapshot.count + 1, usageSnapshot.monthKey)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong."
      setError(message)
    } finally {
      setIsProcessing(false)
    }
  }

  const processFiles = async (files: File[]) => {
    const imageFiles = files.filter((file) => file.type.startsWith("image/"))
    if (imageFiles.length === 0) return

    const hasMultiple = imageFiles.length > 1
    const filesToUse = allowMultiple ? imageFiles : [imageFiles[0]]
    if (!allowMultiple && hasMultiple) {
      setError("Only one image can be uploaded on the free plan.")
    } else {
      setError(null)
    }

    const dataUrls = await Promise.all(filesToUse.map(readFileAsDataUrl))
    const nextUploads = dataUrls.map((dataUrl, index) => ({
      id: `${Date.now()}-${index}`,
      name: filesToUse[index].name,
      original: dataUrl,
    }))

    setUploads(nextUploads)
    await requestProcessing(dataUrls)
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) {
        void processFiles(files)
      }
    },
    [allowMultiple]
  )

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : []
    if (files.length > 0) {
      void processFiles(files)
    }
    e.target.value = ""
  }

  const handleReset = () => {
    setUploads([])
    setIsProcessing(false)
    setError(null)
  }

  const handleDownload = (imageUrl: string, name?: string) => {
    const baseName = name ? name.replace(/\.[^.]+$/, "") : "removed-background"
    const link = document.createElement("a")
    link.href = imageUrl
    link.download = `${baseName}-removed.png`
    link.click()
  }

  const sampleImages = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop",
  ]

  const fileLabel = uploads.length
    ? uploads.length === 1
      ? `Selected: ${uploads[0].name}`
      : `Selected: ${uploads.length} files`
    : "No file selected"

  const limitDialog = (
    <Dialog
      open={limitModalType !== null}
      onOpenChange={(open) => {
        if (!open) setLimitModalType(null)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {limitModalType === "guest" ? "Guest Monthly Limit Reached" : "Monthly Free Usage Reached"}
          </DialogTitle>
          <DialogDescription>
            {limitModalType === "guest"
              ? "You've used all 10 guest background removals for this month."
              : "You've reached your 20 free background removals for this month."}
          </DialogDescription>
        </DialogHeader>
        {limitModalType === "guest" ? (
          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">🎉 Unlock 20 free background removals</p>
            <p>Sign in now and your free-account monthly quota resets to 20 removals.</p>
            <p>Or continue as a guest next month when your guest quota resets.</p>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            You can upgrade to Pro for high-quality, watermark-free downloads and faster processing, or continue for
            free when your limit resets next month.
          </div>
        )}
        <DialogFooter>
          {limitModalType === "guest" ? (
            <>
              <DialogClose asChild>
                <Button variant="outline">Wait Until Next Month</Button>
              </DialogClose>
              <Button onClick={handleGoogleSignIn}>Sign In to Unlock 20</Button>
            </>
          ) : (
            <>
              <DialogClose asChild>
                <Button variant="outline">Continue Next Month</Button>
              </DialogClose>
              <Button asChild>
                <Link href="/upgrade">Upgrade to Pro</Link>
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  if (uploads.length > 0) {
    const showPerItemDownload = uploads.length > 1

    return (
      <>
        {limitDialog}
        <div className="mx-auto max-w-5xl">
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="space-y-6 p-6">
              {uploads.map((item) => (
                <div key={item.id} className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Original</span>
                      <span className="text-xs text-muted-foreground">{item.name}</span>
                    </div>
                    <div className="relative aspect-square overflow-hidden rounded-xl bg-secondary">
                      <img
                        src={item.original}
                        alt="Original"
                        className="h-full w-full object-contain"
                        crossOrigin="anonymous"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Background Removed</span>
                    </div>
                    <div className="relative aspect-square overflow-hidden rounded-xl bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMjAyMDIwIi8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMyMDIwMjAiLz48cmVjdCB4PSIxMCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMmEyYTJhIi8+PHJlY3QgeT0iMTAiIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgZmlsbD0iIzJhMmEyYSIvPjwvc3ZnPg==')]">
                      {isProcessing && !item.processed ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                          <div className="flex flex-col items-center gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <span className="text-sm text-muted-foreground">Processing with AI...</span>
                          </div>
                        </div>
                      ) : item.processed ? (
                        <img
                          src={item.processed}
                          alt="Processed"
                          className="h-full w-full object-contain"
                          crossOrigin="anonymous"
                        />
                      ) : null}
                    </div>
                    {showPerItemDownload && item.processed ? (
                      <Button variant="outline" size="sm" onClick={() => handleDownload(item.processed!, item.name)}>
                        <Download className="h-4 w-4" />
                        Download PNG
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
            </div>

            <div className="flex items-center justify-between border-t border-border bg-secondary/30 px-6 py-4">
              <Button variant="outline" onClick={handleReset} className="gap-2 bg-transparent">
                <X className="h-4 w-4" />
                Reset
              </Button>
              {uploads.length === 1 && uploads[0].processed ? (
                <Button
                  onClick={() => handleDownload(uploads[0].processed!, uploads[0].name)}
                  disabled={isProcessing}
                  className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Download className="h-4 w-4" />
                  Download PNG
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      {limitDialog}
      <div className="mx-auto max-w-2xl">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 ${
            isDragging
              ? "border-primary bg-primary/10"
              : "border-border bg-card hover:border-primary/50 hover:bg-card/80"
          }`}
        >
          <label className="flex cursor-pointer flex-col items-center gap-4 p-8 md:p-12">
            <div className={`rounded-full p-4 transition-colors ${isDragging ? "bg-primary/20" : "bg-secondary"}`}>
              <Upload className={`h-8 w-8 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
            </div>
            <div className="text-center">
              <span className="text-lg font-medium">
                {isDragging ? "Drop your image here" : "Upload an image"}
              </span>
              <p className="mt-1 text-sm text-muted-foreground">Drag & drop or click to browse</p>
              <p className="mt-2 text-xs text-muted-foreground">{fileLabel}</p>
              {!allowMultiple ? (
                <p className="mt-1 text-xs text-muted-foreground">Free plan supports single image uploads.</p>
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">Batch uploads available on Pro and Business.</p>
              )}
            </div>
            <Button
              className="mt-2 gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
              type="button"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon className="h-4 w-4" />
              Upload Image
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple={allowMultiple}
              onChange={handleFileSelect}
              className="sr-only"
            />
          </label>
        </div>

        <div className="mt-6">
          <p className="mb-3 text-center text-sm text-muted-foreground">No image? Try one of these:</p>
          <div className="flex justify-center gap-3">
            {sampleImages.map((src, index) => (
              <button
                type="button"
                key={src}
                onClick={() => {
                  setUploads([
                    {
                      id: `sample-${index}`,
                      name: `Sample ${index + 1}`,
                      original: src,
                    },
                  ])
                  void requestProcessing([src])
                }}
                className="h-14 w-14 overflow-hidden rounded-xl border-2 border-transparent transition-all hover:border-primary hover:scale-105"
              >
                <img
                  src={src}
                  alt={`Sample ${index + 1}`}
                  className="h-full w-full object-cover"
                  crossOrigin="anonymous"
                />
              </button>
            ))}
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            {isAuthenticated ? "Free account quota" : "Guest quota"}: {usageCount === null
              ? "-"
              : Math.max((isAuthenticated ? FREE_MONTHLY_LIMIT : GUEST_MONTHLY_LIMIT) - usageCount, 0)} / {isAuthenticated
              ? FREE_MONTHLY_LIMIT
              : GUEST_MONTHLY_LIMIT} this month
            {resetMonth ? ` (reset ${resetMonth})` : ""}
          </p>
          {error ? <p className="mt-3 text-center text-xs text-destructive">{error}</p> : null}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          By uploading an image, you agree to our
          <Link href="/privacy-policy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
          and
          <Link href="/terms-of-use" className="text-primary hover:underline">
            Terms of Use
          </Link>
          .
        </p>
      </div>
    </>
  )
}
