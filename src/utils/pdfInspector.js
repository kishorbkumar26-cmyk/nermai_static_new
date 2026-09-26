import { PDFDocument } from 'pdf-lib'

/**
 * Inspect a PDF file in browser memory to extract:
 * - totalPages
 * - fileSizeBytes
 * - cleanTitle
 * - thumbnailDataUrl (page 1 rendered to canvas)
 * 
 * @param {File | Blob | ArrayBuffer} fileInput
 * @returns {Promise<{ pageCount: number, fileSizeBytes: number, cleanTitle: string, thumbnailDataUrl: string | null }>}
 */
export async function inspectPdfFile(fileInput) {
  let arrayBuffer
  let fileSizeBytes = 0
  let cleanTitle = ''

  if (fileInput instanceof ArrayBuffer) {
    arrayBuffer = fileInput
    fileSizeBytes = arrayBuffer.byteLength
  } else if (fileInput && typeof fileInput.arrayBuffer === 'function') {
    arrayBuffer = await fileInput.arrayBuffer()
    fileSizeBytes = fileInput.size || arrayBuffer.byteLength
    if (fileInput.name) {
      cleanTitle = fileInput.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
    }
  } else {
    throw new Error('Invalid PDF input provided to inspectPdfFile')
  }

  // 1. Extract total pages using pdf-lib
  let pageCount = 1
  try {
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true })
    pageCount = pdfDoc.getPageCount()
  } catch (err) {
    console.warn('pdf-lib failed to parse page count, trying binary fallback:', err)
    try {
      const text = new TextDecoder('latin1').decode(new Uint8Array(arrayBuffer.slice(0, 500000)))
      const matches = [...text.matchAll(/\/Type\s*\/Page\b/g)]
      if (matches.length > 0) pageCount = matches.length
    } catch (fallbackErr) {
      console.warn('Binary page count fallback also failed:', fallbackErr)
    }
  }

  // 2. Generate First Page Canvas Thumbnail using pdfjs-dist if available in browser
  let thumbnailDataUrl = null
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    try {
      const pdfjs = await import('pdfjs-dist/build/pdf.min.mjs').catch(() => import('pdfjs-dist'))
      if (pdfjs) {
        if (!pdfjs.GlobalWorkerOptions.workerSrc) {
          try {
            pdfjs.GlobalWorkerOptions.workerSrc = new URL(
              'pdfjs-dist/build/pdf.worker.min.mjs',
              import.meta.url
            ).toString()
          } catch {
            pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version || '5.0.375'}/build/pdf.worker.min.mjs`
          }
        }

        const loadingTask = pdfjs.getDocument({
          data: new Uint8Array(arrayBuffer.slice(0)),
          stopAtErrors: false
        })
        const pdf = await loadingTask.promise
        const firstPage = await pdf.getPage(1)

        const viewport = firstPage.getViewport({ scale: 1.0 })
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')
        
        // Target width around 320px for crisp, lightweight thumbnail (~25 KB)
        const scale = 320 / viewport.width
        const scaledViewport = firstPage.getViewport({ scale })

        canvas.width = Math.floor(scaledViewport.width)
        canvas.height = Math.floor(scaledViewport.height)

        await firstPage.render({
          canvasContext: context,
          viewport: scaledViewport
        }).promise

        thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.70)
      }
    } catch (thumbErr) {
      console.warn('Could not generate client-side canvas thumbnail:', thumbErr)
    }
  }

  return {
    pageCount: Math.max(1, pageCount),
    fileSizeBytes,
    cleanTitle,
    thumbnailDataUrl
  }
}

/**
 * Format bytes to readable string (e.g. 2.04 MB)
 */
export function formatBytes(bytes) {
  if (!bytes || Number(bytes) <= 0) return '0 KB'
  const mb = Number(bytes) / (1024 * 1024)
  if (mb >= 1) return `${mb.toFixed(2)} MB`
  const kb = Number(bytes) / 1024
  return `${Math.round(kb)} KB`
}
