import * as mupdf from 'mupdf'
import { tr } from './i18n.js'

const MM_TO_PT = 72 / 25.4
const IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/bmp', 'image/gif', 'image/tiff'])
const IMAGE_EXT = /\.(png|jpe?g|webp|bmp|gif|tiff?)$/i

const $ = (sel, root = document) => root.querySelector(sel)
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)]
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n))
const esc = (s = '') => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))

function icon(name) {
  const p = {
    new: '<path d="M5 3h9l5 5v13H5z"/><path d="M14 3v6h6"/>',
    open: '<path d="M3 7h6l2 2h10v10H3z"/><path d="M3 7V5h7l2 2"/>',
    save: '<path d="M5 3h12l3 3v15H4V3z"/><path d="M8 3v6h8V3"/><path d="M8 15h8v6H8z"/>',
    extract: '<path d="M5 3h14v18H5z"/><path d="M9 12h9"/><path d="m15 9 3 3-3 3"/>',
    trash: '<path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="m7 7 1 14h8l1-14"/>',
    rotate: '<path d="M20 7v5h-5"/><path d="M19 12a8 8 0 1 0-2 6"/>',
    fit: '<path d="M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4"/><path d="M8 12h8"/>',
    undo: '<path d="m9 7-5 5 5 5"/><path d="M4 12h9a7 7 0 0 1 7 7"/>',
    redo: '<path d="m15 7 5 5-5 5"/><path d="M20 12h-9a7 7 0 0 0-7 7"/>',
    continuous: '<path d="M5 3h14v5H5zM5 10h14v5H5zM5 17h14v4H5z"/>',
    single: '<rect x="5" y="3" width="14" height="18" rx="1"/>',
    select: '<path d="m5 3 6 15 2-6 6-2z"/>',
    highlight: '<path d="m4 17 8-13 5 3-8 13z"/><path d="M3 21h18"/>',
    rect: '<rect x="4" y="5" width="16" height="14" rx="1"/>',
    line: '<path d="M4 19 20 5"/>',
    arrow: '<path d="M4 19 20 5M13 5h7v7"/>',
    ink: '<path d="M4 18c5-9 4 3 8-5 4-8 4 6 8-4"/>',
    text: '<path d="M5 5h14M12 5v14M8 19h8"/>',
    copy: '<rect x="8" y="8" width="11" height="12" rx="1"/><path d="M5 16H4V4h11v1"/>',
    cut: '<circle cx="6" cy="7" r="3"/><circle cx="6" cy="17" r="3"/><path d="m8.5 8.5 10 8M8.5 15.5l10-8"/>',
    paste: '<path d="M9 5h6l1 2h3v14H5V7h3z"/><path d="M9 3h6v4H9z"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1l2-1-2-4-2 1.1a7 7 0 0 0-1.8-1L15 4h-6l-.1 2.1a7 7 0 0 0-1.8 1L5 6l-2 4 2 1a7 7 0 0 0 0 2l-2 1 2 4 2.1-1.1a7 7 0 0 0 1.8 1L9 20h6l.1-2.1a7 7 0 0 0 1.8-1L19 18l2-4-2-1a7 7 0 0 0 .1-1z"/>',
    compare: '<rect x="3" y="5" width="8" height="14"/><rect x="13" y="5" width="8" height="14"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>',
    github: '<path d="M7 8 6 4l4 2a8 8 0 0 1 4 0l4-2-1 4a6 6 0 0 1 2 4c0 4-3 7-7 7s-7-3-7-7a6 6 0 0 1 2-4Z"/><path d="M9 14h.01M15 14h.01M9 19v2M15 19v2"/>',
    windows: '<path d="M3 5.5 10.5 4v7H3zM12 3.7 21 2v9h-9zM3 12.5h7.5v7L3 18zM12 12.5h9V22l-9-1.7z"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.8 9a2.4 2.4 0 0 1 4.6 1c0 2-2.4 2.1-2.4 4M12 17h.01"/>',
    lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  }[name] || '<circle cx="12" cy="12" r="8"/>'
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`
}

function downloadBytes(bytes, filename, type = 'application/octet-stream') {
  const blob = new Blob([bytes], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function normalizeRect(a, b) {
  return [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1])]
}

function rectSize(r) { return [Math.abs(r[2]-r[0]), Math.abs(r[3]-r[1])] }
function hexToRgb(hex) {
  const s = hex.replace('#','')
  return [parseInt(s.slice(0,2),16)/255, parseInt(s.slice(2,4),16)/255, parseInt(s.slice(4,6),16)/255]
}
function rgbToHex(c = [0,0,0]) {
  const x = c.slice(0,3).map(v => clamp(Math.round(v*255),0,255).toString(16).padStart(2,'0')).join('')
  return `#${x}`
}
function pxRect(r, scale) { return [r[0]*scale, r[1]*scale, r[2]*scale, r[3]*scale] }
function pagePointFromEvent(ev, el, pageBounds) {
  const r = el.getBoundingClientRect()
  const x = clamp((ev.clientX-r.left)/r.width,0,1) * (pageBounds[2]-pageBounds[0]) + pageBounds[0]
  const y = clamp((ev.clientY-r.top)/r.height,0,1) * (pageBounds[3]-pageBounds[1]) + pageBounds[1]
  return [x,y]
}
function filenameStem(name='document.pdf') { return name.replace(/\.[^.]+$/, '') || 'document' }

async function sha256(bytes) {
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2,'0')).join('')
}

export class PackDocFitApp {
  constructor(root) {
    this.root = root
    this.project = null
    this.dirty = false
    this.pageMeta = []
    this.sourceSeq = 0
    this.selected = new Set()
    this.currentPage = 0
    this.anchorPage = null
    this.viewMode = 'continuous'
    this.tool = 'select'
    this.zoom = 1
    this.columnZoom = 1
    this.sourceHashes = new Map()
    this.clipboardBytes = null
    this.saveHandle = null
    this.outputPassword = ''
    this.saveOptionsConfirmed = false
    this.selectedAnnot = null
    this.dragDrawing = null
    this.dragAnnot = null
    this.renderToken = 0
    this.thumbToken = 0
    this.settings = this.loadSettings()
    this.language = this.settings.language || 'ko'
    this.settings.language = this.language
    this.zoom = this.settings.zoom
    this.viewMode = this.settings.viewMode
    this.annotStyle = this.settings.annotStyle
  }

  t(key, vars={}) { return tr(this.language, key, vars) }

  start() {
    this.buildShell()
    this.newProject(false)
    this.bindGlobalEvents()
    this.applyTheme()
    this.updateAll()
  }

  buildShell() {
    document.documentElement.lang = this.language
    this.root.innerHTML = `
      <div class="app-shell">
        <header class="topbar">
          <div class="brand" title="Pack / Doc / Fit → PDF">
            <img class="brand-app-icon" src="./assets/app_icon.png" alt="PackDocFit">
            <span class="brand-title">PackDocFit</span>
            <span class="brand-subtitle">${this.t('appSubtitle')}</span>
          </div>
          <nav class="menu-strip">
            <button class="menu-button" data-menu="file">${this.t('file')}</button>
            <button class="menu-button" data-menu="edit">${this.t('edit')}</button>
            <button class="menu-button" data-menu="page">${this.t('page')}</button>
            <button class="menu-button" data-menu="view">${this.t('view')}</button>
            <button class="menu-button" data-menu="compare">${this.t('compare')}</button>
            <button class="menu-button" data-menu="settings">${this.t('settings')}</button>
          </nav>
          <div class="top-actions">
            <div class="privacy-pill"><span class="privacy-dot"></span><span>${this.t('localOnly')}</span></div>
            <button class="tool-button" data-action="settings" title="${this.t('settings')}">${icon('settings')}</button>
            <button class="tool-button" data-action="about" title="${this.t('about')}">${icon('info')}</button>
          </div>
        </header>

        <div class="toolbar">
          <div class="tool-group">
            ${this.tb('new','new',`${this.t('newProject')} (Ctrl+N)`)}
            ${this.tb('open','open',`${this.t('addFiles')} (Ctrl+O)`)}
            ${this.tb('save','save',`${this.t('save')} (Ctrl+S)`, true)}
            ${this.tb('extract','extract',this.t('extract'), true)}
          </div>
          <div class="tool-sep"></div>
          <div class="tool-group">
            ${this.tb('delete','trash',this.t('deletePages'), true, 'danger')}
            ${this.tb('rotate','rotate',this.t('rotateRight'), true)}
            ${this.tb('fit','fit',this.t('fitResize'), true)}
          </div>
          <div class="tool-sep"></div>
          <div class="tool-group">
            ${this.tb('undo','undo',`${this.t('undo')} (Ctrl+Z)`, true)}
            ${this.tb('redo','redo',`${this.t('redo')} (Ctrl+Y)`, true)}
          </div>
          <div class="tool-sep"></div>
          <div class="tool-group">
            ${this.tb('continuous','continuous',this.t('continuous'))}
            ${this.tb('single','single',`${this.t('single')} (Ctrl+0)`)}
          </div>
          <div class="tool-sep"></div>
          <div class="tool-group annotation-tools">
            ${this.tb('select','select',this.t('selectMove'))}
            ${this.tb('highlight','highlight',this.t('highlight'))}
            ${this.tb('rectangle','rect',this.t('rectangle'))}
            ${this.tb('line','line',this.t('line'))}
            ${this.tb('arrow','arrow',this.t('arrow'))}
            ${this.tb('ink','ink',this.t('ink'))}
            ${this.tb('text','text',this.t('text'))}
          </div>
        </div>

        <main class="workspace" id="workspace">
          <aside class="sidebar" id="sidebar">
            <section class="source-pane">
              <div class="panel-heading"><span>${this.t('files')}</span><span class="count" id="fileCount">0</span></div>
              <div class="source-scroll"><div class="source-list" id="sourceList"></div></div>
            </section>
            <div class="splitter splitter-horizontal" id="sourcePageSplitter" role="separator" aria-orientation="horizontal" title="${this.t('splitterReset')}"></div>
            <section class="page-pane">
              <div class="panel-heading"><span>${this.t('pages')}</span><span class="count" id="pageCount">0</span></div>
              <div class="sidebar-scroll"><div class="page-list" id="pageList"></div></div>
            </section>
          </aside>
          <div class="splitter splitter-vertical" id="sidebarSplitter" role="separator" aria-orientation="vertical" title="${this.t('splitterReset')}"></div>
          <section class="stage" id="stage">
            <div class="stage-scroll" id="stageScroll"></div>
          </section>
        </main>
      </div>
      <input id="fileInput" type="file" hidden multiple accept="application/pdf,image/png,image/jpeg,image/webp,image/bmp,image/gif,image/tiff,.pdf,.png,.jpg,.jpeg,.webp,.bmp,.gif,.tif,.tiff" />
      <div class="toast-host" id="toastHost"></div>
    `

    this.els = {
      fileInput: $('#fileInput', this.root),
      workspace: $('#workspace', this.root),
      sidebar: $('#sidebar', this.root),
      sidebarSplitter: $('#sidebarSplitter', this.root),
      sourcePageSplitter: $('#sourcePageSplitter', this.root),
      sourceList: $('#sourceList', this.root),
      fileCount: $('#fileCount', this.root),
      pageList: $('#pageList', this.root),
      pageCount: $('#pageCount', this.root),
      stage: $('#stage', this.root),
      stageScroll: $('#stageScroll', this.root),
      toastHost: $('#toastHost', this.root),
    }

    $$('[data-action]', this.root).forEach(b => b.addEventListener('click', () => this.dispatch(b.dataset.action)))
    $$('[data-menu]', this.root).forEach(b => b.addEventListener('click', () => this.openMenu(b.dataset.menu, b)))
    this.els.fileInput.addEventListener('change', async () => {
      const files = [...this.els.fileInput.files]
      this.els.fileInput.value = ''
      await this.addFiles(files)
    })
    this.applyLayoutSettings()
    this.bindWorkspaceChrome()
  }

