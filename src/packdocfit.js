import * as mupdf from 'mupdf'
import { PdfDisplayRenderer } from './pdf_renderer.js'
import { tr } from './i18n.js'

const MM_TO_PT = 72 / 25.4
const IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/bmp', 'image/gif', 'image/tiff'])
const IMAGE_EXT = /\.(png|jpe?g|webp|bmp|gif|tiff?)$/i
const APP_VERSION = '0.2.0'
const APP_BUILD = 8

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
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    edit: '<path d="M4 20h4l11-11-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
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

const ANNOT_META_PREFIX = 'PackDocFitMeta:'
function parseAnnotMeta(a) {
  try {
    const subject = String(a?.getSubject?.() || '')
    if (!subject.startsWith(ANNOT_META_PREFIX)) return {}
    const data = JSON.parse(subject.slice(ANNOT_META_PREFIX.length))
    return data && typeof data === 'object' ? data : {}
  } catch { return {} }
}
function setAnnotMeta(a, meta={}) {
  try { a?.setSubject?.(`${ANNOT_META_PREFIX}${JSON.stringify(meta)}`) } catch {}
}
function dashPattern(style) {
  if (style === 'dashed') return [7,4]
  if (style === 'dotted') return [2,3]
  return []
}
function applyAnnotDash(a, style='solid') {
  try {
    const pattern=dashPattern(style)
    if(pattern.length){ a.setBorderStyle?.('Dashed'); a.setBorderDashPattern?.(pattern) }
    else { a.clearBorderDash?.(); a.setBorderStyle?.('Solid') }
  } catch {}
}
function roundedRectPoints(r) {
  const w=Math.max(0,r[2]-r[0]), h=Math.max(0,r[3]-r[1])
  let radius=Math.min(14,Math.max(3,Math.min(w,h)*.13))
  if(w<radius*2.2||h<radius*2.2)radius=Math.max(1,Math.min(w,h)*.18)
  const pts=[]
  const arc=(cx,cy,a0,a1,steps=5)=>{for(let i=0;i<=steps;i++){const a=(a0+(a1-a0)*(i/steps))*Math.PI/180;pts.push([cx+radius*Math.cos(a),cy+radius*Math.sin(a)])}}
  pts.push([r[0]+radius,r[1]],[r[2]-radius,r[1]])
  arc(r[2]-radius,r[1]+radius,-90,0)
  pts.push([r[2],r[3]-radius]);arc(r[2]-radius,r[3]-radius,0,90)
  pts.push([r[0]+radius,r[3]]);arc(r[0]+radius,r[3]-radius,90,180)
  pts.push([r[0],r[1]+radius]);arc(r[0]+radius,r[1]+radius,180,270)
  if(pts.length){const a=pts[0],b=pts[pts.length-1];if(a[0]!==b[0]||a[1]!==b[1])pts.push([...a])}
  return pts
}

