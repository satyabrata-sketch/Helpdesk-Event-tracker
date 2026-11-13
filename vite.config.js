import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const { getLiveExcelData } = require('./scripts/serverSync.cjs')

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'live-sync-api',
      configureServer(server) {
        server.middlewares.use('/api/sync-helpdesk', (req, res) => {
          try {
            delete require.cache[require.resolve('./scripts/helpdeskSync.cjs')]
            const { syncHelpdeskFromExcel } = require('./scripts/helpdeskSync.cjs')
            const url = new URL(req.url, 'http://localhost:3000')
            const customFileUrl = url.searchParams.get('fileUrl')
            const customFileId = url.searchParams.get('fileId')
            const customFilePath = url.searchParams.get('filePath')

            const handleSync = async (opts = {}) => {
              try {
                const result = await syncHelpdeskFromExcel(opts)
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify(result))
              } catch (se) {
                console.error('[API /api/sync-helpdesk Error]:', se)
                res.statusCode = 500
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: se.message }))
              }
            }

            if (req.method === 'POST') {
              let body = ''
              req.on('data', chunk => { body += chunk })
              req.on('end', () => {
                try {
                  const parsed = body ? JSON.parse(body) : {}
                  handleSync({
                    customFileUrl: parsed.fileUrl || customFileUrl,
                    customFileId: parsed.fileId || customFileId,
                    customFilePath: parsed.filePath || customFilePath
                  })
                } catch (pe) {
                  res.statusCode = 400
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({ error: pe.message }))
                }
              })
              return
            }

            handleSync({ customFileUrl, customFileId, customFilePath })
          } catch (err) {
            console.error('Helpdesk Sync Middleware Error:', err)
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: err.message }))
          }
        })

        server.middlewares.use('/api/sync-live', (req, res) => {
          try {
            delete require.cache[require.resolve('./scripts/serverSync.cjs')]
            const { getLiveExcelData } = require('./scripts/serverSync.cjs')
            const url = new URL(req.url, 'http://localhost:3000')
            const force = url.searchParams.get('force') === 'true'
            const customFileUrl = url.searchParams.get('fileUrl')
            const customFileId = url.searchParams.get('fileId')

            if (req.method === 'POST') {
              let body = ''
              req.on('data', chunk => { body += chunk })
              req.on('end', () => {
                try {
                  const parsed = body ? JSON.parse(body) : {}
                  const fUrl = parsed.fileUrl || customFileUrl
                  const fId = parsed.fileId || customFileId
                  const data = getLiveExcelData(true, { customFileUrl: fUrl, customFileId: fId })
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify(data))
                } catch (pe) {
                  res.statusCode = 400
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({ error: pe.message }))
                }
              })
              return
            }

            const data = getLiveExcelData(force, { customFileUrl, customFileId })
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(data))
          } catch (err) {
            console.error('Live Sync Error:', err)
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: err.message }))
          }
        })
      }
    }
  ],
  server: {
    port: 3000,
    open: false,
    watch: {
      ignored: ['**/.temp_browser_profile*/**', '**/node_modules/**', '**/.git/**']
    }
  }
})
