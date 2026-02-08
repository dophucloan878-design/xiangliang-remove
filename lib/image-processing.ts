import sharp from "sharp"

const DATA_URL_PREFIX = "data:"

const decodeDataUrl = (input: string) => {
  const match = input.match(/^data:(image\/\w+);base64,(.+)$/)
  if (!match) return null
  return Buffer.from(match[2], "base64")
}

const loadImageBuffer = async (input: string) => {
  if (input.startsWith(DATA_URL_PREFIX)) {
    const buffer = decodeDataUrl(input)
    if (!buffer) {
      throw new Error("Invalid image data URL.")
    }
    return buffer
  }

  const response = await fetch(input)
  if (!response.ok) {
    throw new Error("Failed to fetch image output.")
  }

  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

export const toLimitedPngDataUrl = async (input: string, maxEdge: number) => {
  const buffer = await loadImageBuffer(input)

  const output = await sharp(buffer, { failOn: "none" })
    .resize({
      width: maxEdge,
      height: maxEdge,
      fit: "inside",
      withoutEnlargement: true,
    })
    .png({
      compressionLevel: 8,
      palette: true,
      quality: 78,
      effort: 7,
    })
    .toBuffer()

  return `data:image/png;base64,${output.toString("base64")}`
}

export const toHdPngDataUrl = async (input: string, maxEdge: number) => {
  const buffer = await loadImageBuffer(input)

  const output = await sharp(buffer, { failOn: "none" })
    .resize({
      width: maxEdge,
      height: maxEdge,
      fit: "inside",
      withoutEnlargement: true,
    })
    .png({
      compressionLevel: 6,
      effort: 8,
      adaptiveFiltering: true,
    })
    .toBuffer()

  return `data:image/png;base64,${output.toString("base64")}`
}

export const toOriginalPngDataUrl = async (input: string) => {
  const buffer = await loadImageBuffer(input)

  const output = await sharp(buffer, { failOn: "none" })
    .png({
      compressionLevel: 6,
    })
    .toBuffer()

  return `data:image/png;base64,${output.toString("base64")}`
}
