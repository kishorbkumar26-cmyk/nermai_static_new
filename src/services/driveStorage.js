/**
 * Drive Storage Service for NERMAI
 * Priority: Google Apps Script → Drive REST API → Firestore base64
 * Ported from Construction project driveStorage.js
 *
 * Image Caching:
 *  - formatImageUrl() returns the canonical URL (sync, unchanged)
 *  - Use useCachedImage(url) hook in components for async Cache API resolution
 *  - preloadImages(urls) / preloadSlideImages(slides) eagerly fill the cache in the background
 */
import { compressImage, extractGoogleDriveId, getGoogleDriveCDNUrl } from '../utils/imageOptimizer'
import { fbFirestore } from '../firebase/firestore'
import { preloadImages as _preloadImages } from '../utils/imageCache'

const DRIVE_CONFIG_KEY = 'nermai_drive_config'

const DEFAULT_DRIVE_CONFIG = {
  appsScriptUrl: '',
  folderId: '',
  accessToken: '',
  maxWidth: 1600,
  quality: 0.85
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function fileToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export const driveStorage = {
  getConfig() {
    try {
      const raw = localStorage.getItem(DRIVE_CONFIG_KEY)
      return raw ? { ...DEFAULT_DRIVE_CONFIG, ...JSON.parse(raw) } : DEFAULT_DRIVE_CONFIG
    } catch {
      return DEFAULT_DRIVE_CONFIG
    }
  },

  saveConfig(config) {
    try {
      const current = this.getConfig()
      const cleanedFolderId = config.folderId ? (extractGoogleDriveId(config.folderId) || config.folderId.trim()) : ''
      const updated = {
        ...current,
        ...config,
        ...(config.folderId !== undefined ? { folderId: cleanedFolderId } : {})
      }
      localStorage.setItem(DRIVE_CONFIG_KEY, JSON.stringify(updated))
      fbFirestore.updateSettings({ driveConfig: updated }).catch(() => {})
      return updated
    } catch (e) {
      console.error('Failed to save Drive config', e)
      return DEFAULT_DRIVE_CONFIG
    }
  },

  async processAndUploadImage(file, options = {}) {
    const config = this.getConfig()
    let compressedBlob = null, dataUrl = null, reductionPct = 0

    if (file instanceof File || file instanceof Blob) {
      try {
        const result = await compressImage(file, {
          maxWidth: options.maxWidth || config.maxWidth,
          quality: options.quality || config.quality,
          mimeType: 'image/jpeg'
        })
        compressedBlob = result.blob
        dataUrl = result.dataUrl
        reductionPct = result.savedPercent || 0
      } catch (err) {
        console.warn('Compression skipped:', err)
      }
    }

    const uploadBlob = compressedBlob || file
    const cleanName = (file.name || `img_${Date.now()}`).replace(/\.\w+$/, '') + '.jpg'
    const targetFolderId = extractGoogleDriveId(config.folderId) || (config.folderId || '').trim()

    // 1. Try Google Apps Script Web App (actual Google Drive upload)
    if (config.appsScriptUrl) {
      try {
        const base64Data = dataUrl ? dataUrl.split(',')[1] : await blobToBase64(file)
        const rawSubFolder = options.subFolderName || ''
        const subFolderName = rawSubFolder.replace(/[\\/:*?"<>|]/g, '').trim().slice(0, 80)

        const actualMimeType = dataUrl ? (dataUrl.split(';')[0].split(':')[1] || 'image/jpeg') : (file.type || 'image/jpeg')
        const response = await fetch(config.appsScriptUrl, {
          method: 'POST',
          mode: 'cors',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({
            filename: cleanName,
            mimeType: actualMimeType,
            base64: base64Data,
            folderId: targetFolderId,
            ...(subFolderName ? { subFolderName } : {})
          })
        })

        if (response.ok) {
          const resData = await response.json()
          if (resData.status === 'success' && resData.fileId) {
            return {
              url: getGoogleDriveCDNUrl(resData.fileId, options.maxWidth || 1600),
              driveUrl: resData.viewUrl || `https://drive.google.com/file/d/${resData.fileId}/view`,
              fileId: resData.fileId,
              storageType: 'google_drive',
              reductionPct
            }
          } else if (resData.status === 'error') {
            console.error('Google Apps Script upload error:', resData.message)
            throw new Error(resData.message || 'Google Drive Apps Script returned an error.')
          }
        }
      } catch (err) {
        console.error('Apps Script upload failed, checking fallbacks:', err)
        // If it was an explicit script error, propagate so user knows
        if (err.message && !err.message.includes('Failed to fetch')) {
          console.warn('Google Drive Script Error:', err.message)
        }
      }
    }

    // 2. Try Google Drive REST API (requires OAuth token)
    if (config.accessToken && uploadBlob) {
      try {
        const metadata = { name: cleanName, parents: [targetFolderId || ''] }
        const formData = new FormData()
        formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
        formData.append('file', uploadBlob)

        const res = await fetch(
          'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
          { method: 'POST', headers: { Authorization: `Bearer ${config.accessToken}` }, body: formData }
        )
        if (res.ok) {
          const data = await res.json()
          return {
            url: getGoogleDriveCDNUrl(data.id, options.maxWidth || 1600),
            driveUrl: data.webViewLink,
            fileId: data.id,
            storageType: 'google_drive',
            reductionPct
          }
        }
      } catch (err) {
        console.error('Drive API failed, falling back to base64:', err)
      }
    }

    // 3. Fallback: base64 data URL in Firestore (works on all devices)
    if (dataUrl) return { url: dataUrl, storageType: 'local_base64', reductionPct }
    const fallbackDataUrl = await fileToDataUrl(file)
    return { url: fallbackDataUrl, storageType: 'local_base64', reductionPct }
  },

  async processAndUploadFile(file, options = {}) {
    const config = this.getConfig()
    const cleanName = (file.name || `file_${Date.now()}`).replace(/[\\/:*?"<>|]/g, '')
    const targetFolderId = extractGoogleDriveId(config.folderId) || (config.folderId || '').trim()

    // 1. Google Apps Script Web App
    if (config.appsScriptUrl) {
      try {
        const base64Data = await blobToBase64(file)
        const rawSubFolder = options.subFolderName || ''
        const subFolderName = rawSubFolder.replace(/[\\/:*?"<>|]/g, '').trim().slice(0, 80)

        const response = await fetch(config.appsScriptUrl, {
          method: 'POST',
          mode: 'cors',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({
            filename: cleanName,
            mimeType: file.type || 'application/octet-stream',
            base64: base64Data,
            folderId: targetFolderId,
            ...(subFolderName ? { subFolderName } : {})
          })
        })

        if (response.ok) {
          const resData = await response.json()
          if (resData.status === 'success' && resData.fileId) {
            return {
              url: getGoogleDriveCDNUrl(resData.fileId),
              driveUrl: resData.viewUrl || `https://drive.google.com/file/d/${resData.fileId}/view`,
              fileId: resData.fileId,
              storageType: 'google_drive'
            }
          } else if (resData.status === 'error') {
            throw new Error(resData.message || 'Google Drive upload error')
          }
        }
      } catch (err) {
        console.error('Drive API failed for file upload:', err)
      }
    }

    // 2. Fallback: upload as base64
    const fallbackDataUrl = await fileToDataUrl(file)
    return { url: fallbackDataUrl, storageType: 'local_base64' }
  },

  async uploadImage(file, options = {}) {
    const res = await this.processAndUploadImage(file, options)
    return res.url
  },

  /**
   * Proactively fetch and cache a list of image URLs in the background.
   * Fire-and-forget: does not block, never throws.
   * @param {string[]} urls
   */
  preloadImages(urls = []) {
    const formatted = urls
      .map(url => this.formatImageUrl(url))
      .filter(Boolean)
    _preloadImages(formatted)
  },

  /**
   * Preload hero/carousel slide images (desktop + mobile variants) in the background.
   * Prioritises the active slide first, then the next slide.
   * @param {Array<{ url?, urlDesktop?, urlMobile? }>} slides
   * @param {number} [activeIdx=0]
   */
  preloadSlideImages(slides = [], activeIdx = 0) {
    if (!slides.length) return
    const ordered = [
      slides[activeIdx],
      slides[(activeIdx + 1) % slides.length],
      ...slides.filter((_, i) => i !== activeIdx && i !== (activeIdx + 1) % slides.length)
    ].filter(Boolean)

    const urls = []
    ordered.forEach(slide => {
      const desktop = slide.urlDesktop || slide.url
      const mobile  = slide.urlMobile  || slide.urlDesktop || slide.url
      if (desktop) urls.push(this.formatImageUrl(desktop))
      if (mobile && mobile !== desktop) urls.push(this.formatImageUrl(mobile))
    })
    _preloadImages(urls.filter(Boolean))
  },

  formatImageUrl(url, size = 1000) {
    if (!url || typeof url !== 'string') return null
    const trimmed = url.trim()
    if (!trimmed) return null
    if (trimmed.startsWith('data:') || trimmed.startsWith('blob:') || trimmed.startsWith('assets/') || trimmed.startsWith('/assets/') || trimmed.startsWith('/') || trimmed.startsWith('./')) return trimmed
    const driveId = extractGoogleDriveId(trimmed)
    if (driveId) return getGoogleDriveCDNUrl(driveId, size)
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('//')) return trimmed
    return null
  },

  handleImageError(event, fallbackUrl = '') {
    const imgEl = event.target
    if (!imgEl) return
    const currentSrc = imgEl.src || ''
    const driveId = extractGoogleDriveId(currentSrc)
    if (driveId) {
      const step = imgEl.dataset.fallbackStep || '0'
      // Step 1: thumbnail API sz=w800 (separate rate-limit bucket — more reliable)
      if (step === '0') {
        imgEl.dataset.fallbackStep = '1'
        imgEl.src = `https://drive.google.com/thumbnail?id=${driveId}&sz=w800`
        return
      }
      // Step 2: lh3 direct CDN
      if (step === '1') {
        imgEl.dataset.fallbackStep = '2'
        imgEl.src = `https://lh3.googleusercontent.com/d/${driveId}=w1000`
        return
      }
      // Step 3: lh3 with /u/0/ path
      if (step === '2') {
        imgEl.dataset.fallbackStep = '3'
        imgEl.src = `https://lh3.googleusercontent.com/u/0/d/${driveId}=w1000`
        return
      }
      // Step 4: drive usercontent download
      if (step === '3') {
        imgEl.dataset.fallbackStep = '4'
        imgEl.src = `https://drive.usercontent.google.com/download?id=${driveId}&export=view`
        return
      }
      // Step 5: legacy uc export
      if (step === '4') {
        imgEl.dataset.fallbackStep = '5'
        imgEl.src = `https://drive.google.com/uc?id=${driveId}&export=view`
        return
      }
    }
    if (fallbackUrl) {
      imgEl.src = fallbackUrl
    } else {
      imgEl.style.display = 'none'
      const fallbackSibling = imgEl.parentElement?.querySelector('.toppers-card-photo-fallback, .rp-avatar-fallback')
      if (fallbackSibling) fallbackSibling.style.display = 'flex'
    }
  }
}
