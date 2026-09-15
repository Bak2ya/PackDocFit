const STRINGS = {
  ko: {
    appSubtitle: '웹 PDF 편집기',
    file: '파일', edit: '편집', page: '페이지', view: '보기', compare: '비교', settings: '설정',
    localOnly: '로컬 처리 · 파일 업로드 없음',
    files: '파일', pages: '페이지',
    addFilesStart: 'PDF 또는 이미지를 추가하세요.',
    dropTitle: 'PDF 또는 이미지를 여기에 놓으세요',
    dropBody: 'PackDocFit은 브라우저 안에서 문서를 로컬로 편집합니다. 파일은 서버로 업로드되지 않습니다.',
    dropNote: 'Ctrl+O 파일 추가 · GitHub Pages · AGPL 오픈소스',
    dropOverlay: 'PDF 또는 이미지 파일을 여기에 놓으세요',
    newProject: '새 작업', addFiles: '파일 추가', save: '저장', extract: '선택 페이지 추출',
    deletePages: '선택 페이지 삭제', rotateRight: '오른쪽으로 90° 회전', fitResize: '페이지 맞춤 / 크기 변경',
    undo: '실행 취소', redo: '다시 실행', continuous: '연속 보기', single: '한 페이지 보기',
    selectMove: '선택 / 이동', highlight: '형광펜', rectangle: '사각형', line: '직선', arrow: '화살표', ink: '자유형 펜', text: '텍스트',
    removeFile: '이 파일 제거', pageLabel: '페이지', modified: '수정됨',
    language: '언어', theme: '테마', system: '시스템', light: '라이트', dark: '다크',
    imageImport: '이미지 가져오기', keepOrientation: '이미지 방향 유지', portraitPage: '세로 페이지', landscapePage: '가로 페이지',
    exportDpi: '내보내기 DPI', highlightSetting: '형광펜', preferTextLayer: '드래그 영역 안의 텍스트 레이어를 우선 사용',
    pdfSecurity: 'PDF 보안', outputPassword: '출력 암호', noPassword: '암호 없음',
    outputPasswordHelp: '편집된 PDF를 저장할 때 적용됩니다. 암호화하지 않으려면 비워 두세요.',
    annotationDefaults: '주석 기본값', color: '색상', opacity: '불투명도', lineWidth: '선 두께', textSize: '텍스트 크기',
    exportSettings: '설정 내보내기', importSettings: '설정 가져오기', cancel: '취소', saveButton: '저장',
    settingsImported: '설정을 가져왔습니다.',
    mode: '방식', standardPaper: '표준 용지', targetWidth: '목표 폭', paper: '용지', orientation: '방향', auto: '자동', portrait: '세로', landscape: '가로', fit: '맞춤', fitInside: '안쪽에 맞춤', fillCrop: '채우기 / 넘침 자르기', width: '폭',
    fitVectorHelp: 'PDF의 벡터 페이지 내용을 변환합니다. 이 작업은 페이지를 의도적으로 래스터 이미지로 바꾸지 않습니다.',
    apply: '적용', close: '닫기', about: 'PackDocFit 정보',
    aboutBody: '무료 오픈소스 PDF 편집기입니다. PDF 처리는 MuPDF.js / WebAssembly를 이용해 브라우저 안에서 로컬로 수행되며, 문서는 서버로 업로드되지 않습니다.',
    annotationProperties: '주석 속성', selectedAnnotation: '선택한 주석', type: '종류', applyStyle: '스타일 적용', delete: '삭제',
    sideBySide: '나란히', vertical: '세로', overlay: '겹쳐 보기',
    newMenu: '새 작업', addFilesMenu: '파일 추가…', saveAs: '다른 이름으로 저장…', extractMenu: '선택 페이지 추출…', exportPng: '선택 페이지를 PNG로 내보내기', exportJpg: '선택 페이지를 JPG로 내보내기',
    copyPages: '페이지 복사', cutPages: '페이지 잘라내기', pastePages: '페이지 붙여넣기', selectAllPages: '모든 페이지 선택',
    rotateLeft: '왼쪽으로 90° 회전', rotate180: '180° 회전', zoomIn: '확대', zoomOut: '축소', annotationPropsMenu: '주석 속성…',
    confirmNew: '현재 작업을 버리고 새 작업을 시작할까요?',
    noSupported: '지원되는 PDF 또는 이미지 파일이 없습니다.',
    duplicateFile: '{name} 파일은 “{prev}”와 내용이 같습니다. 다시 추가할까요?',
    passwordRequired: '{name} 파일의 암호를 입력하세요:', incorrectPassword: '암호가 올바르지 않습니다.', unlockFailed: '{name}의 잠금을 해제하지 못했습니다.',
    removeFileConfirm: '“{name}” ({count}페이지)을 이 작업에서 제거할까요?',
    selectTwoCompare: '비교하려면 페이지를 2개 이상 선택하세요.',
    comparePages: '{a}페이지와 {b}페이지 비교',
    noJpeg: '현재 MuPDF 빌드에서는 JPEG 내보내기를 사용할 수 없습니다.',
    noAnnotation: '선택한 주석이 없습니다.',
    splitterReset: '더블클릭하면 기본 크기로 돌아갑니다.',
    deleteAllConfirm: '모든 페이지를 삭제할까요?', textPrompt: '텍스트를 입력하세요:', notPdf: 'PDF 문서가 아닙니다.',
    languageKo: '한국어', languageEn: 'English', languageJa: '日本語', languageEs: 'Español',
  },
  en: {
    appSubtitle: 'PDF editor on the web', file: 'File', edit: 'Edit', page: 'Page', view: 'View', compare: 'Compare', settings: 'Settings',
    localOnly: 'Local only · nothing uploaded', files: 'Files', pages: 'Pages', addFilesStart: 'Add PDFs or images to start.',
    dropTitle: 'Drop PDFs or images here', dropBody: 'PackDocFit edits documents locally in your browser. Your files are never uploaded.', dropNote: 'Ctrl+O to add files · GitHub Pages · AGPL open source', dropOverlay: 'Drop PDF or image files here',
    newProject: 'New project', addFiles: 'Add files', save: 'Save', extract: 'Extract selected pages', deletePages: 'Delete selected pages', rotateRight: 'Rotate right 90°', fitResize: 'Fit / resize pages', undo: 'Undo', redo: 'Redo', continuous: 'Continuous view', single: 'Single-page view', selectMove: 'Select / move', highlight: 'Highlight', rectangle: 'Rectangle', line: 'Line', arrow: 'Arrow', ink: 'Freehand ink', text: 'Text', removeFile: 'Remove this file', pageLabel: 'Page', modified: 'Modified',
    language: 'Language', theme: 'Theme', system: 'System', light: 'Light', dark: 'Dark', imageImport: 'Image import', keepOrientation: 'Keep image orientation', portraitPage: 'Portrait page', landscapePage: 'Landscape page', exportDpi: 'Export DPI', highlightSetting: 'Highlight', preferTextLayer: 'Prefer text layer inside dragged area', pdfSecurity: 'PDF security', outputPassword: 'Output password', noPassword: 'No password', outputPasswordHelp: 'Applied when the edited PDF is saved. Leave blank for an unencrypted output.', annotationDefaults: 'Annotation defaults', color: 'Color', opacity: 'Opacity', lineWidth: 'Line width', textSize: 'Text size', exportSettings: 'Export settings', importSettings: 'Import settings', cancel: 'Cancel', saveButton: 'Save', settingsImported: 'Settings imported.',
    mode: 'Mode', standardPaper: 'Standard paper', targetWidth: 'Target width', paper: 'Paper', orientation: 'Orientation', auto: 'Auto', portrait: 'Portrait', landscape: 'Landscape', fit: 'Fit', fitInside: 'Fit inside', fillCrop: 'Fill / crop overflow', width: 'Width', fitVectorHelp: 'Vector page content is transformed inside the PDF; pages are not intentionally rasterized by this operation.', apply: 'Apply', close: 'Close', about: 'About PackDocFit', aboutBody: 'Free and open-source. PDF processing happens locally in your browser with MuPDF.js / WebAssembly. PackDocFit does not upload your documents to a server.', annotationProperties: 'Annotation properties', selectedAnnotation: 'Selected annotation', type: 'Type', applyStyle: 'Apply style', delete: 'Delete', sideBySide: 'Side by side', vertical: 'Vertical', overlay: 'Overlay',
    newMenu: 'New', addFilesMenu: 'Add files…', saveAs: 'Save as…', extractMenu: 'Extract selected…', exportPng: 'Export selected as PNG', exportJpg: 'Export selected as JPG', copyPages: 'Copy pages', cutPages: 'Cut pages', pastePages: 'Paste pages', selectAllPages: 'Select all pages', rotateLeft: 'Rotate left 90°', rotate180: 'Rotate 180°', zoomIn: 'Zoom in', zoomOut: 'Zoom out', annotationPropsMenu: 'Annotation properties…', confirmNew: 'Discard the current project and start a new one?', noSupported: 'No supported PDF/image files found.', duplicateFile: '{name} appears identical to “{prev}”. Add it again?', passwordRequired: 'Password required for {name}:', incorrectPassword: 'Incorrect password.', unlockFailed: 'Could not unlock {name}.', removeFileConfirm: 'Remove “{name}” ({count} pages) from this project?', selectTwoCompare: 'Select at least two pages to compare.', comparePages: 'Compare pages {a} and {b}', noJpeg: 'JPEG export is not available in this MuPDF build.', noAnnotation: 'No annotation is selected.', splitterReset: 'Double-click to reset the layout.', deleteAllConfirm: 'Delete all pages?', textPrompt: 'Enter text:', notPdf: 'This is not a PDF document.', languageKo: '한국어', languageEn: 'English', languageJa: '日本語', languageEs: 'Español',
  },
  ja: {
    appSubtitle: 'ウェブPDFエディター', file: 'ファイル', edit: '編集', page: 'ページ', view: '表示', compare: '比較', settings: '設定', localOnly: 'ローカル処理 · アップロードなし', files: 'ファイル', pages: 'ページ', addFilesStart: 'PDFまたは画像を追加してください。', dropTitle: 'PDFまたは画像をここにドロップ', dropBody: 'PackDocFitはブラウザー内でローカルに編集します。ファイルはサーバーへアップロードされません。', dropNote: 'Ctrl+O ファイル追加 · GitHub Pages · AGPLオープンソース', dropOverlay: 'PDFまたは画像ファイルをここにドロップ',
    newProject: '新規', addFiles: 'ファイル追加', save: '保存', extract: '選択ページを抽出', deletePages: '選択ページを削除', rotateRight: '右へ90°回転', fitResize: 'ページを合わせる / サイズ変更', undo: '元に戻す', redo: 'やり直す', continuous: '連続表示', single: '単一ページ表示', selectMove: '選択 / 移動', highlight: 'ハイライト', rectangle: '四角形', line: '直線', arrow: '矢印', ink: 'フリーハンド', text: 'テキスト', removeFile: 'このファイルを削除', pageLabel: 'ページ', modified: '変更済み',
    language: '言語', theme: 'テーマ', system: 'システム', light: 'ライト', dark: 'ダーク', imageImport: '画像の読み込み', keepOrientation: '画像の向きを維持', portraitPage: '縦向きページ', landscapePage: '横向きページ', exportDpi: '書き出しDPI', highlightSetting: 'ハイライト', preferTextLayer: 'ドラッグ範囲内のテキストレイヤーを優先', pdfSecurity: 'PDFセキュリティ', outputPassword: '出力パスワード', noPassword: 'パスワードなし', outputPasswordHelp: '編集したPDFの保存時に適用されます。暗号化しない場合は空欄にしてください。', annotationDefaults: '注釈の既定値', color: '色', opacity: '不透明度', lineWidth: '線の太さ', textSize: '文字サイズ', exportSettings: '設定を書き出す', importSettings: '設定を読み込む', cancel: 'キャンセル', saveButton: '保存', settingsImported: '設定を読み込みました。',
    mode: '方法', standardPaper: '標準用紙', targetWidth: '指定幅', paper: '用紙', orientation: '向き', auto: '自動', portrait: '縦', landscape: '横', fit: '合わせ方', fitInside: '内側に収める', fillCrop: '塗りつぶし / はみ出しを切る', width: '幅', fitVectorHelp: 'PDF内のベクターページ内容を変形します。この操作で意図的にラスタライズは行いません。', apply: '適用', close: '閉じる', about: 'PackDocFitについて', aboutBody: '無料のオープンソースPDFエディターです。PDF処理はMuPDF.js / WebAssemblyを使ってブラウザー内でローカルに行われ、文書はサーバーへアップロードされません。', annotationProperties: '注釈のプロパティ', selectedAnnotation: '選択中の注釈', type: '種類', applyStyle: 'スタイルを適用', delete: '削除', sideBySide: '横に並べる', vertical: '縦に並べる', overlay: '重ねて表示',
    newMenu: '新規', addFilesMenu: 'ファイル追加…', saveAs: '名前を付けて保存…', extractMenu: '選択ページを抽出…', exportPng: '選択ページをPNGで書き出す', exportJpg: '選択ページをJPGで書き出す', copyPages: 'ページをコピー', cutPages: 'ページを切り取り', pastePages: 'ページを貼り付け', selectAllPages: 'すべてのページを選択', rotateLeft: '左へ90°回転', rotate180: '180°回転', zoomIn: '拡大', zoomOut: '縮小', annotationPropsMenu: '注釈のプロパティ…', confirmNew: '現在の作業を破棄して新規作業を始めますか？', noSupported: '対応するPDF/画像ファイルがありません。', duplicateFile: '{name} は “{prev}” と同じ内容です。もう一度追加しますか？', passwordRequired: '{name} のパスワードを入力してください:', incorrectPassword: 'パスワードが正しくありません。', unlockFailed: '{name} のロックを解除できませんでした。', removeFileConfirm: '“{name}”（{count}ページ）をこの作業から削除しますか？', selectTwoCompare: '比較するには2ページ以上選択してください。', comparePages: '{a}ページと{b}ページを比較', noJpeg: 'このMuPDFビルドではJPEG書き出しを使用できません。', noAnnotation: '注釈が選択されていません。', splitterReset: 'ダブルクリックで既定のレイアウトに戻します。', deleteAllConfirm: 'すべてのページを削除しますか？', textPrompt: 'テキストを入力してください:', notPdf: 'PDF文書ではありません。', languageKo: '한국어', languageEn: 'English', languageJa: '日本語', languageEs: 'Español',
  },
  es: {
    appSubtitle: 'Editor PDF en la web', file: 'Archivo', edit: 'Editar', page: 'Página', view: 'Ver', compare: 'Comparar', settings: 'Ajustes', localOnly: 'Solo local · sin subir archivos', files: 'Archivos', pages: 'Páginas', addFilesStart: 'Añade archivos PDF o imágenes.', dropTitle: 'Suelta aquí archivos PDF o imágenes', dropBody: 'PackDocFit edita los documentos localmente en tu navegador. Tus archivos nunca se suben.', dropNote: 'Ctrl+O para añadir · GitHub Pages · AGPL código abierto', dropOverlay: 'Suelta aquí archivos PDF o imágenes',
    newProject: 'Nuevo', addFiles: 'Añadir archivos', save: 'Guardar', extract: 'Extraer páginas seleccionadas', deletePages: 'Eliminar páginas seleccionadas', rotateRight: 'Girar 90° a la derecha', fitResize: 'Ajustar / cambiar tamaño', undo: 'Deshacer', redo: 'Rehacer', continuous: 'Vista continua', single: 'Vista de una página', selectMove: 'Seleccionar / mover', highlight: 'Resaltar', rectangle: 'Rectángulo', line: 'Línea', arrow: 'Flecha', ink: 'Dibujo libre', text: 'Texto', removeFile: 'Quitar este archivo', pageLabel: 'Página', modified: 'Modificado',
    language: 'Idioma', theme: 'Tema', system: 'Sistema', light: 'Claro', dark: 'Oscuro', imageImport: 'Importar imagen', keepOrientation: 'Mantener orientación de la imagen', portraitPage: 'Página vertical', landscapePage: 'Página horizontal', exportDpi: 'DPI de exportación', highlightSetting: 'Resaltado', preferTextLayer: 'Preferir la capa de texto dentro del área arrastrada', pdfSecurity: 'Seguridad PDF', outputPassword: 'Contraseña de salida', noPassword: 'Sin contraseña', outputPasswordHelp: 'Se aplica al guardar el PDF editado. Déjalo vacío para guardar sin cifrado.', annotationDefaults: 'Valores predeterminados de anotación', color: 'Color', opacity: 'Opacidad', lineWidth: 'Grosor de línea', textSize: 'Tamaño de texto', exportSettings: 'Exportar ajustes', importSettings: 'Importar ajustes', cancel: 'Cancelar', saveButton: 'Guardar', settingsImported: 'Ajustes importados.',
    mode: 'Modo', standardPaper: 'Papel estándar', targetWidth: 'Ancho objetivo', paper: 'Papel', orientation: 'Orientación', auto: 'Automática', portrait: 'Vertical', landscape: 'Horizontal', fit: 'Ajuste', fitInside: 'Encajar dentro', fillCrop: 'Rellenar / recortar exceso', width: 'Ancho', fitVectorHelp: 'El contenido vectorial de la página se transforma dentro del PDF; esta operación no rasteriza intencionadamente las páginas.', apply: 'Aplicar', close: 'Cerrar', about: 'Acerca de PackDocFit', aboutBody: 'Editor PDF gratuito y de código abierto. El procesamiento se realiza localmente en el navegador mediante MuPDF.js / WebAssembly y los documentos no se suben a un servidor.', annotationProperties: 'Propiedades de anotación', selectedAnnotation: 'Anotación seleccionada', type: 'Tipo', applyStyle: 'Aplicar estilo', delete: 'Eliminar', sideBySide: 'Lado a lado', vertical: 'Vertical', overlay: 'Superponer',
    newMenu: 'Nuevo', addFilesMenu: 'Añadir archivos…', saveAs: 'Guardar como…', extractMenu: 'Extraer selección…', exportPng: 'Exportar selección como PNG', exportJpg: 'Exportar selección como JPG', copyPages: 'Copiar páginas', cutPages: 'Cortar páginas', pastePages: 'Pegar páginas', selectAllPages: 'Seleccionar todas las páginas', rotateLeft: 'Girar 90° a la izquierda', rotate180: 'Girar 180°', zoomIn: 'Acercar', zoomOut: 'Alejar', annotationPropsMenu: 'Propiedades de anotación…', confirmNew: '¿Descartar el trabajo actual y empezar uno nuevo?', noSupported: 'No se encontraron archivos PDF o de imagen compatibles.', duplicateFile: '{name} parece idéntico a “{prev}”. ¿Añadirlo de nuevo?', passwordRequired: 'Contraseña para {name}:', incorrectPassword: 'Contraseña incorrecta.', unlockFailed: 'No se pudo desbloquear {name}.', removeFileConfirm: '¿Quitar “{name}” ({count} páginas) de este trabajo?', selectTwoCompare: 'Selecciona al menos dos páginas para comparar.', comparePages: 'Comparar páginas {a} y {b}', noJpeg: 'La exportación JPEG no está disponible en esta compilación de MuPDF.', noAnnotation: 'No hay ninguna anotación seleccionada.', splitterReset: 'Haz doble clic para restaurar el diseño predeterminado.', deleteAllConfirm: '¿Eliminar todas las páginas?', textPrompt: 'Introduce el texto:', notPdf: 'No es un documento PDF.', languageKo: '한국어', languageEn: 'English', languageJa: '日本語', languageEs: 'Español',
  }
}

export function detectLanguage() {
  const langs = navigator.languages?.length ? navigator.languages : [navigator.language || 'en']
  for (const lang of langs) {
    const base = String(lang).toLowerCase().split('-')[0]
    if (['ko','en','ja','es'].includes(base)) return base
  }
  return 'en'
}

export function tr(lang, key, vars = {}) {
  const table = STRINGS[lang] || STRINGS.en
  let s = table[key] ?? STRINGS.en[key] ?? key
  for (const [k,v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v))
  return s
}
