import { useState, useRef, useEffect } from 'react'
import { driveStorage } from '../../services/driveStorage'
import { extractGoogleDriveId } from '../../utils/imageOptimizer'

/**
 * Universal Admin Image Uploader with Explicit Dimension Indicators
 */
export default function AdminImageUpload({
  value = '',
  onChange,
  label = 'Image',
  dimensions = '',
  subFolderName = 'nermai-uploads',
  maxWidth = 1600,
  quality = 0.85,
  hint = '',
  placeholder = 'Paste Google Drive URL / File ID or Web Image URL...',
  previewHeight = 140,
  aspectRatio = 'auto',
  toast
}) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const [imgError, setImgError] = useState(false)
  const [copied, setCopied] = useState(false)
  const [naturalDims, setNaturalDims] = useState(null)
  const fileInputRef = useRef(null)

  const config = driveStorage.getConfig()
  const isDriveConfigured = !!config.appsScriptUrl || !!config.accessToken

  // Smart fallback for dimensions if not explicitly passed
  const getComputedDimensions = () => {
    if (dimensions) return dimensions
    const lbl = (label || '').toLowerCase()
    const folder = (subFolderName || '').toLowerCase()

    if (lbl.includes('desktop') || folder.includes('desktop')) return '1920 × 800 px (Landscape 16:9 / 21:9)'
    if (lbl.includes('mobile') || folder.includes('mobile')) return '800 × 1200 px (Portrait 2:3)'
    if (lbl.includes('why nermai') || folder.includes('why-nermai')) return '1024 × 475 px (Panoramic Landscape)'
    if (lbl.includes('logo') || folder.includes('logo')) return '512 × 512 px (Square PNG/SVG)'
    if (lbl.includes('topper') || lbl.includes('student') || folder.includes('toppers')) return '600 × 750 px (Portrait 4:5)'
    if (lbl.includes('gallery') || folder.includes('gallery')) return '1200 × 800 px (Landscape 3:2)'
    if (lbl.includes('review') || lbl.includes('testimonial') || folder.includes('testimonials')) return '400 × 400 px (Square 1:1)'
    if (lbl.includes('course') || folder.includes('course')) return '800 × 500 px (Landscape 16:10)'
    if (lbl.includes('result') || folder.includes('results')) return '1080 × 1350 px (Poster 4:5)'
    return '1200 × 800 px (Recommended)'
  }

  const dimText = getComputedDimensions()

  const handleFileUpload = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      if (toast) toast.error('Please select a valid image file (PNG, JPG, WebP)')
      return
    }
    setUploading(true)
    setProgress(20)
    setImgError(false)

    try {
      const result = await driveStorage.processAndUploadImage(file, {
        subFolderName,
        maxWidth,
        quality
      })
      setProgress(90)
      onChange(result.url)
      
      const storageLabel = result.storageType === 'google_drive' ? 'Google Drive' : 'Local Storage'
      if (toast) {
        toast.success(`Image uploaded to ${storageLabel}! (${result.reductionPct || 0}% compressed)`)
      }
    } catch (err) {
      console.error('Upload failed:', err)
      if (toast) toast.error('Upload failed: ' + err.message)
    } finally {
      setUploading(false)
      setProgress(0)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleUrlChange = (e) => {
    const rawVal = e.target.value
    setImgError(false)
    const cleaned = rawVal.trim().replace(/^['"]|['"]$/g, '')
    onChange(cleaned)
  }

  const handleCopy = () => {
    if (!value) return
    navigator.clipboard?.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    if (toast) toast.info('Image URL copied to clipboard')
  }

  const handleClear = () => {
    onChange('')
    setImgError(false)
    setNaturalDims(null)
  }

  // ─── Preview strategy ────────────────────────────────────────────────────────
  // Files ARE publicly shared (Apps Script calls setSharing). The issue is:
  // lh3.googleusercontent.com CDN rate-limits requests, causing 403s.
  //
  // FIX: Use drive.google.com/thumbnail (separate bucket, generous limit) first.
  // If that fails → try lh3 CDN. If that fails → use iframe /preview as fallback.
  const driveId = extractGoogleDriveId(value)
  const isDriveLink = !!driveId
  const isBase64 = typeof value === 'string' && value.startsWith('data:')

  const DRIVE_PREVIEW_CHAIN = (id) => [
    `https://drive.google.com/thumbnail?id=${id}&sz=w300`,       // ① thumbnail API (separate rate-limit)
    `https://drive.google.com/thumbnail?id=${id}&sz=w600`,       // ② thumbnail larger
    `https://lh3.googleusercontent.com/d/${id}=w400`,            // ③ CDN normal
    `https://lh3.googleusercontent.com/u/0/d/${id}=w400`,        // ④ CDN alt path
    `https://drive.usercontent.google.com/download?id=${id}&export=view`, // ⑤ usercontent
  ]

  const getInitialSrc = () => {
    if (driveId) return DRIVE_PREVIEW_CHAIN(driveId)[0]
    return driveStorage.formatImageUrl(value) || value
  }

  // 'img' = show <img>, 'iframe' = show Drive /preview embed
  const [previewMode, setPreviewMode] = useState(() => 'img')
  const [imgSrc, setImgSrc]           = useState(getInitialSrc)
  const [imgStep, setImgStep]         = useState(0)

  useEffect(() => {
    setImgError(false)
    setPreviewMode('img')
    setImgSrc(getInitialSrc())
    setImgStep(0)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  let testUrl = value
  if (driveId) testUrl = `https://drive.google.com/file/d/${driveId}/view`

  const handleImgError = () => {
    if (!driveId) { setImgError(true); return }
    const chain = DRIVE_PREVIEW_CHAIN(driveId)
    const next = imgStep + 1
    if (next < chain.length) {
      setImgStep(next)
      setImgSrc(chain[next])
    } else {
      // All img URLs failed → last resort: Drive /preview iframe
      setPreviewMode('iframe')
    }
  }

  const handleSwitchToIframe = () => {
    setImgError(false)
    setPreviewMode('iframe')
  }

  return (
    <div className="ap-image-upload-wrapper" style={{
      background: '#ffffff',
      border: '1.5px solid #e2e8f0',
      borderRadius: '10px',
      padding: '1.1rem',
      marginBottom: '1.25rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
    }}>
      {/* Header with Label & Required Dimensions Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <i className="fa-solid fa-image" style={{ color: 'var(--maroon, #7b1b2e)', fontSize: '0.95rem' }} />
          <strong style={{ fontSize: '0.88rem', color: '#1e293b' }}>{label}</strong>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* Dimension Tag */}
          <span style={{
            fontSize: '0.72rem',
            background: '#eff6ff',
            color: '#1d4ed8',
            border: '1px solid #bfdbfe',
            padding: '3px 9px',
            borderRadius: '6px',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px'
          }}>
            <i className="fa-solid fa-ruler-combined" />
            Size: {dimText}
          </span>

          <span style={{
            fontSize: '0.7rem',
            background: isDriveConfigured ? '#dcfce7' : '#fef3c7',
            color: isDriveConfigured ? '#166534' : '#92400e',
            padding: '3px 8px',
            borderRadius: '6px',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <i className={isDriveConfigured ? 'fa-brands fa-google-drive' : 'fa-solid fa-floppy-disk'} />
            {isDriveConfigured ? 'Drive Upload' : 'Auto Compress'}
          </span>
        </div>
      </div>

      {/* Option 1: File Drop Zone */}
      <div
        className={`ap-file-drop ${dragOver ? 'drag-over' : ''}`}
        style={{
          border: '2px dashed #cbd5e1',
          borderRadius: '8px',
          padding: '1.1rem 0.85rem',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragOver ? 'rgba(230, 92, 0, 0.05)' : '#f8fafc',
          transition: 'all 0.2s ease',
          marginBottom: '0.75rem'
        }}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => {
          e.preventDefault()
          setDragOver(false)
          if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0])
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <i className={`fa-solid ${uploading ? 'fa-spinner fa-spin' : 'fa-cloud-arrow-up'}`}
          style={{ fontSize: '1.5rem', color: uploading ? 'var(--saffron, #e65c00)' : '#64748b', marginBottom: '0.35rem', display: 'block' }}
        />
        <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#1e293b' }}>
          {uploading ? `Uploading & Optimizing... ${progress}%` : 'Click to Browse or Drag Photo Here'}
        </div>
        <div style={{ fontSize: '0.73rem', color: '#64748b', marginTop: '3px', fontWeight: 500 }}>
          Ideal Resolution: <strong style={{ color: '#0f172a' }}>{dimText}</strong>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={e => {
            if (e.target.files?.[0]) handleFileUpload(e.target.files[0])
          }}
        />

        {uploading && (
          <div className="ap-upload-progress" style={{ height: 4, background: '#e2e8f0', borderRadius: 2, marginTop: '0.5rem', overflow: 'hidden' }}>
            <div className="ap-upload-progress-bar" style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, #e65c00, #7b1b2e)', transition: 'width 0.3s' }} />
          </div>
        )}
      </div>

      {/* Option 2: Google Drive / Image URL Input */}
      <div style={{ marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>
            Or Paste Web Image / Google Drive URL:
          </label>
          {isDriveLink && (
            <span style={{ fontSize: '0.68rem', color: '#16a34a', fontWeight: 600 }}>
              <i className="fa-solid fa-circle-check" /> Google Drive Link Detected
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            className="ap-input"
            value={value || ''}
            onChange={handleUrlChange}
            placeholder={placeholder}
            style={{ fontSize: '0.82rem', flex: 1 }}
          />
          {value && (
            <button
              type="button"
              className="ap-btn ap-btn-danger ap-btn-sm"
              onClick={handleClear}
              title="Clear Image"
              style={{ padding: '0 0.6rem' }}
            >
              <i className="fa-solid fa-xmark" />
            </button>
          )}
        </div>
      </div>

      {/* Image Preview & Detected Dimensions Box */}
      {value && (
        <div className="ap-image-preview-box" style={{
          background: '#f8fafc',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          padding: '0.75rem',
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          {/* Thumbnail */}
          <div style={{
            width: '120px',
            height: `${previewHeight}px`,
            borderRadius: '6px',
            overflow: 'hidden',
            background: '#0f172a',
            border: '1px solid #cbd5e1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            flexShrink: 0
          }}>
            {previewMode === 'iframe' && driveId ? (
              /* Drive /preview — Google's own viewer, works regardless of sharing/CDN limits */
              <iframe
                key={`iframe-${driveId}`}
                src={`https://drive.google.com/file/d/${driveId}/preview`}
                title="Drive Preview"
                allow="autoplay"
                style={{
                  width: '180%', height: '180%', border: 'none',
                  transform: 'scale(0.56)', transformOrigin: 'top left',
                  pointerEvents: 'none'
                }}
              />
            ) : previewMode === 'img' && !imgError ? (
              <img
                key={imgSrc}
                src={imgSrc}
                alt="Preview"
                referrerPolicy="no-referrer"
                onLoad={e => setNaturalDims({ w: e.target.naturalWidth, h: e.target.naturalHeight })}
                onError={handleImgError}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            ) : (
              /* Error state — show switch-to-iframe or open-in-drive */
              <div style={{ color: '#92400e', fontSize: '0.62rem', textAlign: 'center', padding: '0.4rem', background: '#fef3c7', borderRadius: '4px', width: '100%' }}>
                <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: '0.9rem', display: 'block', marginBottom: '4px', color: '#d97706' }} />
                <div style={{ fontWeight: 700, marginBottom: '4px' }}>Preview failed</div>
                {driveId && (
                  <button type="button" onClick={handleSwitchToIframe}
                    style={{ background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '0.58rem', padding: '3px 6px', cursor: 'pointer', fontWeight: 700, display: 'block', width: '100%', marginBottom: '4px' }}>
                    <i className="fa-solid fa-play" /> Load Preview
                  </button>
                )}
                <a href={driveId ? `https://drive.google.com/file/d/${driveId}/view` : value}
                  target="_blank" rel="noopener noreferrer"
                  style={{ color: '#1d4ed8', fontSize: '0.58rem', textDecoration: 'underline', fontWeight: 600 }}>
                  {driveId ? 'Open in Drive ↗' : 'Open Link ↗'}
                </a>
              </div>
            )}
          </div>

          {/* Metadata & Actions */}
          <div style={{ flex: 1, minWidth: '180px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <i className="fa-solid fa-circle-check" /> Active Image
              </span>

              {naturalDims && (
                <span style={{
                  fontSize: '0.7rem',
                  background: '#f1f5f9',
                  color: '#334155',
                  border: '1px solid #cbd5e1',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontWeight: 600
                }}>
                  Actual: {naturalDims.w} × {naturalDims.h} px
                </span>
              )}
            </div>

            <div style={{ fontSize: '0.72rem', color: '#64748b', wordBreak: 'break-all', marginBottom: '0.5rem' }}>
              {isBase64 ? 'Compressed Base64 Image' : value}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {!isBase64 && (
                <a
                  href={testUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ap-btn ap-btn-sm"
                  style={{ fontSize: '0.72rem', padding: '2px 8px', background: '#f1f5f9', color: '#334155', textDecoration: 'none' }}
                >
                  <i className="fa-solid fa-arrow-up-right-from-square" /> Test Link
                </a>
              )}
              <button
                type="button"
                className="ap-btn ap-btn-sm"
                onClick={handleCopy}
                style={{ fontSize: '0.72rem', padding: '2px 8px', background: '#f1f5f9', color: '#334155' }}
              >
                <i className="fa-solid fa-copy" /> {copied ? 'Copied!' : 'Copy URL'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
