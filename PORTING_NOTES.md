# PackDocFit porting notes

## v0.1.5

- Rebuilt the document display path around a split-engine architecture: **MuPDF.js = editing**, **PDF.js = display**. PDF.js now renders the left thumbnails, continuous preview, single-page preview, and comparison images. MuPDF.js remains the source of truth for page operations, annotations, text coordinates, security, undo/redo and saving.
- Added a MuPDF.js rendering fallback so a PDF.js display failure produces a recoverable preview path instead of a blank work area.
- Fixed the initial web renderer's PNG conversion assumption so current MuPDF.js byte-return values are handled correctly.
- Changed the left sidebar to match the Windows Build 29 information hierarchy: compact file rows above, large visual page thumbnails below. Removed the permanent Files / Pages heading rows.
- Changed continuous view to start as a centered one-column document surface at normal zoom. Ctrl+wheel zooming can naturally flow into multiple columns, following the Windows adaptive viewing model.
- Added lazy near-viewport rendering for both the central continuous view and the page-thumbnail sidebar, with visible loading placeholders and explicit preview-error states.
- Added Ctrl+wheel thumbnail sizing in the page sidebar, made View → Zoom follow the active continuous/single view, and preserved the draggable Files/Pages and sidebar/preview splitters.
- Added direct page drag reorder in the continuous preview and double-click entry into single-page view.
- Added bundled PDF.js worker plus packaged CMaps / standard fonts / ICC / WASM support during the Vite build for better real-world and CJK rendering compatibility.
- GitHub Actions/Vite build is now the supported Pages deployment path because the display renderer is bundled from `pdfjs-dist`; direct unbuilt branch serving is no longer treated as a supported fallback.

## v0.1.4

- Replaced raw DPI-first image export settings with result-first quality presets: Low (120 DPI), Normal (240 DPI), High quality (360 DPI), and Custom (72–600 DPI). The actual DPI is always visible next to the preset.
- Added explicit annotation value readouts and direct entry: HEX color, opacity percentage, line width in pt, and text size in pt.
- Moved PDF output password controls out of global Settings and into the PDF save workflow. Passwords are project/session state and are not stored in PackDocFit settings.
- Added password confirmation before encrypted PDF saving.
- Expanded About with app version, developer email, GitHub, Windows Releases, and a localized usage guide.
- Added a localized quick-start / feature / shortcut help view, with Ctrl vs Command shown according to platform.
- Added How to use to the Settings menu for direct access.

## v0.1.3

- Reworked Settings into a compact, section-based information architecture.
- Grouped global app options together and moved file/export, annotation, and PDF security options into distinct semantic sections.
- Moved highlight behavior into the Annotation section.
- Renamed the ambiguous Export DPI setting to Image export resolution and added visible help explaining that it affects PNG/JPG export only.
- Added natural-width settings value lanes and a narrower Settings dialog, with a stacked responsive layout for narrow screens.
- Clarified that importing settings applies immediately.

## v0.1.2

- Added Korean, English, Japanese and Spanish UI languages. Korean is the default for a fresh install and can be changed in Settings.
- Removed the right inspector panel and bottom status bar to give the document preview more room.
- Moved annotation defaults into Settings. Selected annotation properties are available from Edit → Annotation properties or by double-clicking an annotation.
- Added draggable splitters matching the Windows layout concept: sidebar width and Files/Pages vertical split are resizable and remembered in localStorage. Double-click a splitter to reset it.
- Reused the existing Windows PDF Editor app icon for the web header, favicon and About dialog.

# PackDocFit web-port notes

Source reference: PDF Editor v0.14.4 Build 29 (Windows).

## v0.1.1 deployment fix

The first GitHub Pages test could display a completely white page when the JavaScript application did not start. The deployment path has been hardened in v0.1.1:

- `index.html` now uses relative project paths (`./src/...`) instead of a root-absolute module path.
- The stylesheet is linked directly from HTML so direct branch deployment does not fail on a browser CSS import.
- MuPDF.js 1.28.1 is pinned through an import map and externalized from the Vite bundle.
- The same source tree can therefore start when Pages serves the branch directly, while GitHub Actions remains the recommended deployment method.
- A visible loading screen and fatal-startup diagnostics replace the previous blank-page failure mode.
- The Pages workflow now runs `actions/configure-pages` before artifact upload.

## Porting approach

The Windows application is not wrapped or executed inside the browser. PackDocFit reimplements its workflow for the web while keeping PDF processing local.

- Windows PySide6 UI → HTML/CSS/JavaScript UI
- PyMuPDF PDF editing → MuPDF.js / WebAssembly
- Native file dialogs → browser File APIs
- JSON settings file → localStorage + settings import/export
- Windows PDFium display role → PDF.js display rendering
- MuPDF.js remains the browser-side editing and save engine

## Implemented in the initial port

- Multiple PDF/image import
- Password prompt for encrypted input PDFs
- SHA-256 duplicate detection
- File-level grouping, reorder and removal
- Page thumbnails and page-level reorder
- Merge / extract / delete / copy / cut / paste / rotate
- Width fitting and standard paper-size fitting
- Continuous auto-multi-column view and single-page view
- Text-layer selection/copy without OCR
- Highlight / rectangle / line / arrow / ink / text annotations
- Annotation selection, movement, resize, style and deletion
- Journal-based undo / redo
- PNG/JPG page export
- Page comparison modes
- Output PDF password encryption
- Dark/light/system UI and settings persistence
- GitHub Pages deployment workflow

## Browser differences / follow-up verification

The browser cannot expose arbitrary absolute local file paths, so duplicate detection uses content hashes instead of Windows path identity.

Direct overwrite/save behavior depends on browser File System Access support. A download fallback is included.

The Windows build intentionally separates MuPDF editing from PDFium display rendering. PackDocFit v0.1.5 now follows the same architectural principle on the web: MuPDF.js edits and saves the PDF, while PDF.js renders thumbnails and previews. Real-world CID/CJK samples still need regression testing, but display is no longer tied to the editing engine.

Form widgets, links, unusually structured PDFs, very large files and all password/security permutations should be regression-tested with real-world samples before declaring one-to-one desktop parity.
