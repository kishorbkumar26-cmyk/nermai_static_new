import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function drivePdfInspectorPlugin() {
  return {
    name: 'drive-pdf-inspector',
    configureServer(server) {
      server.middlewares.use('/api/inspect-drive-pdf', async (req, res) => {
        try {
          const url = new URL(req.url, `http://${req.headers.host}`)
          const driveId = url.searchParams.get('id')
          if (!driveId) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            return res.end(JSON.stringify({ error: 'Missing drive file id' }))
          }

          const downloadUrl = `https://drive.google.com/uc?export=download&id=${driveId}`
          const response = await fetch(downloadUrl)
          if (!response.ok) {
            res.statusCode = 502
            res.setHeader('Content-Type', 'application/json')
            return res.end(JSON.stringify({ error: 'Failed to fetch from Drive' }))
          }

          const arrayBuffer = await response.arrayBuffer()
          const { PDFDocument } = await import('pdf-lib')
          const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true })
          const pageCount = pdfDoc.getPageCount()
          const fileSizeBytes = arrayBuffer.byteLength

          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({
            pageCount,
            fileSizeBytes,
            thumbnailUrl: `https://drive.google.com/thumbnail?id=${driveId}&sz=w800`
          }))
        } catch (err) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: err.message }))
        }
      })
    }
  }
}

export default defineConfig({
  plugins: [react(), drivePdfInspectorPlugin()],

  build: {
    // Split large chunks so browsers cache vendor libs separately from app code
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/firebase')) {
            return 'firebase-core';
          }
          if (
            id.includes('node_modules/react') ||
            id.includes('node_modules/react-dom') ||
            id.includes('node_modules/react-router-dom')
          ) {
            return 'react-vendor';
          }
        }
      }
    },
    // Warn if any chunk exceeds 600KB
    chunkSizeWarningLimit: 600,
  },

  // Enable dependency pre-bundling for faster dev starts
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'firebase/app', 'firebase/firestore']
  }
})
