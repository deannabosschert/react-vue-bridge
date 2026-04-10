export const extractYouTubeId = (url: string): string | null => {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([a-zA-Z0-9_-]{11})/)
  return match?.[1] ?? null
}

export const extractVimeoId = (url: string): string | null => {
  const match = url.match(/(?:vimeo\.com\/(?:video\/|channels\/\w+\/|groups\/\w+\/videos\/)?|player\.vimeo\.com\/video\/)(\d+)/)
  return match?.[1] ?? null
}

export type VideoProvider = 'youtube' | 'vimeo' | 'unknown'

export const detectProvider = (url: string): VideoProvider => {
  if (extractYouTubeId(url)) return 'youtube'
  if (extractVimeoId(url)) return 'vimeo'
  return 'unknown'
}

export const getVideoThumbnail = (url: string): string | null => {
  const ytId = extractYouTubeId(url)
  return ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : null
}

export const getProviderLabel = (url: string): string => {
  const p = detectProvider(url)
  if (p === 'youtube') return 'YouTube'
  if (p === 'vimeo') return 'Vimeo'
  return 'Video'
}
