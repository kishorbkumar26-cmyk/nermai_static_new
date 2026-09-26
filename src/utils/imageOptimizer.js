/**
 * Image optimization, Google Drive URL conversion, and Multi-Node CDN Load Balancing.
 * Ported from Construction project — same battle-tested logic.
 */

// Extract Google Drive File ID from various URL formats or raw IDs
export function extractGoogleDriveId(urlOrId) {
  if (!urlOrId || typeof urlOrId !== 'string') return ''
  // Remove all whitespace, newlines, and surrounding quotes
  let str = urlOrId.replace(/\s+/g, '').replace(/['"]/g, '').trim()
  if (!str) return ''

  // Decode URI component if encoded
  try {
    if (str.includes('%')) str = decodeURIComponent(str)
  } catch {}

  // If it's a data URL, blob URL, or local asset path, definitely not Drive
  if (str.startsWith('data:') || str.startsWith('blob:') || str.startsWith('assets/') || str.startsWith('/assets/')) {
    return ''
  }

  const isHttpUrl = /^https?:\/\//i.test(str) || str.startsWith('//')
  
  if (isHttpUrl) {
    // For full HTTP/HTTPS URLs, it MUST be a Google domain
    let isGoogleDomain = false
    try {
      const hostname = new URL(str.startsWith('//') ? `https:${str}` : str).hostname
      isGoogleDomain = /(?:^|\.)(?:google\.com|googleusercontent\.com)$/i.test(hostname)
    } catch {
      isGoogleDomain = /google\.com|googleusercontent\.com/i.test(str)
    }
    if (!isGoogleDomain) {
      return ''
    }
  } else {
    // Not a full URL. If it has slashes, query params or colons, it might be a partial URL (e.g. drive.google.com/...)
    if (str.includes('/') || str.includes('?') || str.includes(':')) {
      const isGoogleLike = /google\.com|googleusercontent\.com/i.test(str)
      if (!isGoogleLike) {
        return ''
      }
    } else {
      // Raw string without slashes or colons.
      // Direct raw ID check: Google Drive IDs are strictly 25-60 chars alphanumeric with _ or -
      const stripped = str.replace(/[?#].*$/, '').replace(/=[sw]\d+.*$/, '')
      if (/^[a-zA-Z0-9_-]{25,60}$/.test(stripped)) {
        return stripped
      }
      return ''
    }
  }

  // Pattern matching across all known Google Drive & Google CDN URLs
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]{25,60})/,
    /\/folders\/([a-zA-Z0-9_-]{25,60})/,
    /\/d\/([a-zA-Z0-9_-]{25,60})/,
    /[?&]id=([a-zA-Z0-9_-]{25,60})/,
    /\/thumbnail\?id=([a-zA-Z0-9_-]{25,60})/,
    /\/uc\?.*id=([a-zA-Z0-9_-]{25,60})/,
    /\/open\?.*id=([a-zA-Z0-9_-]{25,60})/,
    /googleusercontent\.com\/[ud]\/([a-zA-Z0-9_-]{25,60})/
  ]

  for (const pattern of patterns) {
    const match = str.match(pattern)
    if (match && match[1]) return match[1]
  }

  return ''
}

export function getGoogleDriveCDNUrl(urlOrId, width = 1000) {
  const fileId = extractGoogleDriveId(urlOrId)
  if (!fileId) return urlOrId
  // lh3 Google User Content CDN serves directly with high resolution and no redirect
  return `https://lh3.googleusercontent.com/d/${fileId}=w${width}`
}

export function getGoogleDriveDirectUrl(urlOrId) {
  const fileId = extractGoogleDriveId(urlOrId)
  if (!fileId) return urlOrId
  return `https://lh3.googleusercontent.com/d/${fileId}=w1000`
}

export function handleImageError(event, fallbackUrl = '') {
  const imgEl = event.target
  if (!imgEl) return
  const currentSrc = imgEl.src || ''
  const driveId = extractGoogleDriveId(currentSrc)
  if (driveId) {
    const step = parseInt(imgEl.dataset.fallbackStep || '0', 10)
    const chain = [
      `https://lh3.googleusercontent.com/d/${driveId}=w1000`,
      `https://drive.google.com/thumbnail?id=${driveId}&sz=w1000`,
      `https://drive.google.com/thumbnail?id=${driveId}&sz=w600`,
      `https://lh3.googleusercontent.com/u/0/d/${driveId}=w1000`,
      `https://drive.usercontent.google.com/download?id=${driveId}&export=view`,
      `https://drive.google.com/uc?id=${driveId}&export=view`
    ]
    if (step < chain.length) {
      imgEl.dataset.fallbackStep = String(step + 1)
      imgEl.src = chain[step]
      return
    }
  }
  if (fallbackUrl) {
    imgEl.src = fallbackUrl
  } else {
    const fallbackSibling = imgEl.parentElement?.querySelector('.ss-poster-fallback, .toppers-card-photo-fallback, .rp-avatar-fallback')
    if (fallbackSibling) {
      imgEl.style.display = 'none'
      fallbackSibling.style.display = 'flex'
    }
  }
}

function dataURLtoBlob(dataurl) {
  const arr = dataurl.split(',')
  const mime = arr[0].match(/:(.*?);/)[1]
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) u8arr[n] = bstr.charCodeAt(n)
  return new Blob([u8arr], { type: mime })
}

export function compressImage(file, options = {}) {
  const { maxWidth = 1600, maxHeight = 1600, quality = 0.85, mimeType = 'image/webp' } = options
  return new Promise((resolve, reject) => {
    function processCanvas(img, originalSize) {
      let width = img.width
      let height = img.height
      if (width > maxWidth) { height = Math.round((height * maxWidth) / width); width = maxWidth }
      if (height > maxHeight) { width = Math.round((width * maxHeight) / height); height = maxHeight }
      const maxFileBytes = 358400
      let currentQuality = quality, currentWidth = width, currentHeight = height
      let dataUrl = '', compressedSize = 0, iteration = 0
      const outputType = (mimeType === 'image/webp' || mimeType === 'image/jpeg') ? mimeType : 'image/webp'
      while (iteration < 4) {
        const canvas = document.createElement('canvas')
        canvas.width = currentWidth; canvas.height = currentHeight
        const ctx = canvas.getContext('2d')
        ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, currentWidth, currentHeight)
        dataUrl = canvas.toDataURL(outputType, currentQuality)
        compressedSize = Math.round((dataUrl.length - 22) * 3 / 4)
        if (compressedSize <= maxFileBytes || iteration === 3) break
        currentWidth = Math.max(1000, Math.round(currentWidth * 0.85))
        currentHeight = Math.max(1000, Math.round(currentHeight * 0.85))
        currentQuality = Math.max(0.65, currentQuality * 0.85)
        iteration++
      }
      let blob = null
      try { blob = dataURLtoBlob(dataUrl) } catch (e) { console.error('dataURL→blob failed', e) }
      resolve({ dataUrl, blob, width: currentWidth, height: currentHeight, originalSize, compressedSize, savedPercent: Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100)) })
    }
    if (typeof file === 'string' && file.startsWith('data:')) {
      const img = new Image(); img.onload = () => processCanvas(img, file.length); img.onerror = reject; img.src = file; return
    }
    if (file instanceof File || file instanceof Blob) {
      const reader = new FileReader()
      reader.onload = (e) => { const img = new Image(); img.onload = () => processCanvas(img, file.size); img.onerror = reject; img.src = e.target.result }
      reader.onerror = reject; reader.readAsDataURL(file); return
    }
    reject(new Error('Unsupported file type'))
  })
}
