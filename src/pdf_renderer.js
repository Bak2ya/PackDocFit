import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

GlobalWorkerOptions.workerSrc = workerUrl

function assetBase(path) {
  return new URL(path, document.baseURI).href
}

export class PdfDisplayRenderer {
  constructor(getBytes) {
    this.getBytes = getBytes
    this.revision = 0
    this.loadedRevision = -1
    this.loadingRevision = -1
    this.loadingTask = null
    this.loadingPromise = null
    this.doc = null
  }

  invalidate() {
    this.revision += 1
    this.loadedRevision = -1
    this.loadingRevision = -1
    this.loadingPromise = null
    try { this.loadingTask?.destroy?.() } catch {}
    this.loadingTask = null
    if (this.doc) {
      try { this.doc.destroy?.() } catch {}
      this.doc = null
    }
  }

  async destroy() {
    this.invalidate()
  }

  async getDocument() {
    if (this.doc && this.loadedRevision === this.revision) return this.doc
    if (this.loadingPromise && this.loadingRevision === this.revision) return this.loadingPromise

    const revision = this.revision
    const bytes = this.getBytes()
    const data = bytes instanceof Uint8Array ? bytes.slice() : new Uint8Array(bytes)
    const task = getDocument({
      data,
      cMapUrl: assetBase('./pdfjs/cmaps/'),
      cMapPacked: true,
      standardFontDataUrl: assetBase('./pdfjs/standard_fonts/'),
      iccUrl: assetBase('./pdfjs/iccs/'),
      wasmUrl: assetBase('./pdfjs/wasm/'),
      useSystemFonts: true,
    })
    this.loadingTask = task
    this.loadingRevision = revision
    this.loadingPromise = task.promise.then(async doc => {
      if (revision !== this.revision) {
        try { await doc.destroy?.() } catch {}
        return this.getDocument()
      }
      if (this.doc && this.doc !== doc) {
        try { await this.doc.destroy?.() } catch {}
      }
      this.doc = doc
      this.loadedRevision = revision
      this.loadingPromise = null
      this.loadingTask = null
      return doc
    }).catch(error => {
      if (revision === this.revision) {
        this.loadingPromise = null
        this.loadingTask = null
      }
      throw error
    })
    return this.loadingPromise
  }

  async pageInfo(index) {
    const doc = await this.getDocument()
    const page = await doc.getPage(index + 1)
    const viewport = page.getViewport({ scale: 1 })
    return { page, width: viewport.width, height: viewport.height, rotation: viewport.rotation }
  }

  async renderToCanvas(index, canvas, { cssWidth = null, cssScale = null, maxDpr = 2 } = {}) {
    const { page, width, height } = await this.pageInfo(index)
    const scale = cssScale ?? (cssWidth ? cssWidth / Math.max(width, 1) : 1)
    const viewport = page.getViewport({ scale })
    const dpr = Math.max(1, Math.min(maxDpr, window.devicePixelRatio || 1))
    const pixelWidth = Math.max(1, Math.round(viewport.width * dpr))
    const pixelHeight = Math.max(1, Math.round(viewport.height * dpr))

    canvas.width = pixelWidth
    canvas.height = pixelHeight
    canvas.style.width = `${Math.max(1, Math.round(viewport.width))}px`
    canvas.style.height = `${Math.max(1, Math.round(viewport.height))}px`
    const ctx = canvas.getContext('2d', { alpha: false })
    ctx.save()
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, pixelWidth, pixelHeight)
    ctx.restore()

    const transform = dpr === 1 ? null : [dpr, 0, 0, dpr, 0, 0]
    await page.render({ canvasContext: ctx, viewport, transform, background: '#ffffff' }).promise
    return { width, height, cssWidth: viewport.width, cssHeight: viewport.height, scale }
  }

  async renderToBlob(index, { cssScale = 1.2, type = 'image/png', quality = 0.92 } = {}) {
    const canvas = document.createElement('canvas')
    await this.renderToCanvas(index, canvas, { cssScale, maxDpr: 1 })
    return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Could not create page image.')), type, quality))
  }
}
