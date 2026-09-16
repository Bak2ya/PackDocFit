# PackDocFit

**Pack · Doc · Fit → PDF**  
**PDF editor on the web.**

🌐 **바로 실행 / Open Web App:** https://bak2ya.github.io/PackDocFit/  
🪟 **Windows 버전 / Windows Releases:** https://github.com/Bak2ya/PackDocFit/releases

---

## 한국어

PackDocFit은 브라우저에서 바로 사용할 수 있는 무료 오픈소스 PDF 편집기입니다.

PDF와 이미지 파일은 PackDocFit 서버로 업로드되지 않으며, PDF 편집 작업은 사용자의 브라우저 안에서 처리됩니다.

### 주요 기능

- 여러 PDF와 이미지 파일을 하나의 작업에 추가
- 파일 단위 및 페이지 단위 드래그 앤 드롭 순서 변경
- PDF 병합, 페이지 추출, 삭제, 복사, 잘라내기, 붙여넣기
- 페이지 회전 및 크기 조절
- 기준 폭 맞추기 및 표준 용지 크기 맞추기
- Windows 버전과 같은 작업 흐름의 연속 보기, 축소 시 다열 보기, 한 페이지 보기
- PDF 텍스트 레이어 선택 및 복사 (OCR 아님)
- 형광펜, 사각형, 직선, 화살표, 자유형 펜, 텍스트 주석
- 주석 이동, 크기 변경, 속성 변경 및 삭제
- Undo / Redo
- 암호가 설정된 PDF 열기
- PDF 저장 시 필요할 때 AES-256 암호 설정
- 페이지를 PNG/JPG 이미지로 내보내기 (낮게 / 일반 / 고품질 / 사용자 지정 DPI)
- 선택한 페이지 비교
- SHA-256을 이용한 중복 파일 확인
- 한국어 / 영어 / 일본어 / 스페인어 UI
- 라이트 / 다크 / 시스템 테마
- 파일 영역 ↔ 페이지 영역, 왼쪽 패널 ↔ 미리보기 영역 크기 드래그 조절
- 실제 페이지 썸네일 중심의 왼쪽 페이지 목록과 중앙 PDF 미리보기
- 설정 가져오기 / 내보내기
- 정보창에서 개발자 문의, GitHub, Windows 다운로드, 간단 사용법 확인

### 웹 버전 바로 사용하기

설치할 필요 없이 아래 주소에서 바로 실행할 수 있습니다.

**https://bak2ya.github.io/PackDocFit/**

PackDocFit은 정적 웹앱이며 PDF 파일 자체를 서버에 업로드하지 않습니다. PDF 편집은 MuPDF.js가 담당하고, 화면 미리보기와 썸네일은 PDF.js가 담당합니다. 웹 버전은 기존 Windows PDF Editor의 앱 아이콘과 파일/페이지/미리보기 작업 구조를 이어갑니다.

### Windows 버전

PackDocFit의 기반이 된 기존 Windows PDF Editor도 함께 배포할 예정입니다.

Windows 버전은 브라우저 버전과 달리 데스크톱 환경에서 직접 실행되며, 대용량 PDF나 네이티브 파일 작업이 필요한 경우 유용할 수 있습니다.

Windows 실행 파일은 이 저장소의 **GitHub Releases**에서 배포합니다. 웹앱의 **PackDocFit 정보 → Windows 버전 다운로드** 버튼에서도 같은 Releases 페이지로 바로 이동할 수 있습니다.

**https://github.com/Bak2ya/PackDocFit/releases**

> Windows 실행 파일이 아직 Releases에 올라오지 않았다면 준비 중인 상태입니다. 기존 Windows 프로그램을 새 배포 파일로 올린 뒤 이 안내를 그대로 사용할 수 있습니다.

### 정보 / 사용법

앱의 정보창에서는 다음 항목을 바로 열 수 있습니다.

- 문의 메일 보내기: `creative2ya@gmail.com`
- GitHub에서 보기
- Windows 버전 다운로드
- 사용법: 빠른 시작, 주요 기능, 현재 지원되는 단축키

PDF 암호는 앱 전역 설정에 저장하지 않습니다. PDF를 저장하거나 다른 이름으로 저장할 때 해당 저장 작업에서 필요할 경우 설정합니다.

### 개인정보 / 파일 처리

**사용자의 PDF 및 이미지 파일은 PackDocFit 서버로 업로드되지 않습니다.**

