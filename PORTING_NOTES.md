# PackDocFit web-port notes

Source reference: PDF Editor v0.14.4 Build 29 (Windows).

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