function asBytes(value) {
  if (!value) return new Uint8Array()
  if (value instanceof Uint8Array) return value
  if (value instanceof ArrayBuffer) return new Uint8Array(value)
  if (typeof value.asUint8Array === 'function') return new Uint8Array(value.asUint8Array())
  if (ArrayBuffer.isView(value)) return new Uint8Array(value.buffer, value.byteOffset, value.byteLength)
  return new Uint8Array(value)
}

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
    this.pageDrag = null
    this.suppressPageClickUntil = 0
    this.singleDisplayWidthOverride = null
    this.annotationDisplayDirty = false
    this.renderToken = 0
    this.thumbToken = 0
    this.settings = this.loadSettings()
    this.language = this.settings.language || 'ko'
    this.settings.language = this.language
    this.zoom = this.settings.zoom
    this.columnZoom = this.settings.continuousZoom || 1
    this.viewMode = this.settings.viewMode
    this.annotStyle = this.settings.annotStyle
    this.displayRenderer = new PdfDisplayRenderer(() => this.makePdfBytes({ decrypt: true }))
    this.continuousObserver = null
    this.thumbnailObserver = null
    this.systemThemeMedia = null
    this.systemThemeListener = null
  }

  t(key, vars={}) { return tr(this.language, key, vars) }

  start() {
    this.buildShell()
    this.newProject(false)
    this.bindGlobalEvents()
    this.applyTheme()
    this.bindSystemThemeListener()
    this.updateAll()
  }

  buildShell() {
    document.documentElement.lang = this.language
    const mod=this.modKey()
    this.root.innerHTML = `
      <div class="app-shell">
        <header class="topbar">
          <div class="brand" title="Pack / Doc / Fit → PDF">
            <img class="brand-app-icon" src="./assets/app_icon.png" alt="PackDocFit">
            <span class="brand-title">PackDocFit</span>
            <span class="brand-subtitle">${this.t('appSubtitle')}</span>
          </div>
          <nav class="menu-strip">
            <button class="menu-button" type="button" data-menu="file" aria-haspopup="menu" aria-expanded="false">${this.t('file')}</button>
            <button class="menu-button" type="button" data-menu="edit" aria-haspopup="menu" aria-expanded="false">${this.t('edit')}</button>
            <button class="menu-button" type="button" data-menu="page" aria-haspopup="menu" aria-expanded="false">${this.t('page')}</button>
            <button class="menu-button" type="button" data-menu="view" aria-haspopup="menu" aria-expanded="false">${this.t('view')}</button>
            <button class="menu-button" type="button" data-menu="compare" aria-haspopup="menu" aria-expanded="false">${this.t('compare')}</button>
            <button class="menu-button" type="button" data-menu="settings" aria-haspopup="menu" aria-expanded="false">${this.t('settings')}</button>
          </nav>
          <div class="top-actions">
            <div class="privacy-pill"><span class="privacy-dot"></span><span>${this.t('localOnly')}</span></div>
            <button class="tool-button compact-menu-button" type="button" data-menu="overflow" aria-haspopup="menu" aria-expanded="false" title="${this.t('moreMenu')}" aria-label="${this.t('moreMenu')}">${icon('menu')}</button>
            <button class="tool-button" type="button" data-action="settings" title="${this.t('settings')}" aria-label="${this.t('settings')}">${icon('settings')}</button>
            <button class="tool-button" type="button" data-action="about" title="${this.t('about')}" aria-label="${this.t('about')}">${icon('info')}</button>
          </div>
        </header>

        <div class="toolbar">
          <div class="tool-group">
            ${this.tb('new','new',`${this.t('newProject')} (${mod}+N)`)}
            ${this.tb('open','open',`${this.t('addFiles')} (${mod}+O)`)}
            ${this.tb('save','save',`${this.t('save')} (${mod}+S)`, true)}
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
            ${this.tb('undo','undo',`${this.t('undo')} (${mod}+Z)`, true)}
            ${this.tb('redo','redo',`${this.t('redo')} (${mod}+Y)`, true)}
          </div>
          <div class="tool-sep"></div>
          <div class="tool-group">
            ${this.tb('continuous','continuous',this.t('continuous'))}
            ${this.tb('single','single',`${this.t('single')} (${mod}+0)`)}
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
              <span id="fileCount" hidden>0</span>
              <div class="source-scroll"><div class="source-list" id="sourceList" role="list" aria-label="${this.t('files')}"></div></div>
            </section>
            <div class="splitter splitter-horizontal" id="sourcePageSplitter" role="separator" tabindex="0" aria-orientation="horizontal" aria-label="${this.t('sourcePageSplitterLabel')}" aria-valuemin="14" aria-valuemax="78" aria-valuenow="${Math.round(Number(this.settings.filesSplitPct)||24)}" title="${this.t('splitterReset')}"></div>
            <section class="page-pane">
              <span id="pageCount" hidden>0</span>
              <div class="sidebar-scroll"><div class="page-list" id="pageList" role="listbox" aria-multiselectable="true" aria-label="${this.t('pages')}"></div></div>
            </section>
          </aside>
          <div class="splitter splitter-vertical" id="sidebarSplitter" role="separator" tabindex="0" aria-orientation="vertical" aria-label="${this.t('sidebarSplitterLabel')}" aria-valuemin="180" aria-valuemax="520" aria-valuenow="${Math.round(Number(this.settings.sidebarWidth)||245)}" title="${this.t('splitterReset')}"></div>
          <section class="stage" id="stage">
            <div class="stage-scroll" id="stageScroll"></div>
          </section>
        </main>
      </div>
      <input id="fileInput" type="file" hidden multiple accept="application/pdf,image/png,image/jpeg,image/webp,image/bmp,image/gif,image/tiff,.pdf,.png,.jpg,.jpeg,.webp,.bmp,.gif,.tif,.tiff" />
      <div class="toast-host" id="toastHost" role="status" aria-live="polite" aria-atomic="true"></div>
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
    if(this.els?.sidebarSplitter)this.els.sidebarSplitter.setAttribute('aria-valuenow',String(Math.round(Number(this.settings.sidebarWidth)||245)))
    if(this.els?.sourcePageSplitter)this.els.sourcePageSplitter.setAttribute('aria-valuenow',String(Math.round(Number(this.settings.filesSplitPct)||24)))
  }

  bindWorkspaceChrome() {
    this.els.stageScroll.addEventListener('wheel', e => {
      if (!e.ctrlKey) return
      e.preventDefault()
      const factor = e.deltaY < 0 ? 1.12 : 0.89
      if (this.viewMode === 'single') this.zoom = clamp(this.zoom*factor,.25,4)
      else { this.columnZoom = clamp(this.columnZoom*factor,.18,1.8); this.settings.continuousZoom = this.columnZoom }
      this.settings.zoom = this.zoom
      this.saveSettings()
      this.renderStage()
    }, { passive:false })

    this.els.sidebar.addEventListener('wheel', e => {
      if (!e.ctrlKey || !this.pageCount()) return
      e.preventDefault()
      const factor = e.deltaY < 0 ? 1.12 : 0.89
      this.settings.thumbnailWidth = clamp(Math.round((this.settings.thumbnailWidth || 150) * factor), 92, 360)
      this.saveSettings()
      this.renderSidebar()
    }, { passive:false })

    const finish = () => { document.body.classList.remove('resizing-layout'); this.saveSettings() }
    this.els.sidebarSplitter.addEventListener('pointerdown', e => {
      e.preventDefault(); document.body.classList.add('resizing-layout'); this.els.sidebarSplitter.setPointerCapture(e.pointerId)
      const move = ev => {
        const r=this.els.workspace.getBoundingClientRect(), max=Math.min(520, r.width*.55)
        this.settings.sidebarWidth=clamp(ev.clientX-r.left,180,max)
        this.applyLayoutSettings()
      }
      const up = ev => { this.els.sidebarSplitter.removeEventListener('pointermove',move); this.els.sidebarSplitter.removeEventListener('pointerup',up); finish(); this.renderSidebar(); this.renderStage() }
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
    const splitterKeyStep=(e,kind)=>{
      const big=e.shiftKey
      if(kind==='sidebar'&&['ArrowLeft','ArrowRight','Home'].includes(e.key)){
        e.preventDefault(); this.settings.sidebarWidth=e.key==='Home'?245:clamp((Number(this.settings.sidebarWidth)||245)+(e.key==='ArrowRight'?(big?32:12):-(big?32:12)),180,520); this.applyLayoutSettings(); this.saveSettings(); this.renderSidebar(); this.renderStage()
      } else if(kind==='source'&&['ArrowUp','ArrowDown','Home'].includes(e.key)){
        e.preventDefault(); this.settings.filesSplitPct=e.key==='Home'?24:clamp((Number(this.settings.filesSplitPct)||24)+(e.key==='ArrowDown'?(big?8:2):-(big?8:2)),14,78); this.applyLayoutSettings(); this.saveSettings()
      }
    }
    this.els.sidebarSplitter.addEventListener('keydown',e=>splitterKeyStep(e,'sidebar'))
    this.els.sourcePageSplitter.addEventListener('keydown',e=>splitterKeyStep(e,'source'))
    this.els.sidebarSplitter.addEventListener('dblclick',()=>{this.settings.sidebarWidth=245;this.applyLayoutSettings();this.saveSettings();this.renderSidebar();this.renderStage()})
    this.els.sourcePageSplitter.addEventListener('dblclick',()=>{this.settings.filesSplitPct=24;this.applyLayoutSettings();this.saveSettings()})
  }

  tb(action, iconName, title, disabled=false, cls='') {
    return `<button class="tool-button ${cls}" type="button" data-action="${action}" title="${esc(title)}" aria-label="${esc(title)}" ${disabled?'disabled':''}>${icon(iconName)}</button>`
  }

  modKey(){return /Mac|iPhone|iPad|iPod/i.test(navigator.platform||navigator.userAgent)?'⌘':'Ctrl'}

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
    this.displayRenderer?.invalidate()
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
    try {
      const out=fn(); this.project.endOperation(); this.dirty=true
      this.annotationDisplayDirty=false
      this.displayRenderer?.invalidate()
      return out
    } catch (e) { try { this.project.abandonOperation() } catch {}; throw e }
  }

  withAnnotationOperation(label, fn) {
    this.project.beginOperation(label)
    try {
      const out=fn(); this.project.endOperation(); this.dirty=true
      // Keep PDF.js' full-project snapshot deferred while the one-page annotation
      // surface is active. The current page is repainted directly from MuPDF.
      this.annotationDisplayDirty=true
      return out
    } catch (e) { try { this.project.abandonOperation() } catch {}; throw e }
  }

  flushAnnotationDisplaySnapshot() {
    if(!this.annotationDisplayDirty)return
    this.annotationDisplayDirty=false
    this.displayRenderer?.invalidate()
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
    try { return asBytes(b).slice() } finally { try { b.destroy?.() } catch {} }
  }

  markSaved() { this.dirty=false; this.pageMeta.forEach(x=>x.modified=false); this.updateAll(false) }

  async extractSelected() {
    const indices=this.targets(); if (!indices.length) return
    const out=new mupdf.PDFDocument()
    try {
      indices.forEach(i=>out.graftPage(-1,this.project,i))
      const b=out.saveToBuffer('garbage=deduplicate,compress=yes,appearance=yes')
      const bytes=asBytes(b).slice(); b.destroy?.()
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
      this.clipboardBytes=asBytes(b).slice(); b.destroy?.()
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

  beginPageDrag(e,index,origin){
    const indices=this.selected.has(index)&&this.selected.size?this.targets():[index]
    if(!this.selected.has(index)){
      this.selected=new Set([index]);this.currentPage=index;this.anchorPage=index;this.syncSidebarSelection();this.syncStageSelection();this.renderSourceList();this.updateButtons()
    }
    this.pageDrag={indices:[...indices].sort((a,b)=>a-b),origin,index,insertion:null}
    e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('application/x-packdocfit-pages',JSON.stringify(this.pageDrag.indices));e.dataTransfer.setData('text/page-index',String(index))
    // Native browser drag images can look like a second selected page and hide
    // the insertion cue. Keep the selection in place and show only our guide bar.
    const dragImage=document.createElement('canvas');dragImage.width=1;dragImage.height=1;Object.assign(dragImage.style,{position:'fixed',left:'-20px',top:'-20px',opacity:'0',pointerEvents:'none'});document.body.append(dragImage)
    try{e.dataTransfer.setDragImage(dragImage,0,0)}catch{};setTimeout(()=>dragImage.remove(),0)
    document.body.classList.add('page-reordering')
  }

  updatePageDropIndicator(e,el,index,origin){
    if(!this.pageDrag)return
    e.preventDefault();e.stopPropagation();e.dataTransfer.dropEffect='move'
    const r=el.getBoundingClientRect(), after=e.clientY>=r.top+r.height/2, insertion=index+(after?1:0)
    this.pageDrag.insertion=insertion;this.clearPageDropIndicators();el.classList.add(after?'page-drop-after':'page-drop-before')
  }

  maybeClearPageDropIndicator(e,el){
    const next=e.relatedTarget;if(next&&el.contains(next))return
    el.classList.remove('page-drop-before','page-drop-after')
  }

  finishPageDrop(e,index,el){
    if(!this.pageDrag)return
    e.preventDefault();e.stopPropagation();const insertion=Number.isInteger(this.pageDrag.insertion)?this.pageDrag.insertion:index
    const indices=[...this.pageDrag.indices];this.suppressPageClickUntil=Date.now()+350;this.endPageDrag(false);this.reorderPagesAtInsertion(indices,insertion)
  }

  endPageDrag(clearSuppress=true){
    this.clearPageDropIndicators();document.body.classList.remove('page-reordering');this.pageDrag=null
    if(clearSuppress)this.suppressPageClickUntil=Date.now()+180
  }

  clearPageDropIndicators(){
    $$('.page-drop-before,.page-drop-after',this.root).forEach(el=>el.classList.remove('page-drop-before','page-drop-after'))
  }

  reorderPagesAtInsertion(indices,insertion){
    const n=this.pageCount(),moving=[...new Set(indices)].filter(i=>i>=0&&i<n).sort((a,b)=>a-b);if(!moving.length)return
    insertion=clamp(Number(insertion)||0,0,n)
    const moveSet=new Set(moving),order=Array.from({length:n},(_,i)=>i),remaining=order.filter(i=>!moveSet.has(i))
    const adjusted=clamp(insertion-moving.filter(i=>i<insertion).length,0,remaining.length)
    const next=[...remaining.slice(0,adjusted),...moving,...remaining.slice(adjusted)]
    if(next.every((v,i)=>v===i))return
    const oldMeta=[...this.pageMeta],oldCurrent=this.currentPage
    this.withOperation('Reorder pages',()=>this.project.rearrangePages(next))
    this.pageMeta=next.map(i=>oldMeta[i]);const newSel=Array.from({length:moving.length},(_,i)=>adjusted+i);newSel.forEach(i=>{if(this.pageMeta[i])this.pageMeta[i].modified=true})
    const currentRank=moving.indexOf(oldCurrent);this.currentPage=currentRank>=0?adjusted+currentRank:Math.max(0,next.indexOf(oldCurrent));this.selected=new Set(newSel);this.anchorPage=this.currentPage
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
    this.project.undo(); this.displayRenderer?.invalidate(); this.selectedAnnot=null; this.dirty=true
    this.pageMeta = Array.from({length:this.pageCount()},(_,i)=>this.pageMeta[i]||{source:'Undo restored',sourcePage:i+1,modified:true})
    this.pageMeta.forEach(m=>m.modified=true)
    this.currentPage=clamp(this.currentPage,0,Math.max(0,this.pageCount()-1)); this.selected=new Set(this.pageCount()?[this.currentPage]:[])
    this.updateAll(true)
  }
  redo() {
    if(!this.project.canRedo())return
    this.project.redo(); this.displayRenderer?.invalidate(); this.selectedAnnot=null; this.dirty=true
    this.pageMeta = Array.from({length:this.pageCount()},(_,i)=>this.pageMeta[i]||{source:'Redo restored',sourcePage:i+1,modified:true})
    this.pageMeta.forEach(m=>m.modified=true)
    this.currentPage=clamp(this.currentPage,0,Math.max(0,this.pageCount()-1)); this.selected=new Set(this.pageCount()?[this.currentPage]:[])
    this.updateAll(true)
  }

  setViewMode(mode) {
    if(mode==='single' && this.selected.size>1) return this.openCompare(this.settings.compareMode||'horizontal')
    if(mode==='continuous') this.flushAnnotationDisplaySnapshot()
    this.viewMode=mode; this.settings.viewMode=mode; this.saveSettings(); this.selectedAnnot=null; this.renderStage(); this.updateButtons(); this.renderInspector()
  }
  setTool(tool) {
    if(tool!=='select' && this.viewMode!=='single') {
      const card=$(`.page-card[data-page="${this.currentPage}"] .page-paper`,this.els.stageScroll)
      const visibleWidth=card?.getBoundingClientRect?.().width
      if(visibleWidth>40) this.singleDisplayWidthOverride=visibleWidth
      this.viewMode='single'
    }
    this.tool=tool
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
    this.syncSidebarSelection(); this.renderSourceList(); this.renderInspector(); this.updateButtons(); this.updateStatusbar(); this.syncStageSelection()
    if(this.viewMode==='single') this.renderStage()
    else if(ev?.currentTarget?.classList?.contains('page-item')) $(`.page-card[data-page="${index}"]`,this.els.stageScroll)?.scrollIntoView({block:'center',behavior:'smooth'})
    else if(ev?.currentTarget?.classList?.contains('page-card')) $(`.page-item[data-page="${index}"]`,this.els.pageList)?.scrollIntoView({block:'nearest',behavior:'smooth'})
  }

  syncSidebarSelection(){
    $$('.page-item',this.els.pageList).forEach(item=>{const i=Number(item.dataset.page),selected=this.selected.has(i),current=i===this.currentPage;item.classList.toggle('selected',selected);item.classList.toggle('current',current);item.setAttribute('aria-selected',selected?'true':'false');if(current)item.setAttribute('aria-current','page');else item.removeAttribute('aria-current')})
  }

  syncStageSelection(){
    $$('.page-card',this.els.stageScroll).forEach(card=>{
      const i=Number(card.dataset.page),selected=this.selected.has(i),current=i===this.currentPage;card.classList.toggle('selected',selected);card.classList.toggle('current',current);card.setAttribute('aria-selected',selected?'true':'false');if(current)card.setAttribute('aria-current','page');else card.removeAttribute('aria-current')
    })
  }

  async updateAll(full=false) {
    this.renderSidebar()
    await this.renderStage()
    this.renderInspector()
    this.updateButtons()
    this.updateStatusbar()
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
    this.els.sourceList.innerHTML=groups.map(g=>`<div class="source-item ${g.pages.includes(this.currentPage)?'selected':''}" data-source-id="${esc(g.id)}" draggable="true" tabindex="0" role="listitem" ${g.pages.includes(this.currentPage)?'aria-current="true"':''} title="${esc(g.name)}">
      <div class="source-info"><strong>${esc(g.name)}</strong><span> · ${g.pages.length}p</span></div>
      <button class="source-remove" title="${esc(this.t('removeFile'))}" aria-label="${esc(this.t('removeFile'))}">×</button>
    </div>`).join('')
    $$('.source-item',this.els.sourceList).forEach(el=>{
      const id=el.dataset.sourceId
      const chooseSource=()=>{const g=this.sourceGroups().find(x=>x.id===id);if(g?.pages.length){this.currentPage=g.pages[0];this.selected=new Set(g.pages);this.anchorPage=g.pages[0];this.updateAll()}}
      el.addEventListener('click',e=>{if(e.target.closest('.source-remove'))return;chooseSource()})
      el.addEventListener('keydown',e=>{if(e.target.closest('.source-remove'))return;if(e.key==='Enter'||e.key===' '){e.preventDefault();chooseSource()}else if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();const els=$$('.source-item',this.els.sourceList),idx=els.indexOf(el),next=clamp(idx+(e.key==='ArrowDown'?1:-1),0,els.length-1);els[next]?.focus()}})
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
    this.thumbnailObserver?.disconnect?.();this.thumbnailObserver=null
    this.renderSourceList()
    if(!n){ this.els.pageList.innerHTML=''; return }
    this.els.pageList.innerHTML=Array.from({length:n},(_,i)=>{
      const m=this.pageMeta[i]||{source:'Document',sourcePage:i+1,modified:false}
      const stem=filenameStem(m.source||'Document')
      return `<div class="page-item ${this.selected.has(i)?'selected':''} ${i===this.currentPage?'current':''}" data-page="${i}" draggable="true" tabindex="0" role="option" aria-selected="${this.selected.has(i)?'true':'false'}" ${i===this.currentPage?'aria-current="page"':''} title="${esc(m.source||'')}">
        <div class="thumb-wrap"><canvas aria-label="${esc(this.t('pageLabel'))} ${i+1}"></canvas><span class="thumb-loading">${i+1}</span></div>
        <div class="page-caption">${esc(stem)} · p${m.sourcePage||i+1}${m.modified?`<span class="modified-marker" role="img" aria-label="${esc(this.t('modified'))}" title="${esc(this.t('modified'))}">${icon('edit')}</span>`:''}</div>
      </div>`
    }).join('')

    $$('.page-item',this.els.pageList).forEach(el=>{
      const i=+el.dataset.page
      el.addEventListener('click',e=>{if(Date.now()<this.suppressPageClickUntil)return;this.selectPage(i,e)})
      el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();this.selectPage(i,e)}else if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();const next=clamp(i+(e.key==='ArrowDown'?1:-1),0,this.pageCount()-1);$(`.page-item[data-page="${next}"]`,this.els.pageList)?.focus()}})
      el.addEventListener('dblclick',e=>{e.preventDefault();this.currentPage=i;this.selected=new Set([i]);this.anchorPage=i;this.setViewMode('single')})
      el.addEventListener('dragstart',e=>this.beginPageDrag(e,i,'sidebar'))
      el.addEventListener('dragover',e=>this.updatePageDropIndicator(e,el,i,'sidebar'))
      el.addEventListener('dragleave',e=>this.maybeClearPageDropIndicator(e,el))
      el.addEventListener('drop',e=>this.finishPageDrop(e,i,el))
      el.addEventListener('dragend',()=>this.endPageDrag())
    })
    this.renderThumbnails(token)
  }

  async renderDisplayCanvas(index, canvas, options={}) {
    try {
      return await this.displayRenderer.renderToCanvas(index, canvas, options)
    } catch (pdfjsError) {
      console.warn('PDF.js render failed; falling back to MuPDF.js', pdfjsError)
      return this.renderMupdfFallbackToCanvas(index, canvas, options)
    }
  }

  async renderMupdfFallbackToCanvas(index, canvas, {cssWidth=null,cssScale=null,maxDpr=2}={}) {
    let page,pix,png
    try {
      page=this.project.loadPage(index)
      const b=page.getBounds(), pw=b[2]-b[0], ph=b[3]-b[1]
      const scale=cssScale ?? (cssWidth ? cssWidth/Math.max(pw,1) : 1)
      const dpr=Math.max(1,Math.min(maxDpr,window.devicePixelRatio||1))
      pix=page.toPixmap(mupdf.Matrix.scale(scale*dpr,scale*dpr),mupdf.ColorSpace.DeviceRGB,false,true)
      png=pix.asPNG()
      const blob=new Blob([asBytes(png)],{type:'image/png'})
      const bitmap=await createImageBitmap(blob)
      canvas.width=bitmap.width;canvas.height=bitmap.height
      canvas.style.width=`${Math.max(1,Math.round(pw*scale))}px`;canvas.style.height=`${Math.max(1,Math.round(ph*scale))}px`
      const ctx=canvas.getContext('2d',{alpha:false});ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0);bitmap.close?.()
      return {width:pw,height:ph,cssWidth:pw*scale,cssHeight:ph*scale,scale}
    } finally { try{png?.destroy?.()}catch{};try{pix?.destroy?.()}catch{};try{page?.destroy?.()}catch{} }
  }

  async renderThumbnailCanvas(index,item,target,token) {
    if(token!==this.thumbToken||!item)return
    const canvas=$('canvas',item),loading=$('.thumb-loading',item);if(!canvas||canvas.dataset.renderState==='loading'||canvas.dataset.renderState==='done')return
    canvas.dataset.renderState='loading'
    try{
      const info=await this.renderDisplayCanvas(index,canvas,{cssWidth:target,maxDpr:1.5})
      if(token!==this.thumbToken)return
      canvas.dataset.renderState='done';loading?.remove();item.classList.add('rendered')
      const mmW=info.width/MM_TO_PT,mmH=info.height/MM_TO_PT
      item.title=`${this.pageMeta[index]?.source||''} · p${this.pageMeta[index]?.sourcePage||index+1} · ${mmW.toFixed(0)} × ${mmH.toFixed(0)} mm`
    }catch(e){
      console.warn('thumbnail',e);canvas.dataset.renderState='error'
      if(loading){loading.textContent=this.t('previewUnavailable');loading.classList.add('error')}
    }
  }

  renderThumbnails(token) {
    const target=Math.min(Number(this.settings.thumbnailWidth)||150,Math.max(92,this.els.sidebar.clientWidth-28))
    const items=$$('.page-item',this.els.pageList)
    if(!('IntersectionObserver' in window)){
      items.forEach(item=>this.renderThumbnailCanvas(Number(item.dataset.page),item,target,token))
      return
    }
    this.thumbnailObserver=new IntersectionObserver(entries=>{
      for(const entry of entries)if(entry.isIntersecting){
        const item=entry.target,index=Number(item.dataset.page)
        this.renderThumbnailCanvas(index,item,target,token)
        this.thumbnailObserver?.unobserve(item)
      }
    },{root:this.els.pageList.parentElement,rootMargin:'900px 0px',threshold:0.01})
    items.forEach(item=>this.thumbnailObserver.observe(item))
    const current=$(`.page-item[data-page="${this.currentPage}"]`,this.els.pageList)
    if(current)this.renderThumbnailCanvas(this.currentPage,current,target,token)
  }

  async renderStage() {
    const token=++this.renderToken
    this.continuousObserver?.disconnect?.();this.continuousObserver=null
    const n=this.pageCount()
    if(!n){
      this.els.stageScroll.innerHTML=`<div class="empty-state"><div class="empty-card"><strong>${this.t('dropTitle')}</strong>${this.t('dropBody')}<div class="drop-note">${this.t('dropNote')}</div></div></div>`
      return
    }
    if(this.viewMode==='single') await this.renderSingle(token)
    else await this.renderContinuous(token)
  }

  continuousLayoutMetrics() {
    const available=Math.max(260,this.els.stage.clientWidth-52)
    const zoom=clamp(this.columnZoom||1,.18,1.8)
    const spacing=16
    const preferredCols=clamp(Math.round(1/Math.max(zoom,.01)),1,8)
    const maxColsBySpace=clamp(Math.floor((available+spacing)/(128+spacing)),1,8)
    const cols=Math.min(preferredCols,maxColsBySpace)
    const desired=Math.max(112,Math.min(940,available*zoom))
    const maxForCols=Math.max(112,(available-spacing*(cols-1))/cols)
    const width=Math.floor(Math.min(desired,maxForCols))
    return {available,cols,width,spacing}
  }

  async renderContinuous(token) {
    this.flushAnnotationDisplaySnapshot()
    const {cols,width}=this.continuousLayoutMetrics()
    this.els.stageScroll.innerHTML=`<div class="continuous-view" style="--cols:${cols}" id="continuous" role="listbox" aria-multiselectable="true" aria-label="${this.t('pages')}"></div>`
    const wrap=$('#continuous',this.els.stageScroll)
    try { await this.displayRenderer.getDocument() } catch(e) { console.warn('display snapshot',e) }
    for(let i=0;i<this.pageCount();i++){
      if(token!==this.renderToken)return
      let ratio=1.414
      try{const info=await this.displayRenderer.pageInfo(i);ratio=info.height/Math.max(info.width,1)}catch{try{const p=this.project.loadPage(i);const b=p.getBounds();ratio=(b[3]-b[1])/Math.max(1,b[2]-b[0]);p.destroy?.()}catch{}}
      const h=Math.max(80,Math.round(width*ratio))
      const m=this.pageMeta[i]||{}
      const card=document.createElement('div');card.className=`page-card ${this.selected.has(i)?'selected':''} ${i===this.currentPage?'current':''}`;card.dataset.page=i;card.draggable=true;card.tabIndex=0;card.setAttribute('role','option');card.setAttribute('aria-selected',this.selected.has(i)?'true':'false');if(i===this.currentPage)card.setAttribute('aria-current','page')
      card.innerHTML=`<div class="page-paper" style="width:${width}px;height:${h}px"><canvas data-render-state="idle"></canvas><div class="page-skeleton">${esc(this.t('previewLoading'))}</div></div><div class="page-card-caption">${i+1} · ${esc(filenameStem(m.source||'Document'))}-${m.sourcePage||i+1}${m.modified?`<span class="modified-marker" role="img" aria-label="${esc(this.t('modified'))}" title="${esc(this.t('modified'))}">${icon('edit')}</span>`:''}</div>`
      card.addEventListener('click',e=>{if(Date.now()<this.suppressPageClickUntil)return;this.selectPage(i,e)})
      card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();this.selectPage(i,e)}else if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();const next=clamp(i+(e.key==='ArrowDown'?1:-1),0,this.pageCount()-1);$(`.page-card[data-page="${next}"]`,this.els.stageScroll)?.focus()}})
      card.addEventListener('dblclick',e=>{e.preventDefault();this.currentPage=i;this.selected=new Set([i]);this.anchorPage=i;this.setViewMode('single')})
      card.addEventListener('dragstart',e=>this.beginPageDrag(e,i,'stage'))
      card.addEventListener('dragover',e=>this.updatePageDropIndicator(e,card,i,'stage'))
      card.addEventListener('dragleave',e=>this.maybeClearPageDropIndicator(e,card))
      card.addEventListener('drop',e=>this.finishPageDrop(e,i,card))
      card.addEventListener('dragend',()=>this.endPageDrag())
      wrap.append(card)
    }

    this.continuousObserver=new IntersectionObserver(entries=>{
      for(const entry of entries)if(entry.isIntersecting){
        const card=entry.target,index=Number(card.dataset.page),canvas=$('canvas',card),skeleton=$('.page-skeleton',card)
        this.renderContinuousCanvas(index,canvas,skeleton,width,token)
        this.continuousObserver?.unobserve(card)
      }
    },{root:this.els.stageScroll,rootMargin:'1200px 0px',threshold:0.01})
    $$('.page-card',wrap).forEach(card=>this.continuousObserver.observe(card))
    const current=$(`.page-card[data-page="${this.currentPage}"]`,wrap)
    if(current){const canvas=$('canvas',current),skeleton=$('.page-skeleton',current);this.renderContinuousCanvas(this.currentPage,canvas,skeleton,width,token)}
  }

  async renderContinuousCanvas(index,canvas,skeleton,width,token){
    if(!canvas||canvas.dataset.renderState==='loading'||canvas.dataset.renderState==='done')return
    canvas.dataset.renderState='loading'
    try{
      await this.renderDisplayCanvas(index,canvas,{cssWidth:width,maxDpr:1.75})
      if(token!==this.renderToken)return
      canvas.dataset.renderState='done';skeleton?.remove()
    }catch(e){console.warn('render page',index,e);canvas.dataset.renderState='error';if(skeleton){skeleton.textContent=this.t('previewUnavailable');skeleton.classList.add('error')}}
  }

  async renderSingle(token) {
    this.currentPage=clamp(this.currentPage,0,this.pageCount()-1)
    let page
    try{
      let bounds,pw,ph
      try{const info=await this.displayRenderer.pageInfo(this.currentPage);pw=info.width;ph=info.height}catch{page=this.project.loadPage(this.currentPage);bounds=page.getBounds();pw=bounds[2]-bounds[0];ph=bounds[3]-bounds[1]}
      const availW=Math.max(220,this.els.stage.clientWidth-84),availH=Math.max(220,this.els.stage.clientHeight-100)
      const fit=Math.min(availW/pw,availH/ph)
      let scale=clamp(fit*this.zoom,.2,4)
      if(this.singleDisplayWidthOverride>40){scale=clamp(this.singleDisplayWidthOverride/Math.max(pw,1),.2,4);this.singleDisplayWidthOverride=null}
      const width=Math.round(pw*scale),height=Math.round(ph*scale)
      const m=this.pageMeta[this.currentPage]||{}
      this.els.stageScroll.innerHTML=`<div class="single-wrap"><div class="single-page-shell"><div class="single-page" id="singlePage" style="width:${width}px;height:${height}px">
        <canvas id="singleCanvas" style="width:${width}px;height:${height}px"></canvas>
        <div class="page-skeleton" id="singleLoading">${esc(this.t('previewLoading'))}</div>
        <div class="text-layer ${this.tool==='select'?'enabled':''}" id="textLayer"></div>
        <div class="annotation-layer" id="annotationLayer"></div>
        <div class="interaction-layer" id="interactionLayer"></div>
      </div><div class="single-caption">${this.currentPage+1} · ${esc(filenameStem(m.source||'Document'))}-${m.sourcePage||this.currentPage+1}</div></div></div>`
      const canvas=$('#singleCanvas',this.els.stageScroll)
      if(this.annotationDisplayDirty) await this.renderMupdfFallbackToCanvas(this.currentPage,canvas,{cssScale:scale,maxDpr:2})
      else await this.renderDisplayCanvas(this.currentPage,canvas,{cssScale:scale,maxDpr:2})
      if(token!==this.renderToken)return
      $('#singleLoading',this.els.stageScroll)?.remove()
      if(!page){page=this.project.loadPage(this.currentPage);bounds=page.getBounds()}
      const mupdfScale=width/Math.max(bounds[2]-bounds[0],1)
      await this.renderTextLayer(page,bounds,mupdfScale)
      this.renderAnnotationLayer(page,bounds,mupdfScale)
      this.bindSingleInteraction(page,bounds,mupdfScale)
    } catch(e){console.warn('single render',e);this.els.stageScroll.innerHTML=`<div class="preview-error"><strong>${esc(this.t('previewUnavailable'))}</strong><span>${esc(e?.message||String(e))}</span></div>`}
    finally { try{page?.destroy?.()}catch{} }
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

  annotationKind(a) {
    const meta=parseAnnotMeta(a), type=String(a?.getType?.()||'')
    if(meta.tool)return meta.tool
    if(type==='Highlight')return 'highlight'
    if(type==='Square')return 'rectangle'
    if(type==='Line'){
      try{const endings=a.getLineEndingStyles?.();if(endings?.end&&endings.end!=='None')return 'arrow'}catch{}
      return 'line'
    }
    if(type==='Ink')return 'ink'
    if(type==='FreeText')return 'text'
    return type.toLowerCase()
  }

  renderAnnotationLayer(page,bounds,scale) {
    const interaction=$('#interactionLayer',this.els.stageScroll); if(!interaction)return
    let annots=[]; try{annots=page.getAnnotations()}catch{}
    annots.forEach((a,idx)=>{
      let r; try{r=a.getBounds()}catch{return}
      const kind=this.annotationKind(a), selected=this.selectedAnnot?.pageIndex===this.currentPage&&this.selectedAnnot?.annotIndex===idx
      if(kind==='line'||kind==='arrow'){
        let line;try{line=a.getLine()}catch{return}
        this.renderLineAnnotationOverlay(interaction,idx,line,bounds,scale,selected)
        return
      }
      if(kind==='ink'){
        let strokes=[];try{strokes=a.getInkList()}catch{}
        this.renderInkAnnotationOverlay(interaction,idx,strokes,bounds,scale,selected)
        return
      }
      const [x0,y0,x1,y1]=pxRect(r,scale), box=document.createElement('div')
      box.className=`annot-box ${selected?'selected':''}`
      Object.assign(box.style,{left:`${x0}px`,top:`${y0}px`,width:`${Math.max(4,x1-x0)}px`,height:`${Math.max(4,y1-y0)}px`}); box.dataset.annot=idx; interaction.append(box)
      box.addEventListener('pointerdown',e=>this.beginAnnotDrag(e,idx,r,bounds,scale))
      box.addEventListener('click',e=>{e.stopPropagation();this.selectedAnnot={pageIndex:this.currentPage,annotIndex:idx};this.renderInspector();this.renderStage()})
      box.addEventListener('dblclick',e=>{e.stopPropagation();this.selectedAnnot={pageIndex:this.currentPage,annotIndex:idx};this.openAnnotationProperties()})
      if(selected && (a.hasRect?.() || kind==='rectangle')) {
        for(const c of ['nw','ne','sw','se']){const h=document.createElement('span');h.className=`annot-handle ${c}`;h.dataset.resize=c;box.append(h);h.addEventListener('pointerdown',e=>this.beginAnnotResize(e,idx,r,bounds,scale,c))}
      }
    })
  }

  renderLineAnnotationOverlay(layer,idx,line,bounds,scale,selected){
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.classList.add('annot-vector-overlay');svg.dataset.annot=idx
    svg.setAttribute('viewBox',`0 0 ${layer.clientWidth} ${layer.clientHeight}`)
    const [[ax,ay],[bx,by]]=line
    const x1=(ax-bounds[0])*scale,y1=(ay-bounds[1])*scale,x2=(bx-bounds[0])*scale,y2=(by-bounds[1])*scale
    const hit=document.createElementNS(svg.namespaceURI,'line');hit.classList.add('annot-line-hit');hit.setAttribute('x1',x1);hit.setAttribute('y1',y1);hit.setAttribute('x2',x2);hit.setAttribute('y2',y2)
    const vis=document.createElementNS(svg.namespaceURI,'line');vis.classList.add('annot-line-selection');vis.setAttribute('x1',x1);vis.setAttribute('y1',y1);vis.setAttribute('x2',x2);vis.setAttribute('y2',y2);if(!selected)vis.classList.add('hidden')
    svg.append(hit,vis);layer.append(svg)
    const choose=e=>{e.stopPropagation();this.selectedAnnot={pageIndex:this.currentPage,annotIndex:idx}}
    hit.addEventListener('pointerdown',e=>{choose(e);this.beginAnnotLineDrag(e,idx,line,bounds,scale,'move')})
    hit.addEventListener('click',e=>{choose(e);this.renderInspector();this.renderStage()})
    hit.addEventListener('dblclick',e=>{choose(e);this.openAnnotationProperties()})
    if(selected){
      ;[['p1',x1,y1],['p2',x2,y2]].forEach(([which,x,y])=>{const c=document.createElementNS(svg.namespaceURI,'circle');c.classList.add('annot-line-handle');c.dataset.endpoint=which;c.setAttribute('cx',x);c.setAttribute('cy',y);c.setAttribute('r',5);c.addEventListener('pointerdown',e=>this.beginAnnotLineDrag(e,idx,line,bounds,scale,which));svg.append(c)})
    }
  }

  renderInkAnnotationOverlay(layer,idx,strokes,bounds,scale,selected){
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.classList.add('annot-vector-overlay');svg.dataset.annot=idx
    svg.setAttribute('viewBox',`0 0 ${layer.clientWidth} ${layer.clientHeight}`)
    for(const stroke of strokes||[]){
      if(!stroke?.length)continue
      const pts=stroke.map(p=>`${(p[0]-bounds[0])*scale},${(p[1]-bounds[1])*scale}`).join(' ')
      const hit=document.createElementNS(svg.namespaceURI,'polyline');hit.classList.add('annot-ink-hit');hit.setAttribute('points',pts)
      const vis=document.createElementNS(svg.namespaceURI,'polyline');vis.classList.add('annot-ink-selection');vis.setAttribute('points',pts);if(!selected)vis.classList.add('hidden')
      const choose=e=>{e.stopPropagation();this.selectedAnnot={pageIndex:this.currentPage,annotIndex:idx}}
      hit.addEventListener('pointerdown',e=>{choose(e);this.beginAnnotInkDrag(e,idx,strokes,bounds,scale)})
      hit.addEventListener('click',e=>{choose(e);this.renderInspector();this.renderStage()})
      hit.addEventListener('dblclick',e=>{choose(e);this.openAnnotationProperties()})
      svg.append(hit,vis)
    }
    layer.append(svg)
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
      const d=this.dragDrawing;this.dragDrawing=null
      const created=await this.commitDrawing(d)
      if(created) this.tool='select'
      this.renderInspector(); await this.refreshCurrentAnnotationPage(); this.updateButtons()
    })
    // Keep an existing annotation selected when empty page space is clicked.
    // Escape, another annotation selection, or delete explicitly clears it.
  }

  showDrawPreview() {
    const layer=$('#interactionLayer',this.els.stageScroll), d=this.dragDrawing; if(!layer||!d)return
    $('.draw-preview',layer)?.remove(); $('.ink-preview',layer)?.remove(); $('.line-preview',layer)?.remove()
    if(d.tool==='ink'){
      const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.classList.add('ink-preview');svg.setAttribute('viewBox',`0 0 ${layer.clientWidth} ${layer.clientHeight}`)
      const pl=document.createElementNS(svg.namespaceURI,'polyline'); const pts=d.points.map(p=>`${(p[0]-d.bounds[0])*d.scale},${(p[1]-d.bounds[1])*d.scale}`).join(' ');pl.setAttribute('points',pts);pl.setAttribute('fill','none');pl.setAttribute('stroke',this.annotStyle.color);pl.setAttribute('stroke-width',String(Math.max(1,this.annotStyle.width*d.scale)));pl.setAttribute('stroke-linecap','round');pl.setAttribute('stroke-linejoin','round');svg.append(pl);layer.append(svg);return
    }
    if(d.tool==='line'||d.tool==='arrow'){
      const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.classList.add('line-preview');svg.setAttribute('viewBox',`0 0 ${layer.clientWidth} ${layer.clientHeight}`)
      const x1=(d.start[0]-d.bounds[0])*d.scale,y1=(d.start[1]-d.bounds[1])*d.scale,x2=(d.last[0]-d.bounds[0])*d.scale,y2=(d.last[1]-d.bounds[1])*d.scale
      const line=document.createElementNS(svg.namespaceURI,'line');line.setAttribute('x1',x1);line.setAttribute('y1',y1);line.setAttribute('x2',x2);line.setAttribute('y2',y2);line.setAttribute('stroke',this.annotStyle.color);line.setAttribute('stroke-width',String(Math.max(1,this.annotStyle.width*d.scale)));line.setAttribute('stroke-linecap','round')
      const pattern=dashPattern(this.annotStyle.lineStyle);if(pattern.length)line.setAttribute('stroke-dasharray',pattern.map(v=>v*d.scale).join(' '));svg.append(line)
      if(d.tool==='arrow')this.appendArrowPreview(svg,x1,y1,x2,y2,d.scale)
      layer.append(svg);return
    }
    const r=normalizeRect(d.start,d.last), pr=pxRect(r,d.scale), div=document.createElement('div');div.className='draw-preview';Object.assign(div.style,{left:`${pr[0]}px`,top:`${pr[1]}px`,width:`${Math.max(2,pr[2]-pr[0])}px`,height:`${Math.max(2,pr[3]-pr[1])}px`});layer.append(div)
  }

  appendArrowPreview(svg,x1,y1,x2,y2,scale=1){
    const angle=Math.atan2(y2-y1,x2-x1), size=Math.max(9,Number(this.annotStyle.width||2)*scale*4.5), spread=.52
    const a=[x2-size*Math.cos(angle-spread),y2-size*Math.sin(angle-spread)], b=[x2-size*Math.cos(angle+spread),y2-size*Math.sin(angle+spread)]
    if(this.annotStyle.arrowStyle==='open'){
      const p=document.createElementNS(svg.namespaceURI,'polyline');p.setAttribute('points',`${a[0]},${a[1]} ${x2},${y2} ${b[0]},${b[1]}`);p.setAttribute('fill','none');p.setAttribute('stroke',this.annotStyle.color);p.setAttribute('stroke-width',String(Math.max(1,Number(this.annotStyle.width||2)*scale)));p.setAttribute('stroke-linecap','round');p.setAttribute('stroke-linejoin','round');svg.append(p)
    }else{
      const p=document.createElementNS(svg.namespaceURI,'polygon');p.setAttribute('points',`${x2},${y2} ${a[0]},${a[1]} ${b[0]},${b[1]}`);p.setAttribute('fill',this.annotStyle.color);svg.append(p)
    }
  }

  async commitDrawing(d) {
    const page=this.project.loadPage(this.currentPage)
    let created=false, createdIndex=null
    try{
      const r=normalizeRect(d.start,d.last), [rw,rh]=rectSize(r)
      const length=Math.hypot(d.last[0]-d.start[0],d.last[1]-d.start[1])
      if((d.tool==='line'||d.tool==='arrow')&&length<2)return false
      if(d.tool==='ink'&&d.points.length<2)return false
      if(!['ink','text','line','arrow'].includes(d.tool) && (rw<2||rh<2))return false
      const textValue=d.tool==='text'?prompt(this.t('textPrompt')):null
      if(d.tool==='text'&&!textValue)return false
      this.withAnnotationOperation(`Add ${d.tool} annotation`,()=>{
        const c=hexToRgb(this.annotStyle.color); let a
        if(d.tool==='highlight'){
          a=page.createAnnotation('Highlight'); let quads=[]
          if(this.annotStyle.highlightTextOnly){
            let st; try{st=page.toStructuredText('preserve-spans');const data=JSON.parse(st.asJSON());for(const b of data.blocks||[])if(b.type==='text')for(const l of b.lines||[]){const q=l.bbox;if(!q)continue;const x=q.x??q[0],y=q.y??q[1],w=q.w??(q[2]-q[0]),h=q.h??(q[3]-q[1]);if(x<r[2]&&x+w>r[0]&&y<r[3]&&y+h>r[1])quads.push([x,y,x+w,y,x+w,y+h,x,y+h])}}finally{st?.destroy?.()}}
          if(!quads.length)quads=[[r[0],r[1],r[2],r[1],r[2],r[3],r[0],r[3]]]
          a.setQuadPoints(quads);a.setColor(c);a.setOpacity(this.annotStyle.opacity);setAnnotMeta(a,{tool:'highlight'})
        } else if(d.tool==='rectangle'){
          a=this.createRectangleAnnotation(page,r,c)
        } else if(d.tool==='line'||d.tool==='arrow'){
          a=page.createAnnotation('Line');a.setLine(d.start,d.last);a.setColor(c);a.setBorderWidth(this.annotStyle.width);a.setOpacity(this.annotStyle.opacity);applyAnnotDash(a,this.annotStyle.lineStyle);a.setLineEndingStyles('None',d.tool==='arrow'?(this.annotStyle.arrowStyle==='open'?'OpenArrow':'ClosedArrow'):'None');setAnnotMeta(a,{tool:d.tool,dash:this.annotStyle.lineStyle,arrow:this.annotStyle.arrowStyle})
        } else if(d.tool==='ink'){
          a=page.createAnnotation('Ink');a.setInkList([d.points]);a.setColor(c);a.setBorderWidth(this.annotStyle.width);a.setOpacity(this.annotStyle.opacity);setAnnotMeta(a,{tool:'ink'})
        } else if(d.tool==='text'){
          a=page.createAnnotation('FreeText');const rr=rw<10||rh<10?[r[0],r[1],r[0]+180,r[1]+48]:r;a.setRect(rr);a.setContents(textValue);a.setDefaultAppearance('Helv',this.annotStyle.fontSize,c);a.setOpacity(this.annotStyle.opacity);setAnnotMeta(a,{tool:'text'})
        }
        if(a){a.update();page.update();created=true;try{createdIndex=page.getAnnotations().length-1}catch{}}
      })
      if(created){
        this.pageMeta[this.currentPage].modified=true
        if(Number.isInteger(createdIndex))this.selectedAnnot={pageIndex:this.currentPage,annotIndex:createdIndex}
      }
      return created
    } finally { page.destroy?.() }
  }

  createRectangleAnnotation(page,r,color,style=this.annotStyle){
    const rounded=style.rectCornerStyle==='rounded'
    const a=page.createAnnotation(rounded?'Ink':'Square')
    if(rounded)a.setInkList([roundedRectPoints(r)]);else a.setRect(r)
    a.setColor(color);a.setBorderWidth(style.width);a.setOpacity(style.opacity);applyAnnotDash(a,style.lineStyle)
    setAnnotMeta(a,{tool:'rectangle',corner:rounded?'rounded':'square',dash:style.lineStyle})
    return a
  }

  getSelectedAnnotation() {
    if(!this.selectedAnnot||this.selectedAnnot.pageIndex!==this.currentPage)return null
    const page=this.project.loadPage(this.currentPage)
    const arr=page.getAnnotations(); const a=arr[this.selectedAnnot.annotIndex]
    return {page,annot:a,index:this.selectedAnnot.annotIndex}
  }

  beginAnnotLineDrag(e,idx,origLine,bounds,scale,mode='move') {
    if(this.tool!=='select')return
    e.stopPropagation();e.preventDefault();const layer=$('#interactionLayer',this.els.stageScroll);layer.setPointerCapture(e.pointerId)
    this.selectedAnnot={pageIndex:this.currentPage,annotIndex:idx};const start=pagePointFromEvent(e,layer,bounds)
    this.dragAnnot={kind:'line',mode,pointerId:e.pointerId,idx,start,last:start,origLine:origLine.map(p=>[...p]),bounds,scale}
    const move=ev=>{if(ev.pointerId!==e.pointerId)return;this.dragAnnot.last=pagePointFromEvent(ev,layer,bounds);this.previewAnnotLineDrag()}
    const up=ev=>{if(ev.pointerId!==e.pointerId)return;layer.removeEventListener('pointermove',move);layer.removeEventListener('pointerup',up);this.commitAnnotLineDrag()}
    layer.addEventListener('pointermove',move);layer.addEventListener('pointerup',up)
  }

  previewAnnotLineDrag(){
    const d=this.dragAnnot;if(!d||d.kind!=='line')return
    const [[x1,y1],[x2,y2]]=this.draggedLinePoints(d),svg=$(`.annot-vector-overlay[data-annot="${d.idx}"]`,this.els.stageScroll);if(!svg)return
    const px=p=>[(p[0]-d.bounds[0])*d.scale,(p[1]-d.bounds[1])*d.scale]
    const a=px([x1,y1]),b=px([x2,y2]);$$('line',svg).forEach(l=>{l.setAttribute('x1',a[0]);l.setAttribute('y1',a[1]);l.setAttribute('x2',b[0]);l.setAttribute('y2',b[1])})
    const handles=$$('.annot-line-handle',svg);if(handles[0]){handles[0].setAttribute('cx',a[0]);handles[0].setAttribute('cy',a[1])}if(handles[1]){handles[1].setAttribute('cx',b[0]);handles[1].setAttribute('cy',b[1])}
  }

  draggedLinePoints(d){
    const p1=[...d.origLine[0]],p2=[...d.origLine[1]],dx=d.last[0]-d.start[0],dy=d.last[1]-d.start[1]
    if(d.mode==='p1'){p1[0]+=dx;p1[1]+=dy}else if(d.mode==='p2'){p2[0]+=dx;p2[1]+=dy}else{p1[0]+=dx;p1[1]+=dy;p2[0]+=dx;p2[1]+=dy}
    const clampPt=p=>[clamp(p[0],d.bounds[0],d.bounds[2]),clamp(p[1],d.bounds[1],d.bounds[3])]
    return[clampPt(p1),clampPt(p2)]
  }

  async commitAnnotLineDrag(){
    const d=this.dragAnnot;if(!d||d.kind!=='line')return;this.dragAnnot=null
    const [p1,p2]=this.draggedLinePoints(d),page=this.project.loadPage(this.currentPage)
    try{const a=page.getAnnotations()[d.idx];if(!a)return;this.withAnnotationOperation('Edit line annotation',()=>{a.setLine(p1,p2);a.update();page.update()});this.pageMeta[this.currentPage].modified=true}finally{page.destroy?.()}
    await this.refreshCurrentAnnotationPage()
  }

  beginAnnotInkDrag(e,idx,strokes,bounds,scale){
    if(this.tool!=='select')return
    e.stopPropagation();e.preventDefault();const layer=$('#interactionLayer',this.els.stageScroll);layer.setPointerCapture(e.pointerId);this.selectedAnnot={pageIndex:this.currentPage,annotIndex:idx}
    const start=pagePointFromEvent(e,layer,bounds);this.dragAnnot={kind:'ink',pointerId:e.pointerId,idx,start,last:start,strokes:strokes.map(st=>st.map(p=>[...p])),bounds,scale}
    const move=ev=>{if(ev.pointerId!==e.pointerId)return;this.dragAnnot.last=pagePointFromEvent(ev,layer,bounds);this.previewAnnotInkDrag()}
    const up=ev=>{if(ev.pointerId!==e.pointerId)return;layer.removeEventListener('pointermove',move);layer.removeEventListener('pointerup',up);this.commitAnnotInkDrag()}
    layer.addEventListener('pointermove',move);layer.addEventListener('pointerup',up)
  }

  draggedInkStrokes(d){
    let dx=d.last[0]-d.start[0],dy=d.last[1]-d.start[1],pts=d.strokes.flat();if(!pts.length)return d.strokes
    const xs=pts.map(p=>p[0]+dx),ys=pts.map(p=>p[1]+dy);if(Math.min(...xs)<d.bounds[0])dx+=d.bounds[0]-Math.min(...xs);if(Math.max(...xs)>d.bounds[2])dx+=d.bounds[2]-Math.max(...xs);if(Math.min(...ys)<d.bounds[1])dy+=d.bounds[1]-Math.min(...ys);if(Math.max(...ys)>d.bounds[3])dy+=d.bounds[3]-Math.max(...ys)
    return d.strokes.map(st=>st.map(p=>[p[0]+dx,p[1]+dy]))
  }

  previewAnnotInkDrag(){
    const d=this.dragAnnot;if(!d||d.kind!=='ink')return;const strokes=this.draggedInkStrokes(d),svg=$(`.annot-vector-overlay[data-annot="${d.idx}"]`,this.els.stageScroll);if(!svg)return
    const polylines=$$('polyline',svg);strokes.forEach((st,i)=>{const pts=st.map(p=>`${(p[0]-d.bounds[0])*d.scale},${(p[1]-d.bounds[1])*d.scale}`).join(' ');if(polylines[i*2])polylines[i*2].setAttribute('points',pts);if(polylines[i*2+1])polylines[i*2+1].setAttribute('points',pts)})
  }

  async commitAnnotInkDrag(){
    const d=this.dragAnnot;if(!d||d.kind!=='ink')return;this.dragAnnot=null;const strokes=this.draggedInkStrokes(d),page=this.project.loadPage(this.currentPage)
    try{const a=page.getAnnotations()[d.idx];if(!a)return;this.withAnnotationOperation('Move ink annotation',()=>{a.setInkList(strokes);a.update();page.update()});this.pageMeta[this.currentPage].modified=true}finally{page.destroy?.()}
    await this.refreshCurrentAnnotationPage()
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
      this.withAnnotationOperation(d.kind==='move'?'Move annotation':'Resize annotation',()=>{
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
    this.refreshCurrentAnnotationPage()
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
    try{this.withAnnotationOperation('Delete annotation',()=>{x.page.deleteAnnotation(x.annot);x.page.update()});this.pageMeta[this.currentPage].modified=true;this.selectedAnnot=null}finally{x.page.destroy?.()}
    this.refreshCurrentAnnotationPage()
  }

  updateSelectedAnnotationStyle(style=this.annotStyle) {
    const x=this.getSelectedAnnotation();if(!x)return
    let newIndex=x.index
    try{
      const kind=this.annotationKind(x.annot),meta=parseAnnotMeta(x.annot),c=hexToRgb(style.color),bounds=x.annot.getBounds()
      this.withAnnotationOperation('Change annotation style',()=>{
        let a=x.annot
        if(kind==='rectangle'){
          const wantRounded=style.rectCornerStyle==='rounded',isRounded=String(a.getType?.())==='Ink'&&meta.tool==='rectangle'
          if(wantRounded!==isRounded){
            x.page.deleteAnnotation(a)
            a=this.createRectangleAnnotation(x.page,bounds,c,style);a.update();newIndex=x.page.getAnnotations().length-1
          }
        }
        try{a.setColor(c)}catch{};try{a.setOpacity(style.opacity)}catch{};try{if(a.hasBorder?.())a.setBorderWidth(style.width)}catch{}
        if(kind==='line'||kind==='arrow'||kind==='rectangle')applyAnnotDash(a,style.lineStyle)
        if(kind==='line'||kind==='arrow'){try{a.setLineEndingStyles('None',kind==='arrow'?(style.arrowStyle==='open'?'OpenArrow':'ClosedArrow'):'None')}catch{};setAnnotMeta(a,{...parseAnnotMeta(a),tool:kind,dash:style.lineStyle,arrow:style.arrowStyle})}
        else if(kind==='rectangle')setAnnotMeta(a,{...parseAnnotMeta(a),tool:'rectangle',corner:style.rectCornerStyle,dash:style.lineStyle})
        else if(kind==='text'){try{a.setDefaultAppearance('Helv',style.fontSize,c)}catch{}}
        a.update();x.page.update()
      });this.pageMeta[this.currentPage].modified=true;this.selectedAnnot={pageIndex:this.currentPage,annotIndex:newIndex}
    }finally{x.page.destroy?.()}
    this.refreshCurrentAnnotationPage()
  }

  async refreshCurrentAnnotationPage(){
    // Repaint only the active one-page surface plus its sidebar thumbnail.
    // The full PDF.js project snapshot is refreshed lazily when continuous view returns.
    if(this.viewMode==='single')await this.renderStage()
    this.syncSidebarSelection();this.syncStageSelection();this.updateButtons()
    const item=$(`.page-item[data-page="${this.currentPage}"]`,this.els.pageList)
    if(item){const canvas=$('canvas',item),loading=$('.thumb-loading',item);if(canvas){canvas.dataset.renderState='loading';try{const target=Math.min(Number(this.settings.thumbnailWidth)||150,Math.max(92,this.els.sidebar.clientWidth-28));await this.renderMupdfFallbackToCanvas(this.currentPage,canvas,{cssWidth:target,maxDpr:1.5});canvas.dataset.renderState='done';loading?.remove();item.classList.add('rendered')}catch(e){console.warn('annotation thumbnail refresh',e);canvas.dataset.renderState='error'}}}
  }

  async exportSelectedImage(fmt='png') {
    const indices=this.targets();if(!indices.length)return
    for(const i of indices){
      let page,pix,b
      try{page=this.project.loadPage(i);const scale=(this.settings.exportDpi||240)/72;pix=page.toPixmap(mupdf.Matrix.scale(scale,scale),mupdf.ColorSpace.DeviceRGB,false,true);b=fmt==='jpg'?pix.asJPEG?.(92):pix.asPNG();if(!b)throw new Error(this.t('noJpeg'));downloadBytes(asBytes(b).slice(),`page_${i+1}.${fmt}`,fmt==='jpg'?'image/jpeg':'image/png')}
      finally{try{b?.destroy?.()}catch{};try{pix?.destroy?.()}catch{};try{page?.destroy?.()}catch{}}
      await new Promise(r=>setTimeout(r,20))
    }
    this.setStatus(`Exported ${indices.length} page image${indices.length>1?'s':''}.`)
  }

  renderInspector() { /* Right inspector removed; contextual properties live in dialogs/settings. */ }

  annotationStyleFrom(a,kind){
    const style={...this.annotStyle},meta=parseAnnotMeta(a)
    try{const c=a.getColor?.();if(c?.length)style.color=rgbToHex(c)}catch{}
    try{const o=a.getOpacity?.();if(Number.isFinite(o))style.opacity=o}catch{}
    try{const w=a.getBorderWidth?.();if(Number.isFinite(w)&&w>0)style.width=w}catch{}
    if(['line','arrow','rectangle'].includes(kind)){
      try{const n=a.getBorderDashCount?.()||0;if(n>0){const first=Number(a.getBorderDashItem?.(0))||0;style.lineStyle=first<=3?'dotted':'dashed'}else style.lineStyle='solid'}catch{}
    }
    if(kind==='arrow'){
      try{const e=a.getLineEndingStyles?.();style.arrowStyle=e?.end==='OpenArrow'?'open':'closed'}catch{style.arrowStyle=meta.arrow==='open'?'open':'closed'}
    }
    if(kind==='rectangle')style.rectCornerStyle=meta.corner==='rounded'?'rounded':'square'
    if(kind==='text')try{const da=a.getDefaultAppearance?.();if(Number.isFinite(da?.size))style.fontSize=da.size}catch{}
    return style
  }

  annotationStyleFields(settingsMode=false, kind='all') {
    const hex=String(this.annotStyle.color||'#ffcc33').toUpperCase()
    const pct=Math.round(clamp(Number(this.annotStyle.opacity)||0,0,1)*100)
    const showLine=['all','line','arrow','rectangle'].includes(kind),showArrow=['all','arrow'].includes(kind),showCorner=['all','rectangle'].includes(kind),showText=['all','text'].includes(kind)
    const extraPlain=`${showLine?`<div class="field-row"><label>${this.t('lineStyle')}</label><select data-style="lineStyle"><option value="solid" ${this.annotStyle.lineStyle==='solid'?'selected':''}>${this.t('solid')}</option><option value="dashed" ${this.annotStyle.lineStyle==='dashed'?'selected':''}>${this.t('dashed')}</option><option value="dotted" ${this.annotStyle.lineStyle==='dotted'?'selected':''}>${this.t('dotted')}</option></select></div>`:''}${showCorner?`<div class="field-row"><label>${this.t('cornerStyle')}</label><select data-style="rectCornerStyle"><option value="square" ${this.annotStyle.rectCornerStyle==='square'?'selected':''}>${this.t('squareCorners')}</option><option value="rounded" ${this.annotStyle.rectCornerStyle==='rounded'?'selected':''}>${this.t('roundedCorners')}</option></select></div>`:''}${showArrow?`<div class="field-row"><label>${this.t('arrowhead')}</label><select data-style="arrowStyle"><option value="closed" ${this.annotStyle.arrowStyle==='closed'?'selected':''}>${this.t('closedArrow')}</option><option value="open" ${this.annotStyle.arrowStyle==='open'?'selected':''}>${this.t('openArrow')}</option></select></div>`:''}${showText?`<div class="field-row"><label>${this.t('textSize')}</label><span class="style-number-unit"><input type="number" data-style="fontSize" min="6" max="96" step="1" value="${this.annotStyle.fontSize}"><span>pt</span></span></div>`:''}`
    if(!settingsMode) return `<div class="field-row"><label>${this.t('color')}</label><div class="style-color-control"><input type="color" data-style="color" value="${esc(this.annotStyle.color)}"><input class="style-hex" type="text" data-style-peer="colorHex" value="${esc(hex)}" maxlength="7" spellcheck="false"></div></div>
      <div class="field-row"><label>${this.t('opacity')}</label><div class="style-range-control"><input type="range" data-style="opacity" min="0" max="1" step="0.01" value="${this.annotStyle.opacity}"><span class="style-number-unit"><input type="number" data-style-peer="opacityPercent" min="0" max="100" step="1" value="${pct}"><span>%</span></span></div></div>
      <div class="field-row"><label>${this.t('lineWidth')}</label><span class="style-number-unit"><input type="number" data-style="width" min="0.5" max="20" step="0.5" value="${this.annotStyle.width}"><span>pt</span></span></div>${extraPlain}`
    return `<div class="settings-row"><label>${this.t('color')}</label><div class="settings-control settings-value-wide style-color-control"><input class="settings-color" type="color" data-style="color" value="${esc(this.annotStyle.color)}" aria-label="${this.t('color')}"><input class="style-hex" type="text" data-style-peer="colorHex" value="${esc(hex)}" maxlength="7" spellcheck="false" aria-label="${this.t('color')} HEX"></div></div>
      <div class="settings-row"><label>${this.t('opacity')}</label><div class="settings-control settings-value-wide style-range-control"><input class="settings-range" type="range" data-style="opacity" min="0" max="1" step="0.01" value="${this.annotStyle.opacity}" aria-label="${this.t('opacity')}"><span class="style-number-unit"><input type="number" data-style-peer="opacityPercent" min="0" max="100" step="1" value="${pct}" aria-label="${this.t('opacity')}"><span>%</span></span></div></div>
      <div class="settings-row"><label>${this.t('lineWidth')}</label><div class="settings-control settings-value-compact style-number-unit"><input type="number" data-style="width" min="0.5" max="20" step="0.5" value="${this.annotStyle.width}"><span>pt</span></div></div>
      <div class="settings-row"><label>${this.t('textSize')}</label><div class="settings-control settings-value-compact style-number-unit"><input type="number" data-style="fontSize" min="6" max="96" step="1" value="${this.annotStyle.fontSize}"><span>pt</span></div></div>
      <details class="settings-advanced"><summary>${this.t('advancedAnnotationSettings')}</summary><div class="settings-advanced-body">
        <div class="settings-row"><label>${this.t('lineStyle')}</label><div class="settings-control settings-value-standard"><select data-style="lineStyle"><option value="solid" ${this.annotStyle.lineStyle==='solid'?'selected':''}>${this.t('solid')}</option><option value="dashed" ${this.annotStyle.lineStyle==='dashed'?'selected':''}>${this.t('dashed')}</option><option value="dotted" ${this.annotStyle.lineStyle==='dotted'?'selected':''}>${this.t('dotted')}</option></select></div></div>
        <div class="settings-row"><label>${this.t('cornerStyle')}</label><div class="settings-control settings-value-standard"><select data-style="rectCornerStyle"><option value="square" ${this.annotStyle.rectCornerStyle==='square'?'selected':''}>${this.t('squareCorners')}</option><option value="rounded" ${this.annotStyle.rectCornerStyle==='rounded'?'selected':''}>${this.t('roundedCorners')}</option></select></div></div>
        <div class="settings-row"><label>${this.t('arrowhead')}</label><div class="settings-control settings-value-standard"><select data-style="arrowStyle"><option value="closed" ${this.annotStyle.arrowStyle==='closed'?'selected':''}>${this.t('closedArrow')}</option><option value="open" ${this.annotStyle.arrowStyle==='open'?'selected':''}>${this.t('openArrow')}</option></select></div></div>
      </div></details>`
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
    let type='',kind='all',editStyle
    try{type=x.annot.getType();kind=this.annotationKind(x.annot);editStyle=this.annotationStyleFrom(x.annot,kind)}finally{x.page.destroy?.()}
    const creationDefaults=this.annotStyle
    this.annotStyle=editStyle
    this.modal(this.t('annotationProperties'),`
      <div class="inspector-section" style="padding:0;border:0"><h3>${this.t('selectedAnnotation')}</h3>
      <div class="field-row"><label>${this.t('type')}</label><div>${esc(type)}</div></div>${this.annotationStyleFields(false,kind)}</div>`,
      [{label:this.t('cancel')},{label:this.t('delete'),onClick:()=>{this.annotStyle=creationDefaults;this.deleteSelectedAnnotation();return true}},{label:this.t('apply'),primary:true,onClick:m=>{
        const style={...editStyle}
        $$('[data-style]',m).forEach(inp=>{const k=inp.dataset.style;style[k]=inp.type==='range'||inp.type==='number'?Number(inp.value):inp.type==='checkbox'?inp.checked:inp.value})
        this.annotStyle=creationDefaults;this.updateSelectedAnnotationStyle(style);return true
      }}],m=>this.wireAnnotationStyleFields(m),()=>{this.annotStyle=creationDefaults})
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
    try{
      const blob=await this.displayRenderer.renderToBlob(index,{cssScale:scale,type:'image/png'})
      const bytes=new Uint8Array(await blob.arrayBuffer())
      return{url:URL.createObjectURL(blob),bytes}
    }catch(error){
      console.warn('PDF.js compare render failed; using MuPDF.js fallback',error)
      let p,pix,b
      try{p=this.project.loadPage(index);pix=p.toPixmap(mupdf.Matrix.scale(scale,scale),mupdf.ColorSpace.DeviceRGB,false,true);b=pix.asPNG();const bytes=asBytes(b).slice();return{url:URL.createObjectURL(new Blob([bytes],{type:'image/png'})),bytes}}finally{b?.destroy?.();pix?.destroy?.();p?.destroy?.()}
    }
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
          <div class="settings-row"><label for="setTheme">${this.t('theme')}</label><div class="settings-control settings-value-standard"><select id="setTheme"><option value="system" ${s.theme==='system'?'selected':''}>${this.t('system')}</option><option value="light" ${s.theme==='light'?'selected':''}>${this.t('light')}</option><option value="dark" ${s.theme==='dark'?'selected':''}>${this.t('dark')}</option><option value="black" ${s.theme==='black'?'selected':''}>${this.t('black')}</option></select></div></div>
        </section>

        <section class="settings-group">
          <h3>${this.t('filesAndExport')}</h3>
          <div class="settings-row"><label for="setImageOri">${this.t('imageImportOrientation')}</label><div class="settings-control settings-value-wide"><select id="setImageOri"><option value="auto" ${s.imageOrientation==='auto'?'selected':''}>${this.t('keepOrientation')}</option><option value="portrait" ${s.imageOrientation==='portrait'?'selected':''}>${this.t('portraitPage')}</option><option value="landscape" ${s.imageOrientation==='landscape'?'selected':''}>${this.t('landscapePage')}</option></select></div></div>
          <div class="settings-row settings-row-help"><label for="setExportQuality">${this.t('imageExportQuality')}</label><div class="settings-control export-quality-control"><select id="setExportQuality">${qualityOptions}</select><span class="settings-unit-control"><input id="setDpi" type="number" min="72" max="600" step="1" value="${s.exportDpi||240}"><span>DPI</span></span></div><p class="settings-help">${this.t('exportQualityHelp')}</p></div>
        </section>

        <section class="settings-group">
          <h3>${this.t('annotations')}</h3>
          <div class="settings-row settings-row-help"><label for="setTextOnly">${this.t('highlightSetting')}</label><div class="settings-control settings-toggle-control"><label class="settings-switch"><input id="setTextOnly" type="checkbox" role="switch" ${this.annotStyle.highlightTextOnly?'checked':''} aria-label="${this.t('preferTextLayer')}"><span>${this.t('preferTextLayer')}</span></label></div><p class="settings-help">${this.t('highlightHelp')}</p></div>
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
        $('#settingsFile',m).onchange=async e=>{try{const obj=JSON.parse(await e.target.files[0].text());this.settings={...this.settings,...obj,annotStyle:{...this.annotStyle,...(obj.annotStyle||{})}};this.annotStyle=this.settings.annotStyle;this.language=this.settings.language||this.language;this.saveSettings();this.applyTheme();$('[data-close]',m)?.click();this.buildShell();this.updateAll();this.toast(this.t('settingsImported'))}catch(err){this.fail(err)}}
      })
  }

  openAbout() {
    const version=APP_VERSION
    this.modal(this.t('about'),`<div class="about-panel">
      <img class="about-app-icon" src="./assets/app_icon.png" alt="PackDocFit">
      <h2>PackDocFit</h2>
      <div class="about-subtitle">${this.t('appSubtitle')} · v${version} · Build ${APP_BUILD}</div>
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
      $('[data-about-action="help"]',m).onclick=()=>{$('[data-close]',m)?.click();this.openHelp()}
    })
  }

  openHelp() {
    const mod=this.modKey()
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
    if(kind==='overflow'){
      const all=[]
      for(const [groupKey,labelKey] of [['file','file'],['edit','edit'],['page','page'],['view','view'],['compare','compare'],['settings','settings']]){
        for(const [label,action] of menus[groupKey]) all.push([`${this.t(labelKey)} · ${label}`,action])
      }
      menus.overflow=all
    }
    document.querySelector('.menu-popover')?.remove()
    const items=menus[kind]||[]; const r=anchor.getBoundingClientRect(); const pop=document.createElement('div');pop.className='menu-popover';pop.setAttribute('role','menu');pop.style.left=`${Math.min(r.left,window.innerWidth-230)}px`;pop.style.top=`${Math.min(r.bottom+3,window.innerHeight-20)}px`
    pop.innerHTML=items.map(([l,a])=>`<button type="button" role="menuitem" data-pop="${a}">${esc(l)}</button>`).join('')
    document.body.append(pop);anchor.setAttribute('aria-expanded','true')
    const buttons=$$('[role="menuitem"]',pop)
    const close=(restore=false)=>{pop.remove();anchor.setAttribute('aria-expanded','false');document.removeEventListener('pointerdown',outside,true);if(restore)anchor.focus()}
    const outside=e=>{if(!pop.contains(e.target)&&e.target!==anchor)close(false)}
    buttons.forEach(b=>b.onclick=async()=>{close(false);await this.menuAction(b.dataset.pop)})
    pop.addEventListener('keydown',e=>{
      const active=Math.max(0,buttons.indexOf(document.activeElement))
      if(e.key==='ArrowDown'){e.preventDefault();buttons[(active+1)%buttons.length]?.focus()}
      else if(e.key==='ArrowUp'){e.preventDefault();buttons[(active-1+buttons.length)%buttons.length]?.focus()}
      else if(e.key==='Home'){e.preventDefault();buttons[0]?.focus()}
      else if(e.key==='End'){e.preventDefault();buttons.at(-1)?.focus()}
      else if(e.key==='Escape'){e.preventDefault();close(true)}
      else if(e.key==='Tab'){close(false)}
    })
    setTimeout(()=>document.addEventListener('pointerdown',outside,true),0)
    buttons[0]?.focus()
  }

  zoomStage(factor) {
    if(this.viewMode==='single') {
      this.zoom=clamp(this.zoom*factor,.25,4)
      this.settings.zoom=this.zoom
    } else {
      this.columnZoom=clamp(this.columnZoom*factor,.18,1.8)
      this.settings.continuousZoom=this.columnZoom
    }
    this.saveSettings()
    this.renderStage()
  }

  async menuAction(a) {
    const map={new:()=>this.newProject(true),open:()=>this.els.fileInput.click(),save:()=>this.save(false),saveAs:()=>this.save(true),extract:()=>this.extractSelected(),exportPng:()=>this.exportSelectedImage('png'),exportJpg:()=>this.exportSelectedImage('jpg'),undo:()=>this.undo(),redo:()=>this.redo(),copy:()=>this.copyPages(false),cut:()=>this.copyPages(true),paste:()=>this.pastePages(),selectAll:()=>{this.selected=new Set(Array.from({length:this.pageCount()},(_,i)=>i));this.updateAll()},delete:()=>this.deleteSelectedPages(),rotateR:()=>this.rotateSelected(90),rotateL:()=>this.rotateSelected(-90),rotate180:()=>this.rotateSelected(180),fit:()=>this.openFitDialog(),continuous:()=>this.setViewMode('continuous'),single:()=>this.setViewMode('single'),zoomIn:()=>this.zoomStage(1.15),zoomOut:()=>this.zoomStage(.87),compareH:()=>this.openCompare('horizontal'),compareV:()=>this.openCompare('vertical'),compareO:()=>this.openCompare('overlay'),settings:()=>this.openSettings(),help:()=>this.openHelp(),about:()=>this.openAbout(),annotationProps:()=>this.openAnnotationProperties()};await map[a]?.()
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
    else if(e.key==='Escape'){this.selectedAnnot=null;this.dragDrawing=null;this.dragAnnot=null;this.tool='select';window.getSelection()?.removeAllRanges();if(this.viewMode==='single')this.renderStage();else this.updateAll();this.updateButtons()}
    else if(this.viewMode==='single'&&!typing&&['ArrowRight','PageDown'].includes(e.key)){e.preventDefault();this.stepPage(1)}
    else if(this.viewMode==='single'&&!typing&&['ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();this.stepPage(-1)}
  }

  stepPage(d){if(!this.pageCount())return;this.currentPage=clamp(this.currentPage+d,0,this.pageCount()-1);this.selected=new Set([this.currentPage]);this.anchorPage=this.currentPage;this.updateAll()}

  modal(title,body,buttons=[{label:'Close'}],onMount=null,onClose=null) {
    const previousFocus=document.activeElement
    const id=`pdf-modal-${Math.random().toString(36).slice(2,9)}`
    const back=document.createElement('div');back.className='modal-backdrop';back.innerHTML=`<div class="modal" role="dialog" aria-modal="true" aria-labelledby="${id}"><div class="modal-head"><h2 id="${id}">${esc(title)}</h2><button class="small-button" type="button" data-close aria-label="${esc(this.t('close'))}">✕</button></div><div class="modal-body">${body}</div><div class="modal-foot">${buttons.map((b,i)=>`<button class="small-button ${b.primary?'primary':''}" type="button" data-modal-button="${i}">${esc(b.label)}</button>`).join('')}</div></div>`
    document.body.append(back)
    const dialog=$('.modal',back)
    const focusables=()=>$$('button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])',dialog).filter(el=>el.offsetParent!==null)
    let closed=false
    const close=()=>{if(closed)return;closed=true;onClose?.();back.remove();if(previousFocus?.isConnected)previousFocus.focus?.()}
    $('[data-close]',back).onclick=close
    back.addEventListener('pointerdown',e=>{if(e.target===back)close()})
    back.addEventListener('keydown',e=>{
      if(e.key==='Escape'){e.preventDefault();close();return}
      if(e.key!=='Tab')return
      const list=focusables();if(!list.length){e.preventDefault();dialog.focus?.();return}
      const first=list[0],last=list.at(-1)
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
    })
    $$('[data-modal-button]',back).forEach(b=>b.onclick=async()=>{const cfg=buttons[+b.dataset.modalButton];let should=true;if(cfg.onClick)should=await cfg.onClick(back)!==false;if(should)close()})
    onMount?.(back)
    requestAnimationFrame(()=>{const preferred=$('input:not([type="hidden"]):not([disabled]), select:not([disabled]), button[data-modal-button].primary',dialog);(preferred||focusables()[0]||dialog).focus?.()})
    return back
  }

  loadSettings() {
    const defaults={language:'ko',theme:'system',imageOrientation:'auto',exportQuality:'normal',exportDpi:240,zoom:1,continuousZoom:1,viewMode:'continuous',compareMode:'horizontal',sidebarWidth:245,filesSplitPct:24,thumbnailWidth:150,annotStyle:{color:'#ffcc33',opacity:.45,width:2,fontSize:14,highlightTextOnly:true,lineStyle:'solid',rectCornerStyle:'square',arrowStyle:'closed'}}
    try{
      const x=JSON.parse(localStorage.getItem('packdocfit-settings')||'{}')
      if(!x.exportQuality && Number.isFinite(Number(x.exportDpi))){const dpi=Number(x.exportDpi);x.exportQuality=dpi===120?'low':dpi===240?'normal':dpi===360?'high':'custom'}
      return{...defaults,...x,annotStyle:{...defaults.annotStyle,...(x.annotStyle||{})}}
    }catch{return defaults}
  }
  saveSettings(){localStorage.setItem('packdocfit-settings',JSON.stringify(this.settings))}
  applyTheme(){
    const t=this.settings.theme==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):this.settings.theme
    document.documentElement.dataset.theme=['light','dark','black'].includes(t)?t:'light'
    const meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.setAttribute('content',t==='black'?'#000000':t==='dark'?'#0D1117':'#F6F1E8')
  }
  bindSystemThemeListener(){
    if(this.systemThemeMedia)return
    this.systemThemeMedia=matchMedia('(prefers-color-scheme: dark)')
    this.systemThemeListener=()=>{if(this.settings.theme==='system')this.applyTheme()}
    if(this.systemThemeMedia.addEventListener)this.systemThemeMedia.addEventListener('change',this.systemThemeListener);else this.systemThemeMedia.addListener?.(this.systemThemeListener)
  }
}