PDF 처리와 편집은 브라우저의 WebAssembly 및 File API를 이용해 로컬에서 수행됩니다. 단, 앱을 실행하기 위한 정적 파일과 오픈소스 라이브러리는 웹에서 내려받습니다.

### GitHub Pages 배포

권장 설정:

1. 저장소 이름을 `PackDocFit`으로 사용합니다.
2. 파일을 `main` 브랜치에 업로드합니다.
3. **Settings → Pages → Build and deployment → Source**를 **GitHub Actions**로 설정합니다.
4. `main`에 push하면 포함된 workflow가 자동으로 빌드하고 배포합니다.

이번 버전부터는 초기 로딩 화면과 오류 안내가 포함되어 있어, 앱 모듈 로딩이 실패해도 빈 흰 화면만 표시되지 않습니다.

### 로컬에서 실행

Node.js 20 이상(Node.js 22 권장):

```bash
npm install
npm run dev
```

프로덕션 빌드:

```bash
npm run build
npm run preview
```

---

## English

PackDocFit is a free and open-source PDF editor that runs in the browser.

Your PDF and image files are not uploaded to a PackDocFit server. PDF processing and editing happen locally in your browser.

### Features

- Open multiple PDF and image files in one project
- File-level and page-level drag-and-drop reordering
- Merge, extract, delete, copy, cut and paste pages
- Rotate and resize pages
- Fit pages to a reference width or standard paper sizes
- Continuous viewing matching the Windows workflow, adaptive multi-column viewing when zoomed out, and single-page viewing
- PDF text-layer selection and copy (no OCR)
- Highlight, rectangle, line, arrow, freehand ink and text annotations
- Move, resize, restyle and delete annotations
- Undo / redo
- Open password-protected PDFs
- Optionally apply AES-256 password encryption when saving a PDF
- Export pages as PNG or JPG with Low / Normal / High / Custom DPI quality choices
- Compare selected pages
- Duplicate-file detection using SHA-256
- Korean / English / Japanese / Spanish UI
- Light / dark / system theme
- Resizable Files / Pages split and resizable sidebar / preview workspace
- Page-thumbnail-focused sidebar and central PDF preview modeled after the Windows build
- Settings import and export
- About window with developer email, GitHub, Windows download, and an in-app usage guide

### Open the web app

No installation is required:

**https://bak2ya.github.io/PackDocFit/**

PackDocFit is a static web app. Your documents stay in your browser. MuPDF.js handles PDF editing, while PDF.js renders the page thumbnails and document preview. The web build reuses the app icon and the Files / Pages / Preview workflow from the original Windows PDF Editor.

### Windows version

The existing Windows PDF Editor that PackDocFit is based on will also be distributed from this repository.

The desktop build can be useful for users who prefer a native Windows application or work with large local documents.

Windows builds are distributed through **GitHub Releases**. The same page is available from **About PackDocFit → Download Windows version** in the web app.

**https://github.com/Bak2ya/PackDocFit/releases**

> If no Windows executable is listed yet, the Windows release is still being prepared.

### About / usage guide

The About window provides direct access to:

- Developer email: `creative2ya@gmail.com`
- View on GitHub
- Download Windows version
- How to use: quick start, major capabilities, and current keyboard shortcuts

PDF passwords are not stored as a global PackDocFit setting. Password protection is chosen in the save workflow for the current document.

### Privacy

**Your PDF and image documents are not uploaded to a PackDocFit server.**

Editing is performed locally using browser WebAssembly and File APIs. Static application files and open-source runtime libraries are downloaded from the web to run the app.

### GitHub Pages

Recommended deployment:

1. Use a repository named `PackDocFit`.
2. Push the project to the `main` branch.
3. Open **Settings → Pages → Build and deployment → Source** and select **GitHub Actions**.
4. Push to `main`; the included workflow builds and deploys the app automatically.

The startup screen now reports module/deployment errors instead of leaving users with an empty white page.

### Run locally

Node.js 20+ is required (Node.js 22 recommended).

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

---

## Technology

- JavaScript / HTML / CSS
- Vite
- MuPDF.js / WebAssembly — editing, page operations, annotations, save
- Mozilla PDF.js — thumbnails and document preview rendering
- Browser File APIs, Web Crypto and localStorage

## License

PackDocFit is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

MuPDF.js is also available under AGPL and commercial licensing terms. PackDocFit uses the AGPL-compatible open-source distribution.
