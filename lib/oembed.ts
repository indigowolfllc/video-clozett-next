export type OEmbedResult = {
  title: string
  thumbnail: string
  html: string | null
  site: string
  isPlayable: boolean
}

const OEMBED_ENDPOINTS: Record<string, string> = {
  youtube: "https://www.youtube.com/oembed",
  vimeo: "https://vimeo.com/api/oembed.json",
  tiktok: "https://www.tiktok.com/oembed",
}

function detectSite(url: string): string {
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube"
  if (url.includes("vimeo.com")) return "vimeo"
  if (url.includes("tiktok.com")) return "tiktok"
  if (url.includes("instagram.com")) return "instagram"
  if (url.includes("twitter.com") || url.includes("x.com")) return "x"
  return "other"
}

export async function fetchOEmbed(url: string): Promise<OEmbedResult> {
  const site = detectSite(url)
  const endpoint = OEMBED_ENDPOINTS[site]

  if (endpoint) {
    try {
      const res = await fetch(endpoint + "?url=" + encodeURIComponent(url) + "&format=json")
      if (res.ok) {
        const data = await res.json()
        return {
          title: data.title || url,
          thumbnail: data.thumbnail_url || "",
          html: data.html || null,
          site,
          isPlayable: !!data.html,
        }
      }
    } catch {}
  }

  return {
    title: url,
    thumbnail: "",
    html: null,
    site,
    isPlayable: false,
  }
}