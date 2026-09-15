# PackDocFit

**PDF editor on the web.**

**Pack · Doc · Fit → PDF**

PackDocFit is a free and open-source browser PDF editor focused on practical page editing. Documents are processed locally in your browser; the app does not upload your PDF or image files to a server.

## What it does

- Open multiple PDF and image files in one project
- File-level and page-level drag-and-drop reordering
- Merge, extract, delete, copy, cut, paste and rotate pages
- Resize pages to a reference width or standard paper sizes
- Continuous / multi-column and single-page viewing
- PDF text-layer selection and copy (no OCR)
- Highlight, rectangle, line, arrow, freehand ink and text annotations
- Move, resize, restyle and delete annotations
- Undo / redo using MuPDF journaling
- Open password-protected PDFs
- Save unencrypted or AES-256 password-protected PDFs
- Export pages as PNG or JPG
- Compare selected pages side-by-side, vertically or as an overlay
- Duplicate-file detection using SHA-256
- Light / dark / system theme
- Local settings import and export

## Privacy

PackDocFit is a static web app. PDF processing happens in the browser with WebAssembly.

**Your documents stay on your device. Nothing is uploaded by PackDocFit.**

## Run locally

Requirements: Node.js 20+ (Node.js 22 recommended).

```bash
npm install
npm run dev
```

For a production build:

```bash
npm run build
npm run preview
```

## GitHub Pages

This repository includes a GitHub Actions workflow for Pages.

1. Create a repository named `PackDocFit`.
2. Upload/push these files to the `main` branch.
3. Open **Settings → Pages** in GitHub.
4. Set **Source** to **GitHub Actions**.
5. Push to `main`; the included workflow builds and deploys the site.

Vite is configured with a relative base path, so the same build works from a GitHub Pages project subdirectory.

## Browser notes

PackDocFit works as a browser app, so a few operating-system interactions differ from the Windows desktop version. Chromium-based browsers can use the File System Access API for a more desktop-like Save experience; other browsers fall back to downloading the edited PDF.

Very large documents can also hit browser memory limits earlier than a native desktop app. Page operations themselves are performed locally and do not require a backend server.

## Technology

- JavaScript / HTML / CSS
- Vite
- MuPDF.js / WebAssembly
- Browser File APIs, Web Crypto and localStorage

## License

PackDocFit is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

MuPDF is also distributed under the GNU AGPL and commercial licensing terms. See the MuPDF project for its licensing details.
