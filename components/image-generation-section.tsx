"use client"

import { useRef, useState } from "react"
import { Upload, ImageIcon, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ImageGenerationSection() {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageName, setImageName] = useState<string | null>(null)
  const [prompt, setPrompt] = useState("")
  const [outputs, setOutputs] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAddImage = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImageName(file.name)
    const reader = new FileReader()
    reader.onload = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleGenerate = async () => {
    if (!imagePreview) {
      setError("Please add an image before generating.")
      return
    }

    if (!prompt.trim()) {
      setError("Please enter a prompt in Main Prompt.")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          imageDataUrl: imagePreview,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || "Failed to generate image.")
      }

      setOutputs(data.images || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong."
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr,1.1fr]">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Image-to-Image Generator</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Add an image, write your main prompt, and generate a new result.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-sm font-medium">Add Image</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <Button variant="outline" size="sm" onClick={handleAddImage}>
                      <Upload className="h-4 w-4" />
                      Add Image
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      {imageName ? imageName : "No file selected"}
                    </span>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                  {imagePreview ? (
                    <div className="mt-4 overflow-hidden rounded-xl border border-border bg-secondary/30">
                      <img src={imagePreview} alt="Preview" className="h-56 w-full object-contain" />
                    </div>
                  ) : (
                    <div className="mt-4 flex h-56 items-center justify-center rounded-xl border border-dashed border-border bg-secondary/20">
                      <div className="text-center text-sm text-muted-foreground">
                        <ImageIcon className="mx-auto mb-2 h-6 w-6" />
                        Upload an image to preview it here.
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium" htmlFor="main-prompt">
                    Main Prompt
                  </label>
                  <textarea
                    id="main-prompt"
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    placeholder="Describe the transformation you want..."
                    className="mt-2 h-28 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                  />
                </div>

                {error ? <p className="text-sm text-destructive">{error}</p> : null}

                <Button
                  size="lg"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={handleGenerate}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate Now"
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold">Output Gallery</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Generated images will appear here after processing.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              {outputs.length === 0 ? (
                <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-border bg-secondary/20 text-sm text-muted-foreground">
                  No outputs yet. Generate an image to populate the gallery.
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {outputs.map((src, index) => (
                    <div key={`${src}-${index}`} className="overflow-hidden rounded-xl border border-border bg-background">
                      <img src={src} alt={`Output ${index + 1}`} className="h-48 w-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