  applyLayoutSettings() {
    this.root.style.setProperty('--sidebar-w', `${clamp(Number(this.settings.sidebarWidth)||245, 180, 520)}px`)
    this.root.style.setProperty('--files-split', `${clamp(Number(this.settings.filesSplitPct)||24, 14, 78)}%`)
  }

  bindWorkspaceChrome() {
    this.els.stageScroll.addEventListener('wheel', e => {
      if (!e.ctrlKey) return
      e.preventDefault()
      const factor = e.deltaY < 0 ? 1.12 : 0.89
      if (this.viewMode === 'single') this.zoom = clamp(this.zoom*factor,.25,4)
      else this.columnZoom = clamp(this.columnZoom*factor,.35,2.2)
      this.settings.zoom = this.zoom
      this.saveSettings()
      this.renderStage()
    }, { passive:false })

    const finish = () => { document.body.classList.remove('resizing-layout'); this.saveSettings() }
    this.els.sidebarSplitter.addEventListener('pointerdown', e => {
      e.preventDefault(); document.body.classList.add('resizing-layout'); this.els.sidebarSplitter.setPointerCapture(e.pointerId)
      const move = ev => {
        const r=this.els.workspace.getBoundingClientRect(), max=Math.min(520, r.width*.55)
        this.settings.sidebarWidth=clamp(ev.clientX-r.left,180,max)
        this.applyLayoutSettings()
      }
      const up = ev => { this.els.sidebarSplitter.removeEventListener('pointermove',move); this.els.sidebarSplitter.removeEventListener('pointerup',up); finish(); this.renderStage() }
      this.els.sidebarSplitter.addEventListener('pointermove',move); this.els.sidebarSplitter.addEventListener('pointerup',up)
    })
    this.els.sourcePageSplitter.addEventListener('pointerdown', e => {
      e.preventDefault(); document.body.classList.add('resizing-layout'); this.els.sourcePageSplitter.setPointerCapture(e.pointerId)
      const move = ev => {
        const r=this.els.sidebar.getBoundingClientRect()
        this.settings.filesSplitPct=clamp(((ev.clientY-r.top)/Math.max(1,r.height))*100,14,78)
        this.applyLayoutSettings()
      }
      const up = () => { this.els.sourcePageSplitter.removeEventListener('pointermove',move); this.els.sourcePageSplitter.removeEventListener('pointerup',up); finish() }
      this.els.sourcePageSplitter.addEventListener('pointermove',move); this.els.sourcePageSplitter.addEventListener('pointerup',up)
    })
    this.els.sidebarSplitter.addEventListener('dblclick',()=>{this.settings.sidebarWidth=245;this.applyLayoutSettings();this.saveSettings();this.renderStage()})
    this.els.sourcePageSplitter.addEventListener('dblclick',()=>{this.settings.filesSplitPct=24;this.applyLayoutSettings();this.saveSettings()})
  }

  tb(action, iconName, title, disabled=false, cls='') {
    return `<button class="tool-button ${cls}" data-action="${action}" title="${title}" ${disabled?'disabled':''}>${icon(iconName)}</button>`
  }

  bindGlobalEvents() {
    window.addEventListener('keydown', e => this.onKeyDown(e))
    window.addEventListener('beforeunload', e => {
      if (this.isModified()) { e.preventDefault(); e.returnValue = '' }
    })

    let dragDepth = 0
    document.addEventListener('dragenter', e => {
      if (![...e.dataTransfer.types].includes('Files')) return
      e.preventDefault(); dragDepth++
      if (!$('#dropOverlay')) document.body.insertAdjacentHTML('beforeend',`<div class="drop-overlay" id="dropOverlay">${this.t('dropOverlay')}</div>`)
    })
    document.addEventListener('dragover', e => { if ([...e.dataTransfer.types].includes('Files')) e.preventDefault() })
    document.addEventListener('dragleave', () => { if (--dragDepth <= 0) { dragDepth=0; $('#dropOverlay')?.remove() } })
    document.addEventListener('drop', async e => {
      if (!e.dataTransfer.files?.length) return
      e.preventDefault(); dragDepth=0; $('#dropOverlay')?.remove()
      await this.addFiles([...e.dataTransfer.files])
    })

  }

  async dispatch(action) {
    try {
      const actions = {
        new: () => this.newProject(true),
        open: () => this.els.fileInput.click(),
        save: () => this.save(false),
        extract: () => this.extractSelected(),
        delete: () => this.deleteSelectedPages(),
        rotate: () => this.rotateSelected(90),
        fit: () => this.openFitDialog(),
        undo: () => this.undo(),
        redo: () => this.redo(),
        continuous: () => this.setViewMode('continuous'),
        single: () => this.setViewMode('single'),
        select: () => this.setTool('select'),
        highlight: () => this.setTool('highlight'),
        rectangle: () => this.setTool('rectangle'),
        line: () => this.setTool('line'),
        arrow: () => this.setTool('arrow'),
        ink: () => this.setTool('ink'),
        text: () => this.setTool('text'),
        settings: () => this.openSettings(),
        about: () => this.openAbout(),
        annotationProps: () => this.openAnnotationProperties(),
      }
      await actions[action]?.()
    } catch (err) { this.fail(err) }
  }

  newProject(confirmFirst=true) {
    if (confirmFirst && this.isModified() && !confirm(this.t('confirmNew'))) return
    try { this.project?.destroy?.() } catch {}
    this.project = new mupdf.PDFDocument()
    this.project.enableJournal()
    this.pageMeta = []
    this.sourceSeq = 0
    this.selected.clear()
    this.currentPage = 0
    this.anchorPage = null
    this.sourceHashes.clear()
    this.clipboardBytes = null
    this.saveHandle = null
    this.outputPassword = ''
    this.saveOptionsConfirmed = false
    this.selectedAnnot = null
    this.dirty = false
    this.setStatus('New project.')
    this.updateAll()
  }

  pageCount() { return this.project?.countPages?.() || 0 }
  isModified() { return this.dirty }
  currentIndices() { return [...this.selected].filter(i => i >= 0 && i < this.pageCount()).sort((a,b)=>a-b) }
  targets() { const x=this.currentIndices(); return x.length?x:(this.pageCount()?[this.currentPage]:[]) }

