# PackDocFit porting notes

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
- Native rendering pipeline → browser-side MuPDF rendering in the initial web port

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

The Windows build used a split MuPDF-editing / PDFium-rendering architecture for specific CID-font rendering compatibility. The initial web port renders through MuPDF.js. If a known CID-font sample reproduces the Windows rendering issue in-browser, the web renderer should be split to PDF.js while keeping MuPDF.js as the editing engine.

Form widgets, links, unusually structured PDFs, very large files and all password/security permutations should be regression-tested with real-world samples before declaring one-to-one desktop parity.