  async addFiles(files) {
    if (!files.length) return
    const accepted = files.filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf') || IMAGE_TYPES.has(f.type) || IMAGE_EXT.test(f.name))
    if (!accepted.length) return this.toast(this.t('noSupported'), true)
    this.setStatus(`Reading ${accepted.length} file${accepted.length>1?'s':''}…`)

    let added = 0
    for (const file of accepted) {
      const bytes = await file.arrayBuffer()
      const hash = await sha256(bytes)
      if (this.sourceHashes.has(hash)) {
        const prev = this.sourceHashes.get(hash)
        if (!confirm(this.t('duplicateFile',{name:file.name,prev}))) continue
      }
      this.sourceHashes.set(hash, file.name)
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) added += await this.addPdfBytes(bytes, file.name)
      else added += await this.addImageBytes(bytes, file)
    }
    if (added) {
      this.currentPage = Math.max(0, this.pageCount()-added)
      this.selected = new Set([this.currentPage])
      this.anchorPage = this.currentPage
      this.setStatus(`Added ${added} page${added===1?'':'s'}.`)
      await this.updateAll(true)
    } else this.updateButtons()
  }

  async addPdfBytes(bytes, name, insertAt=-1) {
    let doc
    try {
      doc = mupdf.Document.openDocument(bytes, 'application/pdf')
      const pdf = doc.asPDF()
      if (!pdf) throw new Error(this.t('notPdf'))
      if (pdf.needsPassword()) {
        let ok = false
        for (let tries=0; tries<3 && !ok; tries++) {
          const password = prompt(this.t('passwordRequired',{name}))
          if (password === null) return 0
          ok = pdf.authenticatePassword(password) !== 0
          if (!ok) alert(this.t('incorrectPassword'))
        }
        if (!ok) throw new Error(this.t('unlockFailed',{name}))
      }
      const n = doc.countPages()
      this.withOperation(`Add ${name}`, () => {
        const pos = insertAt < 0 ? -1 : insertAt
        for (let i=0; i<n; i++) this.project.graftPage(pos < 0 ? -1 : pos+i, pdf, i)
      })
      const sourceId=`src-${++this.sourceSeq}-${Date.now().toString(36)}`
      const meta = Array.from({length:n},(_,i)=>({ source:name, sourceId, sourcePage:i+1, modified:false }))
      if (insertAt < 0) this.pageMeta.push(...meta); else this.pageMeta.splice(insertAt,0,...meta)
      return n
    } finally { try { doc?.destroy?.() } catch {} }
  }

  async addImageBytes(bytes, file, insertAt=-1) {
    const buffer = new mupdf.Buffer(bytes)
    const image = new mupdf.Image(buffer)
    try {
      let pxW=image.getWidth(), pxH=image.getHeight()
      let xdpi=image.getXResolution?.() || 96, ydpi=image.getYResolution?.() || 96
      if (!(xdpi>10 && xdpi<2400)) xdpi=96
      if (!(ydpi>10 && ydpi<2400)) ydpi=96
      let w=pxW/xdpi*72, h=pxH/ydpi*72
      const ori=this.settings.imageOrientation
      if ((ori==='portrait' && w>h) || (ori==='landscape' && h>w)) [w,h]=[h,w]
      this.withOperation(`Add ${file.name}`, () => {
        const imgObj=this.project.addImage(image)
        const resources=this.project.addObject({ XObject:{ Im0:imgObj } })
        const pageObj=this.project.addPage([0,0,w,h],0,resources,`q ${w} 0 0 ${h} 0 0 cm /Im0 Do Q`)
        this.project.insertPage(insertAt<0?-1:insertAt,pageObj)
      })
      const m={source:file.name,sourceId:`src-${++this.sourceSeq}-${Date.now().toString(36)}`,sourcePage:1,modified:false}
      if (insertAt<0) this.pageMeta.push(m); else this.pageMeta.splice(insertAt,0,m)
      return 1
    } finally { try { image.destroy?.() } catch {}; try { buffer.destroy?.() } catch {} }
  }

  withOperation(label, fn) {
    this.project.beginOperation(label)
    try { const out=fn(); this.project.endOperation(); this.dirty=true; return out }
    catch (e) { try { this.project.abandonOperation() } catch {}; throw e }
  }

  async save(forceAs=false) {
    if (!this.pageCount()) return
    if (forceAs || !this.saveOptionsConfirmed) return this.openSaveDialog(forceAs)
    return this.performSave(forceAs)
  }

  async performSave(forceAs=false) {
    if (!this.pageCount()) return false
    const bytes = this.makePdfBytes()
    const suggested = `${filenameStem(this.pageMeta[0]?.source || 'PackDocFit')}_edited.pdf`
    if (!forceAs && this.saveHandle) {
      const w=await this.saveHandle.createWritable(); await w.write(bytes); await w.close()
      this.markSaved(); this.setStatus('Saved.'); return true
    }
    if ('showSaveFilePicker' in window) {
      try {
        const handle=await window.showSaveFilePicker({ suggestedName:suggested, types:[{description:'PDF document',accept:{'application/pdf':['.pdf']}}] })
        const w=await handle.createWritable(); await w.write(bytes); await w.close(); this.saveHandle=handle
        this.markSaved(); this.setStatus('Saved.'); return true
      } catch (e) { if (e?.name==='AbortError') return false; throw e }
    }
    downloadBytes(bytes,suggested,'application/pdf')
    this.markSaved(); this.setStatus('PDF downloaded.'); return true
  }

  openSaveDialog(forceAs=false) {
    const protectedNow=Boolean(this.outputPassword)
    this.modal(this.t('savePdfTitle'),`
      <div class="save-options">
        <section class="settings-group save-security-group">
          <h3>${this.t('pdfSecurity')}</h3>
          <div class="settings-row settings-row-help">
            <label for="saveProtect">${this.t('passwordProtection')}</label>
            <div class="settings-control settings-toggle-control"><label class="settings-check"><input id="saveProtect" type="checkbox" ${protectedNow?'checked':''}><span>${this.t('setPasswordForPdf')}</span></label></div>
            <p class="settings-help">${this.t('saveSecurityHelp')}</p>
          </div>
          <div id="savePasswordFields" ${protectedNow?'':'hidden'}>
            <div class="settings-row"><label for="savePassword">${this.t('password')}</label><div class="settings-control settings-value-standard"><input id="savePassword" type="password" value="${esc(this.outputPassword)}" autocomplete="new-password"></div></div>
            <div class="settings-row"><label for="savePasswordConfirm">${this.t('confirmPassword')}</label><div class="settings-control settings-value-standard"><input id="savePasswordConfirm" type="password" value="${esc(this.outputPassword)}" autocomplete="new-password"></div></div>
          </div>
        </section>
      </div>`,
      [{label:this.t('cancel')},{label:forceAs?this.t('saveAsAction'):this.t('saveButton'),primary:true,onClick:async m=>{
        const protect=$('#saveProtect',m).checked
        const pw=protect?$('#savePassword',m).value:''
        const confirmPw=protect?$('#savePasswordConfirm',m).value:''
        if(protect && !pw){this.toast(this.t('passwordEmpty'),true);return false}
        if(protect && pw!==confirmPw){this.toast(this.t('passwordMismatch'),true);return false}
        this.outputPassword=pw
        this.saveOptionsConfirmed=true
        const ok=await this.performSave(forceAs)
        return ok
      }}],m=>{
        $('.modal',m)?.classList.add('save-modal')
        const toggle=()=>{$('#savePasswordFields',m).hidden=!$('#saveProtect',m).checked}
        $('#saveProtect',m).addEventListener('change',toggle);toggle()
      })
  }

  makePdfBytes({ decrypt=false }={}) {
    const opts = this.outputPassword && !decrypt
      ? JSON.stringify({ garbage:'deduplicate', compress:true, appearance:'yes', encrypt:'aes-256', 'user-password':this.outputPassword, 'owner-password':this.outputPassword })
      : JSON.stringify({ garbage:'deduplicate', compress:true, appearance:'yes', encrypt:'none' })
    const b=this.project.saveToBuffer(opts)
    try { return new Uint8Array(b.asUint8Array()) } finally { try { b.destroy?.() } catch {} }
  }

  markSaved() { this.dirty=false; this.pageMeta.forEach(x=>x.modified=false); this.updateAll(false) }

  async extractSelected() {
    const indices=this.targets(); if (!indices.length) return
    const out=new mupdf.PDFDocument()
    try {
      indices.forEach(i=>out.graftPage(-1,this.project,i))
      const b=out.saveToBuffer('garbage=deduplicate,compress=yes,appearance=yes')
      const bytes=new Uint8Array(b.asUint8Array()); b.destroy?.()
      downloadBytes(bytes,`PackDocFit_extract_${indices.map(i=>i+1).join('-')}.pdf`,'application/pdf')
      this.setStatus(`Extracted ${indices.length} page${indices.length>1?'s':''}.`)
    } finally { out.destroy?.() }
  }

  async copyPages(cut=false) {
    const indices=this.targets(); if (!indices.length) return
    const out=new mupdf.PDFDocument()
    try {
      indices.forEach(i=>out.graftPage(-1,this.project,i))
      const b=out.saveToBuffer('garbage=deduplicate,compress=yes,appearance=yes')
      this.clipboardBytes=new Uint8Array(b.asUint8Array()); b.destroy?.()
    } finally { out.destroy?.() }
    if (cut) this.deleteSelectedPages()
    else this.setStatus(`Copied ${indices.length} page${indices.length>1?'s':''}.`)
  }

  async pastePages() {
    if (!this.clipboardBytes) return
    const at = this.targets().length ? Math.max(...this.targets())+1 : this.pageCount()
    const before=this.pageCount()
    await this.addPdfBytes(this.clipboardBytes.buffer.slice(0), 'Pasted pages', at)
    const n=this.pageCount()-before
    for (let i=at;i<at+n;i++) this.pageMeta[i].modified=true
    this.selected=new Set(Array.from({length:n},(_,i)=>at+i)); this.currentPage=at; this.anchorPage=at
    await this.updateAll(true)
  }

  deleteSelectedPages() {
    const indices=this.targets(); if (!indices.length) return
    if (indices.length===this.pageCount() && !confirm(this.t('deleteAllConfirm'))) return
    this.withOperation('Delete pages',()=>{ [...indices].sort((a,b)=>b-a).forEach(i=>this.project.deletePage(i)) })
    ;[...indices].sort((a,b)=>b-a).forEach(i=>this.pageMeta.splice(i,1))
    this.currentPage=clamp(Math.min(...indices),0,Math.max(0,this.pageCount()-1))
    this.selected=this.pageCount()?new Set([this.currentPage]):new Set(); this.anchorPage=this.currentPage
    this.selectedAnnot=null
    this.setStatus(`Deleted ${indices.length} page${indices.length>1?'s':''}.`)
    this.updateAll(true)
  }

  reorderPage(from,to) {
    if (from===to || from<0 || to<0 || from>=this.pageCount() || to>=this.pageCount()) return
    const order=Array.from({length:this.pageCount()},(_,i)=>i)
    const [moved]=order.splice(from,1); order.splice(to,0,moved)
    this.withOperation('Reorder pages',()=>this.project.rearrangePages(order))
    const [meta]=this.pageMeta.splice(from,1); this.pageMeta.splice(to,0,meta)
    this.pageMeta.forEach((m,i)=>{ if(i===to) m.modified=true })
    this.currentPage=to; this.selected=new Set([to]); this.anchorPage=to
    this.updateAll(true)
  }

  rotateSelected(degrees) {
    const indices=this.targets(); if(!indices.length)return
    this.withOperation('Rotate pages',()=>{
      for(const i of indices){
        const obj=this.project.findPage(i)
        let current=0
        try { current=(obj.Rotate?.asNumber?.() ?? Number(obj.Rotate)) || 0 } catch {}
        obj.Rotate=((current+degrees)%360+360)%360
      }
    })
    indices.forEach(i=>this.pageMeta[i].modified=true)
    this.setStatus(`Rotated ${indices.length} page${indices.length>1?'s':''}.`)
    this.updateAll(true)
  }

  fitPages(targetMode, value, paper=null, fitMode='contain') {
    const indices=this.targets(); if(!indices.length)return
    this.withOperation('Resize pages',()=>{
      for(const i of indices){
        const page=this.project.loadPage(i)
        let bounds
        try { bounds=page.getBounds() } finally { page.destroy?.() }
        const sw=bounds[2]-bounds[0], sh=bounds[3]-bounds[1]
        let tw,th,scale,tx=0,ty=0
        if(targetMode==='width') { tw=value*MM_TO_PT; scale=tw/sw; th=sh*scale }
        else {
          ;[tw,th]=paper.map(x=>x*MM_TO_PT)
          const sContain=Math.min(tw/sw,th/sh), sCover=Math.max(tw/sw,th/sh)
          scale=fitMode==='cover'?sCover:sContain
          tx=(tw-sw*scale)/2; ty=(th-sh*scale)/2
        }
        this.transformPage(i, scale, tx, ty, tw, th)
        this.pageMeta[i].modified=true
      }
    })
    this.setStatus(`Resized ${indices.length} page${indices.length>1?'s':''}.`)
    this.updateAll(true)
  }

  transformPage(index, scale, tx, ty, targetW, targetH) {
    const pageObj=this.project.findPage(index)
    const prefix=this.project.addStream(`q ${scale} 0 0 ${scale} ${tx} ${ty} cm\n`)
    const suffix=this.project.addStream('Q\n')
    const old=pageObj.Contents
    const arr=this.project.newArray()
    let at=0
    arr.put(at++,prefix)
    if(old){
      try {
        if(old.isArray?.()) { for(let i=0;i<old.length;i++) arr.put(at++,old.get(i)) }
        else arr.put(at++,old)
      } catch { arr.put(at++,old) }
    }
    arr.put(at,suffix)
    pageObj.Contents=arr
    pageObj.MediaBox=[0,0,targetW,targetH]
    pageObj.CropBox=[0,0,targetW,targetH]

    const p=this.project.loadPage(index)
    try {
      for(const a of p.getAnnotations()) this.transformAnnotation(a,scale,tx,ty)
      p.update()
    } finally { p.destroy?.() }
  }

  transformAnnotation(a,s,tx,ty) {
    const pt=p=>[p[0]*s+tx,p[1]*s+ty]
    try {
      if(a.hasRect?.()) { const r=a.getRect(); a.setRect([r[0]*s+tx,r[1]*s+ty,r[2]*s+tx,r[3]*s+ty]) }
      if(a.hasLine?.()) { const [p1,p2]=a.getLine(); a.setLine(pt(p1),pt(p2)) }
      if(a.hasQuadPoints?.()) a.setQuadPoints(a.getQuadPoints().map(q=>[q[0]*s+tx,q[1]*s+ty,q[2]*s+tx,q[3]*s+ty,q[4]*s+tx,q[5]*s+ty,q[6]*s+tx,q[7]*s+ty]))
      if(a.hasInkList?.()) a.setInkList(a.getInkList().map(st=>st.map(pt)))
      if(a.hasVertices?.()) a.setVertices(a.getVertices().map(pt))
      if(a.hasBorder?.()) a.setBorderWidth(a.getBorderWidth()*s)
      a.update()
    } catch {}
  }

  undo() {
    if(!this.project.canUndo())return
    this.project.undo(); this.selectedAnnot=null; this.dirty=true
    this.pageMeta = Array.from({length:this.pageCount()},(_,i)=>this.pageMeta[i]||{source:'Undo restored',sourcePage:i+1,modified:true})
    this.pageMeta.forEach(m=>m.modified=true)
    this.currentPage=clamp(this.currentPage,0,Math.max(0,this.pageCount()-1)); this.selected=new Set(this.pageCount()?[this.currentPage]:[])
    this.updateAll(true)
  }
  redo() {
    if(!this.project.canRedo())return
    this.project.redo(); this.selectedAnnot=null; this.dirty=true
    this.pageMeta = Array.from({length:this.pageCount()},(_,i)=>this.pageMeta[i]||{source:'Redo restored',sourcePage:i+1,modified:true})
    this.pageMeta.forEach(m=>m.modified=true)
    this.currentPage=clamp(this.currentPage,0,Math.max(0,this.pageCount()-1)); this.selected=new Set(this.pageCount()?[this.currentPage]:[])
    this.updateAll(true)
  }

  setViewMode(mode) {
    if(mode==='single' && this.selected.size>1) return this.openCompare(this.settings.compareMode||'horizontal')
    this.viewMode=mode; this.settings.viewMode=mode; this.saveSettings(); this.selectedAnnot=null; this.renderStage(); this.updateButtons(); this.renderInspector()
  }
  setTool(tool) {
    this.tool=tool
    if(tool!=='select') this.viewMode='single'
    this.selectedAnnot=null
    this.renderStage(); this.updateButtons(); this.renderInspector()
  }

  selectPage(index,ev={}) {
    if(ev.shiftKey && this.anchorPage!=null) {
      const [a,b]=[this.anchorPage,index].sort((x,y)=>x-y); this.selected=new Set(Array.from({length:b-a+1},(_,k)=>a+k))
    } else if(ev.ctrlKey || ev.metaKey) {
      if(this.selected.has(index)) this.selected.delete(index); else this.selected.add(index)
      this.anchorPage=index
    } else { this.selected=new Set([index]); this.anchorPage=index }
    this.currentPage=index; this.selectedAnnot=null
    this.renderSidebar(); this.renderInspector(); this.updateButtons(); this.updateStatusbar()
    if(this.viewMode==='single') this.renderStage()
  }

  async updateAll(full=false) {
    this.renderSidebar()
    await this.renderStage()
    this.renderInspector()
    this.updateButtons()
    this.updateStatusbar()
    if(full) this.renderSidebar()
  }

  updateButtons() {
    const has=this.pageCount()>0, sel=this.targets().length>0
    const set=(a,dis)=>{ const b=$(`[data-action="${a}"]`,this.root); if(b)b.disabled=dis }
    ;['save'].forEach(a=>set(a,!has)); ['extract','delete','rotate','fit'].forEach(a=>set(a,!sel))
    set('undo',!this.project.canUndo()); set('redo',!this.project.canRedo())
    $$('[data-action="continuous"],[data-action="single"],.annotation-tools [data-action]',this.root).forEach(b=>b.classList.remove('active'))
    $(`[data-action="${this.viewMode}"]`,this.root)?.classList.add('active')
    $(`[data-action="${this.tool}"]`,this.root)?.classList.add('active')
  }

  updateStatusbar() {
    const n=this.pageCount(); if(this.els.pageCount)this.els.pageCount.textContent=n
  }
  setStatus(s){ this.lastStatus=s }
  toast(s,error=false){
    const e=document.createElement('div'); e.className=`toast${error?' error':''}`; e.textContent=s; this.els.toastHost.append(e); setTimeout(()=>e.remove(),3600)
  }
  fail(err){ console.error(err); const msg=err?.message||String(err); this.setStatus(`Error: ${msg}`); this.toast(msg,true) }

  sourceGroups() {
    const order=[]; const map=new Map()
    this.pageMeta.forEach((m,i)=>{
      const id=m.sourceId || `legacy-${m.source || 'document'}`
      if(!map.has(id)){const g={id,name:m.source||'Document',pages:[]};map.set(id,g);order.push(g)}
      map.get(id).pages.push(i)
    })
    return order
  }

  renderSourceList() {
    const groups=this.sourceGroups(); if(this.els.fileCount)this.els.fileCount.textContent=groups.length
    if(!this.els.sourceList)return
    if(!groups.length){this.els.sourceList.innerHTML=`<div class="source-empty">${this.t('addFilesStart')}</div>`;return}
    this.els.sourceList.innerHTML=groups.map(g=>`<div class="source-item" data-source-id="${esc(g.id)}" draggable="true" title="${esc(g.name)}"><div class="source-icon">PDF</div><div class="source-info"><strong>${esc(g.name)}</strong><span>${g.pages.length}p</span></div><button class="source-remove" title="${esc(this.t('removeFile'))}" aria-label="${esc(this.t('removeFile'))}">×</button></div>`).join('')
    $$('.source-item',this.els.sourceList).forEach(el=>{
      const id=el.dataset.sourceId
      el.addEventListener('click',e=>{if(e.target.closest('.source-remove'))return;const g=this.sourceGroups().find(x=>x.id===id);if(g?.pages.length){this.currentPage=g.pages[0];this.selected=new Set(g.pages);this.anchorPage=g.pages[0];this.updateAll()}})
      el.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/source-id',id);e.dataTransfer.effectAllowed='move'})
      el.addEventListener('dragover',e=>{e.preventDefault();el.classList.add('drag-over')})
      el.addEventListener('dragleave',()=>el.classList.remove('drag-over'))
      el.addEventListener('drop',e=>{e.preventDefault();el.classList.remove('drag-over');const from=e.dataTransfer.getData('text/source-id');if(from)this.reorderSourceGroup(from,id)})
      $('.source-remove',el).addEventListener('click',e=>{e.stopPropagation();this.removeSourceGroup(id)})
    })
  }

  reorderSourceGroup(fromId,toId) {
    if(!fromId||fromId===toId)return
    const groups=this.sourceGroups(), from=groups.findIndex(g=>g.id===fromId), to=groups.findIndex(g=>g.id===toId)
    if(from<0||to<0)return
    const reordered=[...groups], [moved]=reordered.splice(from,1);reordered.splice(to,0,moved)
    const order=reordered.flatMap(g=>g.pages)
    const oldMeta=[...this.pageMeta]
    this.withOperation('Reorder files',()=>this.project.rearrangePages(order))
    this.pageMeta=order.map(i=>oldMeta[i])
    const first=this.sourceGroups().find(g=>g.id===fromId)?.pages?.[0] ?? 0
    this.currentPage=first;this.selected=new Set(this.sourceGroups().find(g=>g.id===fromId)?.pages||[first]);this.anchorPage=first
    this.setStatus('File order updated.');this.updateAll(true)
  }

  removeSourceGroup(id) {
    const g=this.sourceGroups().find(x=>x.id===id);if(!g)return
    if(!confirm(this.t('removeFileConfirm',{name:g.name,count:g.pages.length})))return
    this.withOperation('Remove file',()=>[...g.pages].sort((a,b)=>b-a).forEach(i=>this.project.deletePage(i)))
    ;[...g.pages].sort((a,b)=>b-a).forEach(i=>this.pageMeta.splice(i,1))
    this.currentPage=clamp(this.currentPage,0,Math.max(0,this.pageCount()-1));this.selected=this.pageCount()?new Set([this.currentPage]):new Set();this.anchorPage=this.currentPage
    this.setStatus(`Removed ${g.name}.`);this.updateAll(true)
  }

  renderSidebar() {
    const token=++this.thumbToken, n=this.pageCount(); this.els.pageCount.textContent=n
    this.renderSourceList()
    if(!n){ this.els.pageList.innerHTML=''; return }
    this.els.pageList.innerHTML=Array.from({length:n},(_,i)=>{
      const m=this.pageMeta[i]||{source:'Document',sourcePage:i+1,modified:false}
      return `<div class="page-item ${this.selected.has(i)?'selected':''} ${i===this.currentPage?'current':''}" data-page="${i}" draggable="true">
        <div class="thumb-wrap"><span>${i+1}</span></div>
        <div class="page-meta"><div class="page-num">${this.t('pageLabel')} ${i+1}${m.modified?`<span class="modified-dot" title="${esc(this.t('modified'))}"></span>`:''}</div><div class="page-source">${esc(m.source)}</div><div class="page-size" data-size="${i}"></div></div>
      </div>`
    }).join('')

    $$('.page-item',this.els.pageList).forEach(el=>{
      const i=+el.dataset.page
      el.addEventListener('click',e=>this.selectPage(i,e))
      el.addEventListener('dragstart',e=>{ e.dataTransfer.setData('text/page-index',String(i)); e.dataTransfer.effectAllowed='move' })
      el.addEventListener('dragover',e=>{e.preventDefault();el.classList.add('drag-over')})
      el.addEventListener('dragleave',()=>el.classList.remove('drag-over'))
      el.addEventListener('drop',e=>{e.preventDefault();el.classList.remove('drag-over');const from=Number(e.dataTransfer.getData('text/page-index')); if(Number.isInteger(from))this.reorderPage(from,i)})
    })
    this.renderThumbnails(token)
  }

  async renderThumbnails(token) {
    for(let i=0;i<this.pageCount();i++){
      if(token!==this.thumbToken)return
      const el=$(`.page-item[data-page="${i}"] .thumb-wrap`,this.els.pageList); if(!el)continue
      let page,pix
      try{
        page=this.project.loadPage(i); const b=page.getBounds(); const w=b[2]-b[0],h=b[3]-b[1]; const scale=Math.min(42/w,50/h)
        pix=page.toPixmap(mupdf.Matrix.scale(scale,scale),mupdf.ColorSpace.DeviceRGB,false,true)
        const buf=pix.asPNG(), bytes=new Uint8Array(buf.asUint8Array()); buf.destroy?.()
        const url=URL.createObjectURL(new Blob([bytes],{type:'image/png'})); el.innerHTML=`<img src="${url}" alt="${esc(this.t('pageLabel'))} ${i+1}">`; el.querySelector('img').onload=()=>URL.revokeObjectURL(url)
        const mmW=w/MM_TO_PT, mmH=h/MM_TO_PT; $(`[data-size="${i}"]`,this.els.pageList).textContent=`${mmW.toFixed(0)} × ${mmH.toFixed(0)} mm`
      }catch(e){console.warn('thumbnail',e)}finally{try{pix?.destroy?.()}catch{};try{page?.destroy?.()}catch{}}
      if(i%5===4) await new Promise(r=>requestAnimationFrame(r))
    }
  }

  async renderStage() {
    const token=++this.renderToken
    const n=this.pageCount()
    if(!n){
      this.els.stageScroll.innerHTML=`<div class="empty-state"><div class="empty-card"><strong>${this.t('dropTitle')}</strong>${this.t('dropBody')}<div class="drop-note">${this.t('dropNote')}</div></div></div>`
      return
    }
    if(this.viewMode==='single') await this.renderSingle(token)
    else await this.renderContinuous(token)
  }

  async renderContinuous(token) {
    const base=0.72*this.columnZoom
    const available=Math.max(300,this.els.stage.clientWidth-60)
    let typical=560*base, cols=clamp(Math.floor((available+18)/(typical+18)),1,6)
    this.els.stageScroll.innerHTML=`<div class="continuous-view" style="--cols:${cols}" id="continuous"></div>`
    const wrap=$('#continuous',this.els.stageScroll)
    for(let i=0;i<this.pageCount();i++){
      if(token!==this.renderToken)return
      let page,pix
      try{
        page=this.project.loadPage(i); const b=page.getBounds(); const w=b[2]-b[0]
        const scale=Math.min(base,Math.max(.22,(available/cols-28)/w))
        pix=page.toPixmap(mupdf.Matrix.scale(scale,scale),mupdf.ColorSpace.DeviceRGB,false,true)
        const buf=pix.asPNG(), bytes=new Uint8Array(buf.asUint8Array()); buf.destroy?.(); const url=URL.createObjectURL(new Blob([bytes],{type:'image/png'}))
        const card=document.createElement('div'); card.className=`page-card ${this.selected.has(i)?'selected':''}`; card.dataset.page=i
        card.innerHTML=`<img src="${url}" draggable="false" alt="${esc(this.t('pageLabel'))} ${i+1}"><div class="page-card-caption">${i+1} · ${esc(this.pageMeta[i]?.source||'')}</div>`
        card.querySelector('img').onload=()=>URL.revokeObjectURL(url)
        card.addEventListener('click',e=>this.selectPage(i,e)); wrap.append(card)
      }catch(e){console.warn('render page',i,e)}finally{try{pix?.destroy?.()}catch{};try{page?.destroy?.()}catch{}}
      if(i%3===2) await new Promise(r=>requestAnimationFrame(r))
    }
  }

  async renderSingle(token) {
    this.currentPage=clamp(this.currentPage,0,this.pageCount()-1)
    let page,pix
    try{
      page=this.project.loadPage(this.currentPage); const bounds=page.getBounds(); const pw=bounds[2]-bounds[0], ph=bounds[3]-bounds[1]
      const availW=Math.max(220,this.els.stage.clientWidth-90), availH=Math.max(220,this.els.stage.clientHeight-80)
      const fit=Math.min(availW/pw,availH/ph); const scale=clamp(fit*this.zoom,.2,4)
      pix=page.toPixmap(mupdf.Matrix.scale(scale,scale),mupdf.ColorSpace.DeviceRGB,false,true)
      const png=pix.asPNG(), bytes=new Uint8Array(png.asUint8Array()); png.destroy?.(); const url=URL.createObjectURL(new Blob([bytes],{type:'image/png'}))
      if(token!==this.renderToken){URL.revokeObjectURL(url);return}
      const width=Math.round(pw*scale),height=Math.round(ph*scale)
      this.els.stageScroll.innerHTML=`<div class="single-wrap"><div class="single-page" id="singlePage" style="width:${width}px;height:${height}px">
        <img id="singleImage" src="${url}" draggable="false" alt="Page ${this.currentPage+1}">
        <div class="text-layer ${this.tool==='select'?'enabled':''}" id="textLayer"></div>
        <div class="annotation-layer" id="annotationLayer"></div>
        <div class="interaction-layer" id="interactionLayer"></div>
      </div></div>`
      $('#singleImage',this.els.stageScroll).onload=()=>URL.revokeObjectURL(url)
      await this.renderTextLayer(page,bounds,scale)
      this.renderAnnotationLayer(page,bounds,scale)
      this.bindSingleInteraction(page,bounds,scale)
    } finally { try{pix?.destroy?.()}catch{}; try{page?.destroy?.()}catch{} }
  }

  async renderTextLayer(page,bounds,scale) {
    const layer=$('#textLayer',this.els.stageScroll); if(!layer)return
    let st
    try{
      st=page.toStructuredText('preserve-spans,preserve-whitespace')
      const data=JSON.parse(st.asJSON())
      for(const block of data.blocks||[]) if(block.type==='text') for(const line of block.lines||[]) {
        const b=line.bbox; if(!b)continue
        const x=(b.x??b[0]??0)*scale, y=(b.y??b[1]??0)*scale, w=(b.w??((b[2]||0)-(b[0]||0)))*scale, h=(b.h??((b[3]||0)-(b[1]||0)))*scale
        const span=document.createElement('span'); span.className='text-run'; span.textContent=line.text||''; Object.assign(span.style,{left:`${x}px`,top:`${y}px`,width:`${Math.max(w,1)}px`,height:`${Math.max(h,1)}px`,fontSize:`${Math.max(h*.8,6)}px`}); layer.append(span)
      }
    } catch(e){ console.warn('text layer',e) } finally { try{st?.destroy?.()}catch{} }
  }

  renderAnnotationLayer(page,bounds,scale) {
    const layer=$('#annotationLayer',this.els.stageScroll), interaction=$('#interactionLayer',this.els.stageScroll); if(!layer||!interaction)return
    let annots=[]; try{annots=page.getAnnotations()}catch{}
    annots.forEach((a,idx)=>{
      let r; try{r=a.getBounds()}catch{return}
      const [x0,y0,x1,y1]=pxRect(r,scale), box=document.createElement('div')
      box.className=`annot-box ${this.selectedAnnot?.pageIndex===this.currentPage&&this.selectedAnnot?.annotIndex===idx?'selected':''}`
      Object.assign(box.style,{left:`${x0}px`,top:`${y0}px`,width:`${Math.max(4,x1-x0)}px`,height:`${Math.max(4,y1-y0)}px`}); box.dataset.annot=idx; interaction.append(box)
      box.addEventListener('pointerdown',e=>this.beginAnnotDrag(e,idx,r,bounds,scale))
      box.addEventListener('click',e=>{e.stopPropagation();this.selectedAnnot={pageIndex:this.currentPage,annotIndex:idx};this.renderInspector();this.renderStage()});box.addEventListener('dblclick',e=>{e.stopPropagation();this.selectedAnnot={pageIndex:this.currentPage,annotIndex:idx};this.openAnnotationProperties()})
      if(this.selectedAnnot?.pageIndex===this.currentPage&&this.selectedAnnot?.annotIndex===idx && a.hasRect?.()) {
        for(const c of ['nw','ne','sw','se']){const h=document.createElement('span');h.className=`annot-handle ${c}`;h.dataset.resize=c;box.append(h);h.addEventListener('pointerdown',e=>this.beginAnnotResize(e,idx,r,bounds,scale,c))}
      }
    })
  }

  bindSingleInteraction(page,bounds,scale) {
    const layer=$('#interactionLayer',this.els.stageScroll); if(!layer)return
    layer.style.cursor=this.tool==='select'?'default':this.tool==='text'?'text':'crosshair'
    layer.addEventListener('pointerdown',e=>{
      if(e.target!==layer || this.tool==='select') return
      e.preventDefault(); layer.setPointerCapture(e.pointerId)
      const start=pagePointFromEvent(e,layer,bounds)
      this.dragDrawing={pointerId:e.pointerId,start,last:start,points:[start],bounds,scale,tool:this.tool}
      this.showDrawPreview()
    })
    layer.addEventListener('pointermove',e=>{
      if(!this.dragDrawing||this.dragDrawing.pointerId!==e.pointerId)return
      const p=pagePointFromEvent(e,layer,bounds);this.dragDrawing.last=p;this.dragDrawing.points.push(p);this.showDrawPreview()
    })
    layer.addEventListener('pointerup',async e=>{
      if(!this.dragDrawing||this.dragDrawing.pointerId!==e.pointerId)return
      const d=this.dragDrawing;this.dragDrawing=null; await this.commitDrawing(d); this.renderInspector(); await this.renderStage(); this.renderSidebar();this.updateButtons()
    })
    layer.addEventListener('click',()=>{ if(this.tool==='select'&&this.selectedAnnot){this.selectedAnnot=null;this.renderInspector();this.renderStage()} })
  }

  showDrawPreview() {
    const layer=$('#interactionLayer',this.els.stageScroll), d=this.dragDrawing; if(!layer||!d)return
    $('.draw-preview',layer)?.remove(); $('.ink-preview',layer)?.remove()
    if(d.tool==='ink'){
      const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.classList.add('ink-preview');svg.setAttribute('viewBox',`0 0 ${layer.clientWidth} ${layer.clientHeight}`)
      const pl=document.createElementNS('http://www.w3.org/2000/svg','polyline'); const pts=d.points.map(p=>`${(p[0]-d.bounds[0])*d.scale},${(p[1]-d.bounds[1])*d.scale}`).join(' ');pl.setAttribute('points',pts);pl.setAttribute('fill','none');pl.setAttribute('stroke',this.annotStyle.color);pl.setAttribute('stroke-width',String(this.annotStyle.width));svg.append(pl);layer.append(svg);return
    }
    const r=normalizeRect(d.start,d.last), pr=pxRect(r,d.scale), div=document.createElement('div');div.className='draw-preview';Object.assign(div.style,{left:`${pr[0]}px`,top:`${pr[1]}px`,width:`${Math.max(2,pr[2]-pr[0])}px`,height:`${Math.max(2,pr[3]-pr[1])}px`});layer.append(div)
  }

  async commitDrawing(d) {
    const page=this.project.loadPage(this.currentPage)
    try{
      const r=normalizeRect(d.start,d.last), [rw,rh]=rectSize(r)
      if(d.tool!=='ink' && d.tool!=='text' && (rw<2||rh<2))return
      this.withOperation(`Add ${d.tool} annotation`,()=>{
        const c=hexToRgb(this.annotStyle.color); let a
        if(d.tool==='highlight'){
          a=page.createAnnotation('Highlight'); let quads=[]
          if(this.annotStyle.highlightTextOnly){
            let st; try{st=page.toStructuredText('preserve-spans');const data=JSON.parse(st.asJSON());for(const b of data.blocks||[])if(b.type==='text')for(const l of b.lines||[]){const q=l.bbox;if(!q)continue;const x=q.x??q[0],y=q.y??q[1],w=q.w??(q[2]-q[0]),h=q.h??(q[3]-q[1]);if(x<r[2]&&x+w>r[0]&&y<r[3]&&y+h>r[1])quads.push([x,y,x+w,y,x+w,y+h,x,y+h])}}finally{st?.destroy?.()}}
          if(!quads.length)quads=[[r[0],r[1],r[2],r[1],r[2],r[3],r[0],r[3]]]
          a.setQuadPoints(quads);a.setColor(c);a.setOpacity(this.annotStyle.opacity)
        } else if(d.tool==='rectangle'){
          a=page.createAnnotation('Square');a.setRect(r);a.setColor(c);a.setBorderWidth(this.annotStyle.width);a.setOpacity(this.annotStyle.opacity)
        } else if(d.tool==='line'||d.tool==='arrow'){
          a=page.createAnnotation('Line');a.setLine(d.start,d.last);a.setColor(c);a.setBorderWidth(this.annotStyle.width);a.setOpacity(this.annotStyle.opacity);a.setLineEndingStyles('None',d.tool==='arrow'?'OpenArrow':'None')
        } else if(d.tool==='ink'){
          if(d.points.length<2)return;a=page.createAnnotation('Ink');a.setInkList([d.points]);a.setColor(c);a.setBorderWidth(this.annotStyle.width);a.setOpacity(this.annotStyle.opacity)
        } else if(d.tool==='text'){
          const text=prompt(this.t('textPrompt'));if(!text)return;a=page.createAnnotation('FreeText');const rr=rw<10||rh<10?[r[0],r[1],r[0]+180,r[1]+48]:r;a.setRect(rr);a.setContents(text);a.setDefaultAppearance('Helv',this.annotStyle.fontSize,c);a.setOpacity(this.annotStyle.opacity);a.setSubject('PackDocFit Text')
        }
        if(a){a.setSubject?.(`PackDocFit ${d.tool}`);a.update()}
        page.update()
      })
      this.pageMeta[this.currentPage].modified=true
    } finally { page.destroy?.() }
  }

  getSelectedAnnotation() {
    if(!this.selectedAnnot||this.selectedAnnot.pageIndex!==this.currentPage)return null
    const page=this.project.loadPage(this.currentPage)
    const arr=page.getAnnotations(); const a=arr[this.selectedAnnot.annotIndex]
    return {page,annot:a,index:this.selectedAnnot.annotIndex}
  }

  beginAnnotDrag(e,idx,origRect,bounds,scale) {
    if(this.tool!=='select'||e.target.dataset.resize)return
    e.stopPropagation();e.preventDefault(); const layer=$('#interactionLayer',this.els.stageScroll);layer.setPointerCapture(e.pointerId)
    this.selectedAnnot={pageIndex:this.currentPage,annotIndex:idx}; const start=pagePointFromEvent(e,layer,bounds)
    const page=this.project.loadPage(this.currentPage), a=page.getAnnotations()[idx]
    const snap=this.snapshotAnnot(a); page.destroy?.()
    this.dragAnnot={kind:'move',pointerId:e.pointerId,idx,start,last:start,snapshot:snap,bounds,scale}
    const move=ev=>{if(ev.pointerId!==e.pointerId)return;this.dragAnnot.last=pagePointFromEvent(ev,layer,bounds);this.previewAnnotDrag(origRect)}
    const up=ev=>{if(ev.pointerId!==e.pointerId)return;layer.removeEventListener('pointermove',move);layer.removeEventListener('pointerup',up);this.commitAnnotDrag();}
    layer.addEventListener('pointermove',move);layer.addEventListener('pointerup',up)
  }

  beginAnnotResize(e,idx,origRect,bounds,scale,corner) {
    e.stopPropagation();e.preventDefault(); const layer=$('#interactionLayer',this.els.stageScroll);layer.setPointerCapture(e.pointerId)
    const start=pagePointFromEvent(e,layer,bounds), page=this.project.loadPage(this.currentPage),a=page.getAnnotations()[idx],snap=this.snapshotAnnot(a);page.destroy?.()
    this.dragAnnot={kind:'resize',corner,pointerId:e.pointerId,idx,start,last:start,snapshot:snap,origRect,bounds,scale}
    const move=ev=>{if(ev.pointerId!==e.pointerId)return;this.dragAnnot.last=pagePointFromEvent(ev,layer,bounds);this.previewAnnotResize()}
    const up=ev=>{if(ev.pointerId!==e.pointerId)return;layer.removeEventListener('pointermove',move);layer.removeEventListener('pointerup',up);this.commitAnnotDrag()}
    layer.addEventListener('pointermove',move);layer.addEventListener('pointerup',up)
  }

  previewAnnotDrag(origRect) {
    const d=this.dragAnnot,dx=(d.last[0]-d.start[0])*d.scale,dy=(d.last[1]-d.start[1])*d.scale,box=$(`.annot-box[data-annot="${d.idx}"]`,this.els.stageScroll);if(!box)return
    box.style.transform=`translate(${dx}px,${dy}px)`
  }
  previewAnnotResize() {
    const d=this.dragAnnot, r=[...d.origRect],p=d.last
    if(d.corner.includes('n'))r[1]=p[1];if(d.corner.includes('s'))r[3]=p[1];if(d.corner.includes('w'))r[0]=p[0];if(d.corner.includes('e'))r[2]=p[0]
    const rr=normalizeRect([r[0],r[1]],[r[2],r[3]]),pr=pxRect(rr,d.scale),box=$(`.annot-box[data-annot="${d.idx}"]`,this.els.stageScroll);if(!box)return
    Object.assign(box.style,{left:`${pr[0]}px`,top:`${pr[1]}px`,width:`${Math.max(4,pr[2]-pr[0])}px`,height:`${Math.max(4,pr[3]-pr[1])}px`})
  }

  snapshotAnnot(a) {
    const s={type:a.getType(),bounds:a.getBounds()}
    try{if(a.hasRect?.())s.rect=a.getRect()}catch{};try{if(a.hasLine?.())s.line=a.getLine()}catch{};try{if(a.hasQuadPoints?.())s.quads=a.getQuadPoints()}catch{};try{if(a.hasInkList?.())s.ink=a.getInkList()}catch{};try{if(a.hasVertices?.())s.vertices=a.getVertices()}catch{}
    return s
  }

  commitAnnotDrag() {
    const d=this.dragAnnot;if(!d)return;this.dragAnnot=null
    const page=this.project.loadPage(this.currentPage)
    try{
      const a=page.getAnnotations()[d.idx];if(!a)return
      this.withOperation(d.kind==='move'?'Move annotation':'Resize annotation',()=>{
        if(d.kind==='move'){
          const dx=d.last[0]-d.start[0],dy=d.last[1]-d.start[1];this.applyAnnotTranslation(a,d.snapshot,dx,dy)
        } else {
          const r=[...d.origRect],p=d.last;if(d.corner.includes('n'))r[1]=p[1];if(d.corner.includes('s'))r[3]=p[1];if(d.corner.includes('w'))r[0]=p[0];if(d.corner.includes('e'))r[2]=p[0]
          this.applyAnnotScale(a,d.snapshot,normalizeRect([r[0],r[1]],[r[2],r[3]]))
        }
        a.update();page.update()
      })
      this.pageMeta[this.currentPage].modified=true
    } finally {page.destroy?.()}
    this.updateAll(true)
  }

  applyAnnotTranslation(a,s,dx,dy) {
    const pt=p=>[p[0]+dx,p[1]+dy]
    if(s.rect)a.setRect([s.rect[0]+dx,s.rect[1]+dy,s.rect[2]+dx,s.rect[3]+dy])
    if(s.line)a.setLine(pt(s.line[0]),pt(s.line[1]))
    if(s.quads)a.setQuadPoints(s.quads.map(q=>[q[0]+dx,q[1]+dy,q[2]+dx,q[3]+dy,q[4]+dx,q[5]+dy,q[6]+dx,q[7]+dy]))
    if(s.ink)a.setInkList(s.ink.map(st=>st.map(pt)))
    if(s.vertices)a.setVertices(s.vertices.map(pt))
  }
  applyAnnotScale(a,s,newR) {
    const old=s.bounds, ow=Math.max(.001,old[2]-old[0]),oh=Math.max(.001,old[3]-old[1]),nw=newR[2]-newR[0],nh=newR[3]-newR[1]
    const pt=p=>[newR[0]+(p[0]-old[0])/ow*nw,newR[1]+(p[1]-old[1])/oh*nh]
    if(s.rect)a.setRect(newR)
    if(s.line)a.setLine(pt(s.line[0]),pt(s.line[1]))
    if(s.quads)a.setQuadPoints(s.quads.map(q=>{const p1=pt([q[0],q[1]]),p2=pt([q[2],q[3]]),p3=pt([q[4],q[5]]),p4=pt([q[6],q[7]]);return[...p1,...p2,...p3,...p4]}))
    if(s.ink)a.setInkList(s.ink.map(st=>st.map(pt)))
    if(s.vertices)a.setVertices(s.vertices.map(pt))
  }

  deleteSelectedAnnotation() {
    const x=this.getSelectedAnnotation();if(!x)return
    try{this.withOperation('Delete annotation',()=>{x.page.deleteAnnotation(x.annot);x.page.update()});this.pageMeta[this.currentPage].modified=true;this.selectedAnnot=null}finally{x.page.destroy?.()}
    this.updateAll(true)
  }

  updateSelectedAnnotationStyle() {
    const x=this.getSelectedAnnotation();if(!x)return
    try{
      this.withOperation('Change annotation style',()=>{
        const a=x.annot,c=hexToRgb(this.annotStyle.color)
        try{a.setColor(c)}catch{};try{a.setOpacity(this.annotStyle.opacity)}catch{};try{if(a.hasBorder?.())a.setBorderWidth(this.annotStyle.width)}catch{};try{if(a.getType()==='FreeText')a.setDefaultAppearance('Helv',this.annotStyle.fontSize,c)}catch{};a.update();x.page.update()
      });this.pageMeta[this.currentPage].modified=true
    }finally{x.page.destroy?.()}
    this.saveSettings();this.updateAll(true)
  }

  async exportSelectedImage(fmt='png') {
    const indices=this.targets();if(!indices.length)return
    for(const i of indices){
      let page,pix,b
      try{page=this.project.loadPage(i);const scale=(this.settings.exportDpi||240)/72;pix=page.toPixmap(mupdf.Matrix.scale(scale,scale),mupdf.ColorSpace.DeviceRGB,false,true);b=fmt==='jpg'?pix.asJPEG?.(92):pix.asPNG();if(!b)throw new Error(this.t('noJpeg'));downloadBytes(new Uint8Array(b.asUint8Array()),`page_${i+1}.${fmt}`,fmt==='jpg'?'image/jpeg':'image/png')}
      finally{try{b?.destroy?.()}catch{};try{pix?.destroy?.()}catch{};try{page?.destroy?.()}catch{}}
      await new Promise(r=>setTimeout(r,20))
    }
    this.setStatus(`Exported ${indices.length} page image${indices.length>1?'s':''}.`)
  }

  renderInspector() { /* Right inspector removed; contextual properties live in dialogs/settings. */ }

  annotationStyleFields(settingsMode=false) {
    const hex=String(this.annotStyle.color||'#ffcc33').toUpperCase()
    const pct=Math.round(clamp(Number(this.annotStyle.opacity)||0,0,1)*100)
    if(!settingsMode) return `<div class="field-row"><label>${this.t('color')}</label><div class="style-color-control"><input type="color" data-style="color" value="${esc(this.annotStyle.color)}"><input class="style-hex" type="text" data-style-peer="colorHex" value="${esc(hex)}" maxlength="7" spellcheck="false"></div></div>
      <div class="field-row"><label>${this.t('opacity')}</label><div class="style-range-control"><input type="range" data-style="opacity" min="0" max="1" step="0.01" value="${this.annotStyle.opacity}"><span class="style-number-unit"><input type="number" data-style-peer="opacityPercent" min="0" max="100" step="1" value="${pct}"><span>%</span></span></div></div>
      <div class="field-row"><label>${this.t('lineWidth')}</label><span class="style-number-unit"><input type="number" data-style="width" min="0.5" max="20" step="0.5" value="${this.annotStyle.width}"><span>pt</span></span></div>
      <div class="field-row"><label>${this.t('textSize')}</label><span class="style-number-unit"><input type="number" data-style="fontSize" min="6" max="96" step="1" value="${this.annotStyle.fontSize}"><span>pt</span></span></div>`
    return `<div class="settings-row"><label>${this.t('color')}</label><div class="settings-control settings-value-wide style-color-control"><input class="settings-color" type="color" data-style="color" value="${esc(this.annotStyle.color)}"><input class="style-hex" type="text" data-style-peer="colorHex" value="${esc(hex)}" maxlength="7" spellcheck="false"></div></div>
      <div class="settings-row"><label>${this.t('opacity')}</label><div class="settings-control settings-value-wide style-range-control"><input class="settings-range" type="range" data-style="opacity" min="0" max="1" step="0.01" value="${this.annotStyle.opacity}"><span class="style-number-unit"><input type="number" data-style-peer="opacityPercent" min="0" max="100" step="1" value="${pct}"><span>%</span></span></div></div>
      <div class="settings-row"><label>${this.t('lineWidth')}</label><div class="settings-control settings-value-compact style-number-unit"><input type="number" data-style="width" min="0.5" max="20" step="0.5" value="${this.annotStyle.width}"><span>pt</span></div></div>
      <div class="settings-row"><label>${this.t('textSize')}</label><div class="settings-control settings-value-compact style-number-unit"><input type="number" data-style="fontSize" min="6" max="96" step="1" value="${this.annotStyle.fontSize}"><span>pt</span></div></div>`
  }

  wireAnnotationStyleFields(root) {
    const color=$('[data-style="color"]',root), hex=$('[data-style-peer="colorHex"]',root)
    if(color&&hex){
      color.addEventListener('input',()=>{hex.value=String(color.value).toUpperCase()})
      const applyHex=()=>{let v=hex.value.trim();if(!v.startsWith('#'))v=`#${v}`;if(/^#[0-9a-f]{6}$/i.test(v)){color.value=v;hex.value=v.toUpperCase()}}
      hex.addEventListener('input',applyHex);hex.addEventListener('change',applyHex)
    }
    const opacity=$('[data-style="opacity"]',root), percent=$('[data-style-peer="opacityPercent"]',root)
    if(opacity&&percent){
      opacity.addEventListener('input',()=>{percent.value=String(Math.round(Number(opacity.value)*100))})
      percent.addEventListener('input',()=>{opacity.value=String(clamp((Number(percent.value)||0)/100,0,1))})
    }
  }

  openAnnotationProperties() {
    const x=this.getSelectedAnnotation(); if(!x)return this.toast(this.t('noAnnotation'),true)
    let type=''; try{type=x.annot.getType()}finally{x.page.destroy?.()}
    this.modal(this.t('annotationProperties'),`
      <div class="inspector-section" style="padding:0;border:0"><h3>${this.t('selectedAnnotation')}</h3>
      <div class="field-row"><label>${this.t('type')}</label><div>${esc(type)}</div></div>${this.annotationStyleFields()}</div>`,
      [{label:this.t('cancel')},{label:this.t('delete'),onClick:()=>{this.deleteSelectedAnnotation();return true}},{label:this.t('apply'),primary:true,onClick:m=>{
        $$('[data-style]',m).forEach(inp=>{const k=inp.dataset.style;this.annotStyle[k]=inp.type==='range'||inp.type==='number'?Number(inp.value):inp.type==='checkbox'?inp.checked:inp.value})
        this.settings.annotStyle=this.annotStyle;this.saveSettings();this.updateSelectedAnnotationStyle();return true
      }}],m=>this.wireAnnotationStyleFields(m))
  }

  openFitDialog() {
    this.modal(this.t('fitResize'),`
      <div class="field-row"><label>${this.t('mode')}</label><select id="fitKind"><option value="paper">${this.t('standardPaper')}</option><option value="width">${this.t('targetWidth')}</option></select></div>
      <div id="paperFields"><div class="field-row"><label>${this.t('paper')}</label><select id="fitPaper"><option value="210,297">A4</option><option value="297,420">A3</option><option value="176,250">B5</option><option value="250,353">B4</option><option value="215.9,279.4">Letter</option><option value="215.9,355.6">Legal</option></select></div><div class="field-row"><label>${this.t('orientation')}</label><select id="fitOri"><option value="auto">${this.t('auto')}</option><option value="portrait">${this.t('portrait')}</option><option value="landscape">${this.t('landscape')}</option></select></div><div class="field-row"><label>${this.t('fit')}</label><select id="fitMode"><option value="contain">${this.t('fitInside')}</option><option value="cover">${this.t('fillCrop')}</option></select></div></div>
      <div id="widthFields" hidden><div class="field-row"><label>${this.t('width')}</label><input id="fitWidth" type="number" value="297" step="0.1" min="10"> mm</div></div>
      <p style="font-size:11px;color:var(--muted);line-height:1.5">${this.t('fitVectorHelp')}</p>`,
      [{label:this.t('cancel')},{label:this.t('apply'),primary:true,onClick:()=>{const kind=$('#fitKind').value;if(kind==='width')this.fitPages('width',Number($('#fitWidth').value));else{let paper=$('#fitPaper').value.split(',').map(Number),ori=$('#fitOri').value;if(ori==='landscape'&&paper[0]<paper[1])paper.reverse();if(ori==='portrait'&&paper[0]>paper[1])paper.reverse();if(ori==='auto'){let p=this.project.loadPage(this.currentPage),b=p.getBounds();p.destroy?.();if((b[2]-b[0])>(b[3]-b[1])&&paper[0]<paper[1])paper.reverse()}this.fitPages('paper',0,paper,$('#fitMode').value)};return true}}], m=>{$('#fitKind',m).addEventListener('change',e=>{$('#paperFields',m).hidden=e.target.value!=='paper';$('#widthFields',m).hidden=e.target.value!=='width'})})
  }

  async openCompare(mode='horizontal') {
    const ids=this.targets();if(ids.length<2)return this.toast(this.t('selectTwoCompare'),true)
    const a=await this.renderPageBlob(ids[0],1.2), b=await this.renderPageBlob(ids[1],1.2);this.settings.compareMode=mode;this.saveSettings()
    const body=mode==='overlay'?`<div class="compare-overlay"><img src="${a.url}"><img src="${b.url}"></div>`:`<div class="compare-grid ${mode}"><div class="compare-pane"><img src="${a.url}"></div><div class="compare-pane"><img src="${b.url}"></div></div>`
    this.modal(this.t('comparePages',{a:ids[0]+1,b:ids[1]+1}),`<div class="inline-actions" style="margin-bottom:12px"><button class="small-button" data-cmp="horizontal">${this.t('sideBySide')}</button><button class="small-button" data-cmp="vertical">${this.t('vertical')}</button><button class="small-button" data-cmp="overlay">${this.t('overlay')}</button></div>${body}`,[{label:this.t('close')}],m=>$$('[data-cmp]',m).forEach(x=>x.addEventListener('click',()=>{m.closest('.modal-backdrop').remove();URL.revokeObjectURL(a.url);URL.revokeObjectURL(b.url);this.openCompare(x.dataset.cmp)})),()=>{URL.revokeObjectURL(a.url);URL.revokeObjectURL(b.url)})
  }

  async renderPageBlob(index,scale=1) {
    let p,pix,b;try{p=this.project.loadPage(index);pix=p.toPixmap(mupdf.Matrix.scale(scale,scale),mupdf.ColorSpace.DeviceRGB,false,true);b=pix.asPNG();const bytes=new Uint8Array(b.asUint8Array());return{url:URL.createObjectURL(new Blob([bytes],{type:'image/png'})),bytes}}finally{b?.destroy?.();pix?.destroy?.();p?.destroy?.()}
  }

  openSettings() {
    const s=this.settings
    const langOptions=[['ko',this.t('languageKo')],['en',this.t('languageEn')],['ja',this.t('languageJa')],['es',this.t('languageEs')]].map(([v,l])=>`<option value="${v}" ${this.language===v?'selected':''}>${l}</option>`).join('')
    const inferredQuality=s.exportQuality || (Number(s.exportDpi)===120?'low':Number(s.exportDpi)===360?'high':Number(s.exportDpi)===240?'normal':'custom')
    const qualityOptions=[['low',this.t('qualityLow')],['normal',this.t('qualityNormal')],['high',this.t('qualityHigh')],['custom',this.t('qualityCustom')]].map(([v,l])=>`<option value="${v}" ${inferredQuality===v?'selected':''}>${l}</option>`).join('')
    this.modal(this.t('settings'),`
      <div class="settings-stack">
        <section class="settings-group">
          <h3>${this.t('generalSettings')}</h3>
          <div class="settings-row"><label for="setLanguage">${this.t('language')}</label><div class="settings-control settings-value-standard"><select id="setLanguage">${langOptions}</select></div></div>
          <div class="settings-row"><label for="setTheme">${this.t('theme')}</label><div class="settings-control settings-value-standard"><select id="setTheme"><option value="system" ${s.theme==='system'?'selected':''}>${this.t('system')}</option><option value="light" ${s.theme==='light'?'selected':''}>${this.t('light')}</option><option value="dark" ${s.theme==='dark'?'selected':''}>${this.t('dark')}</option></select></div></div>
        </section>

        <section class="settings-group">
          <h3>${this.t('filesAndExport')}</h3>
          <div class="settings-row"><label for="setImageOri">${this.t('imageImportOrientation')}</label><div class="settings-control settings-value-wide"><select id="setImageOri"><option value="auto" ${s.imageOrientation==='auto'?'selected':''}>${this.t('keepOrientation')}</option><option value="portrait" ${s.imageOrientation==='portrait'?'selected':''}>${this.t('portraitPage')}</option><option value="landscape" ${s.imageOrientation==='landscape'?'selected':''}>${this.t('landscapePage')}</option></select></div></div>
          <div class="settings-row settings-row-help"><label for="setExportQuality">${this.t('imageExportQuality')}</label><div class="settings-control export-quality-control"><select id="setExportQuality">${qualityOptions}</select><span class="settings-unit-control"><input id="setDpi" type="number" min="72" max="600" step="1" value="${s.exportDpi||240}"><span>DPI</span></span></div><p class="settings-help">${this.t('exportQualityHelp')}</p></div>
        </section>

        <section class="settings-group">
          <h3>${this.t('annotations')}</h3>
          <div class="settings-row settings-row-help"><label for="setTextOnly">${this.t('highlightSetting')}</label><div class="settings-control settings-toggle-control"><label class="settings-check"><input id="setTextOnly" type="checkbox" ${this.annotStyle.highlightTextOnly?'checked':''}><span>${this.t('preferTextLayer')}</span></label></div><p class="settings-help">${this.t('highlightHelp')}</p></div>
          <div class="settings-subheading">${this.t('annotationDefaults')}</div>
          ${this.annotationStyleFields(true)}
        </section>

        <section class="settings-group">
          <h3>${this.t('settingsManagement')}</h3>
          <div class="settings-row settings-row-actions"><label>${this.t('settingsBackupRestore')}</label><div class="settings-control settings-actions"><button class="small-button" id="exportSettings">${this.t('exportSettings')}</button><button class="small-button" id="importSettings">${this.t('importSettings')}</button><input type="file" id="settingsFile" accept="application/json,.json" hidden></div><p class="settings-help">${this.t('settingsManagementHelp')}</p></div>
        </section>
      </div>`,
      [{label:this.t('cancel')},{label:this.t('saveButton'),primary:true,onClick:m=>{
        const nextLanguage=$('#setLanguage',m).value
        this.settings.theme=$('#setTheme',m).value
        this.settings.imageOrientation=$('#setImageOri',m).value
        this.settings.exportQuality=$('#setExportQuality',m).value
        this.settings.exportDpi=clamp(Number($('#setDpi',m).value)||240,72,600)
        this.annotStyle.highlightTextOnly=$('#setTextOnly',m).checked
        $$('[data-style]',m).forEach(inp=>{const k=inp.dataset.style;this.annotStyle[k]=inp.type==='range'||inp.type==='number'?Number(inp.value):inp.type==='checkbox'?inp.checked:inp.value})
        this.settings.annotStyle=this.annotStyle;this.settings.language=nextLanguage;const languageChanged=this.language!==nextLanguage;this.language=nextLanguage;this.saveSettings();this.applyTheme()
        if(languageChanged){this.buildShell();this.updateAll()}else this.updateAll();return true
      }}],m=>{
        $('.modal',m)?.classList.add('settings-modal')
        this.wireAnnotationStyleFields(m)
        const quality=$('#setExportQuality',m), dpi=$('#setDpi',m)
        const presets={low:120,normal:240,high:360}
        const syncQuality=()=>{const v=quality.value;if(v==='custom'){dpi.readOnly=false;dpi.removeAttribute('aria-readonly')}else{dpi.value=String(presets[v]);dpi.readOnly=true;dpi.setAttribute('aria-readonly','true')}}
        quality.addEventListener('change',syncQuality);syncQuality()
        $('#exportSettings',m).onclick=()=>downloadBytes(new TextEncoder().encode(JSON.stringify(this.settings,null,2)),'PackDocFit-settings.json','application/json')
        $('#importSettings',m).onclick=()=>$('#settingsFile',m).click()
        $('#settingsFile',m).onchange=async e=>{try{const obj=JSON.parse(await e.target.files[0].text());this.settings={...this.settings,...obj,annotStyle:{...this.annotStyle,...(obj.annotStyle||{})}};this.annotStyle=this.settings.annotStyle;this.language=this.settings.language||this.language;this.saveSettings();this.applyTheme();m.remove();this.buildShell();this.updateAll();this.toast(this.t('settingsImported'))}catch(err){this.fail(err)}}
      })
  }

  openAbout() {
    const version='0.1.4'
    this.modal(this.t('about'),`<div class="about-panel">
      <img class="about-app-icon" src="./assets/app_icon.png" alt="PackDocFit">
      <h2>PackDocFit</h2>
      <div class="about-subtitle">${this.t('appSubtitle')} · v${version}</div>
      <p class="about-description">${this.t('aboutBody')}</p>
      <div class="about-actions">
        <button class="about-action" data-about-action="mail">${icon('mail')}<span>${this.t('contactDeveloper')}</span></button>
        <button class="about-action" data-about-action="github">${icon('github')}<span>${this.t('viewOnGithub')}</span></button>
        <button class="about-action" data-about-action="windows">${icon('windows')}<span>${this.t('downloadWindows')}</span></button>
        <button class="about-action" data-about-action="help">${icon('help')}<span>${this.t('usageGuide')}</span></button>
      </div>
      <p class="about-license">GNU AGPL-3.0</p>
    </div>`,[{label:this.t('close')}],m=>{
      $('.modal',m)?.classList.add('about-modal')
      $('[data-about-action="mail"]',m).onclick=()=>{location.href='mailto:creative2ya@gmail.com?subject=PackDocFit%20feedback'}
      $('[data-about-action="github"]',m).onclick=()=>window.open('https://github.com/Bak2ya/PackDocFit','_blank','noopener,noreferrer')
      $('[data-about-action="windows"]',m).onclick=()=>window.open('https://github.com/Bak2ya/PackDocFit/releases','_blank','noopener,noreferrer')
      $('[data-about-action="help"]',m).onclick=()=>this.openHelp()
    })
  }

  openHelp() {
    const mod=/Mac|iPhone|iPad|iPod/i.test(navigator.platform||navigator.userAgent)?'⌘':'Ctrl'
    const shortcuts=[
      [`${mod}+N`,this.t('newProject')],[`${mod}+O`,this.t('addFiles')],[`${mod}+S`,this.t('save')],[`${mod}+Shift+S`,this.t('saveAs')],
      [`${mod}+Z`,this.t('undo')],[`${mod}+Shift+Z / ${mod}+Y`,this.t('redo')],[`${mod}+A`,this.t('selectAllPages')],[`${mod}+C`,this.t('copyPages')],
      [`${mod}+X`,this.t('cutPages')],[`${mod}+V`,this.t('pastePages')],[`${mod}+0`,this.t('single')],['Delete / Backspace',this.t('deletePages')],
      ['Esc',this.t('cancelCurrentAction')],['← / Page Up',this.t('previousPage')],['→ / Page Down',this.t('nextPage')]
    ]
    const rows=shortcuts.map(([key,label])=>`<tr><td><kbd>${esc(key)}</kbd></td><td>${esc(label)}</td></tr>`).join('')
    this.modal(this.t('usageGuide'),`<div class="help-panel">
      <section><h3>${this.t('quickStart')}</h3><ol><li>${this.t('quickStart1')}</li><li>${this.t('quickStart2')}</li><li>${this.t('quickStart3')}</li></ol></section>
      <section><h3>${this.t('whatYouCanDo')}</h3><ul><li>${this.t('helpFeaturePages')}</li><li>${this.t('helpFeatureLayout')}</li><li>${this.t('helpFeatureAnnotations')}</li><li>${this.t('helpFeatureExport')}</li><li>${this.t('helpFeatureCompare')}</li><li>${this.t('helpFeatureSecurity')}</li></ul></section>
      <section><h3>${this.t('shortcuts')}</h3><div class="shortcut-scroll"><table class="shortcut-table"><tbody>${rows}</tbody></table></div></section>
    </div>`,[{label:this.t('close')}],m=>$('.modal',m)?.classList.add('help-modal'))
  }

  openMenu(kind,anchor) {
    const menus={
      file:[[this.t('newMenu'),'new'],[this.t('addFilesMenu'),'open'],[this.t('save'),'save'],[this.t('saveAs'),'saveAs'],[this.t('extractMenu'),'extract'],[this.t('exportPng'),'exportPng'],[this.t('exportJpg'),'exportJpg']],
      edit:[[this.t('undo'),'undo'],[this.t('redo'),'redo'],[this.t('copyPages'),'copy'],[this.t('cutPages'),'cut'],[this.t('pastePages'),'paste'],[this.t('selectAllPages'),'selectAll'],[this.t('annotationPropsMenu'),'annotationProps']],
      page:[[this.t('delete'),'delete'],[this.t('rotateRight'),'rotateR'],[this.t('rotateLeft'),'rotateL'],[this.t('rotate180'),'rotate180'],[this.t('fitResize'),'fit']],
      view:[[this.t('continuous'),'continuous'],[this.t('single'),'single'],[this.t('zoomIn'),'zoomIn'],[this.t('zoomOut'),'zoomOut']],
      compare:[[this.t('sideBySide'),'compareH'],[this.t('vertical'),'compareV'],[this.t('overlay'),'compareO']],
      settings:[[this.t('settings'),'settings'],[this.t('usageGuide'),'help'],[this.t('about'),'about']],
    }
    const items=menus[kind]||[]; const r=anchor.getBoundingClientRect(); const pop=document.createElement('div');pop.style.cssText=`position:fixed;left:${r.left}px;top:${r.bottom+3}px;z-index:800;min-width:190px;padding:5px;background:var(--panel);border:1px solid var(--line);border-radius:8px;box-shadow:var(--shadow)`
    pop.innerHTML=items.map(([l,a])=>`<button data-pop="${a}" style="display:block;width:100%;text-align:left;border:0;background:transparent;color:var(--text);padding:7px 9px;border-radius:5px;cursor:pointer;font-size:12px">${esc(l)}</button>`).join('')
    document.body.append(pop); $$('[data-pop]',pop).forEach(b=>{b.onmouseenter=()=>b.style.background='var(--panel-2)';b.onmouseleave=()=>b.style.background='transparent';b.onclick=async()=>{pop.remove();await this.menuAction(b.dataset.pop)}})
    const close=e=>{if(!pop.contains(e.target)&&e.target!==anchor){pop.remove();document.removeEventListener('pointerdown',close,true)}};setTimeout(()=>document.addEventListener('pointerdown',close,true),0)
  }

  async menuAction(a) {
    const map={new:()=>this.newProject(true),open:()=>this.els.fileInput.click(),save:()=>this.save(false),saveAs:()=>this.save(true),extract:()=>this.extractSelected(),exportPng:()=>this.exportSelectedImage('png'),exportJpg:()=>this.exportSelectedImage('jpg'),undo:()=>this.undo(),redo:()=>this.redo(),copy:()=>this.copyPages(false),cut:()=>this.copyPages(true),paste:()=>this.pastePages(),selectAll:()=>{this.selected=new Set(Array.from({length:this.pageCount()},(_,i)=>i));this.updateAll()},delete:()=>this.deleteSelectedPages(),rotateR:()=>this.rotateSelected(90),rotateL:()=>this.rotateSelected(-90),rotate180:()=>this.rotateSelected(180),fit:()=>this.openFitDialog(),continuous:()=>this.setViewMode('continuous'),single:()=>this.setViewMode('single'),zoomIn:()=>{this.zoom=clamp(this.zoom*1.15,.25,4);this.renderStage()},zoomOut:()=>{this.zoom=clamp(this.zoom*.87,.25,4);this.renderStage()},compareH:()=>this.openCompare('horizontal'),compareV:()=>this.openCompare('vertical'),compareO:()=>this.openCompare('overlay'),settings:()=>this.openSettings(),help:()=>this.openHelp(),about:()=>this.openAbout(),annotationProps:()=>this.openAnnotationProperties()};await map[a]?.()
  }

  onKeyDown(e) {
    const typing=['INPUT','TEXTAREA','SELECT'].includes(e.target?.tagName) || e.target?.isContentEditable
    if(typing && !e.ctrlKey && !e.metaKey) return
    const mod=e.ctrlKey||e.metaKey, k=e.key.toLowerCase()
    if(mod&&k==='n'){e.preventDefault();this.newProject(true)}
    else if(mod&&k==='o'){e.preventDefault();this.els.fileInput.click()}
    else if(mod&&e.shiftKey&&k==='s'){e.preventDefault();this.save(true)}
    else if(mod&&k==='s'){e.preventDefault();this.save(false)}
    else if(mod&&k==='z'&&e.shiftKey){e.preventDefault();this.redo()}
    else if(mod&&k==='z'){e.preventDefault();this.undo()}
    else if(mod&&k==='y'){e.preventDefault();this.redo()}
    else if(mod&&k==='a'&&!typing){e.preventDefault();this.selected=new Set(Array.from({length:this.pageCount()},(_,i)=>i));this.updateAll()}
    else if(mod&&k==='c'&&!typing){ const sel=window.getSelection()?.toString(); if(!sel){e.preventDefault();this.copyPages(false)} }
    else if(mod&&k==='x'&&!typing){e.preventDefault();this.copyPages(true)}
    else if(mod&&k==='v'&&!typing&&this.clipboardBytes){e.preventDefault();this.pastePages()}
    else if(mod&&k==='0'){e.preventDefault();this.zoom=1;this.setViewMode('single')}
    else if((e.key==='Delete'||e.key==='Backspace')&&!typing){e.preventDefault();if(this.selectedAnnot)this.deleteSelectedAnnotation();else this.deleteSelectedPages()}
    else if(e.key==='Escape'){this.selectedAnnot=null;this.dragDrawing=null;this.tool='select';window.getSelection()?.removeAllRanges();this.updateAll()}
    else if(this.viewMode==='single'&&!typing&&['ArrowRight','PageDown'].includes(e.key)){e.preventDefault();this.stepPage(1)}
    else if(this.viewMode==='single'&&!typing&&['ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();this.stepPage(-1)}
  }

  stepPage(d){if(!this.pageCount())return;this.currentPage=clamp(this.currentPage+d,0,this.pageCount()-1);this.selected=new Set([this.currentPage]);this.anchorPage=this.currentPage;this.updateAll()}

  modal(title,body,buttons=[{label:'Close'}],onMount=null,onClose=null) {
    const back=document.createElement('div');back.className='modal-backdrop';back.innerHTML=`<div class="modal"><div class="modal-head"><h2>${esc(title)}</h2><button class="small-button" data-close>✕</button></div><div class="modal-body">${body}</div><div class="modal-foot">${buttons.map((b,i)=>`<button class="small-button" data-modal-button="${i}" ${b.primary?'style="background:var(--accent);color:white;border-color:var(--accent)"':''}>${esc(b.label)}</button>`).join('')}</div></div>`
    document.body.append(back);const close=()=>{onClose?.();back.remove()};$('[data-close]',back).onclick=close;back.addEventListener('pointerdown',e=>{if(e.target===back)close()});$$('[data-modal-button]',back).forEach(b=>b.onclick=async()=>{const cfg=buttons[+b.dataset.modalButton];let should=true;if(cfg.onClick)should=await cfg.onClick(back)!==false;if(should)close()});onMount?.(back);return back
  }

  loadSettings() {
    const defaults={language:'ko',theme:'system',imageOrientation:'auto',exportQuality:'normal',exportDpi:240,zoom:1,viewMode:'continuous',compareMode:'horizontal',sidebarWidth:245,filesSplitPct:24,annotStyle:{color:'#ffcc33',opacity:.45,width:2,fontSize:14,highlightTextOnly:true}}
    try{
      const x=JSON.parse(localStorage.getItem('packdocfit-settings')||'{}')
      if(!x.exportQuality && Number.isFinite(Number(x.exportDpi))){const dpi=Number(x.exportDpi);x.exportQuality=dpi===120?'low':dpi===240?'normal':dpi===360?'high':'custom'}
      return{...defaults,...x,annotStyle:{...defaults.annotStyle,...(x.annotStyle||{})}}
    }catch{return defaults}
  }
  saveSettings(){localStorage.setItem('packdocfit-settings',JSON.stringify(this.settings))}
  applyTheme(){const t=this.settings.theme==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):this.settings.theme;document.documentElement.dataset.theme=t}
}
