import { cp, mkdir, rm, stat } from 'node:fs/promises'
import { join } from 'node:path'

const root = process.cwd()
const source = join(root, 'node_modules', 'pdfjs-dist')
const target = join(root, 'public', 'pdfjs')

async function exists(path) {
  try { await stat(path); return true } catch { return false }
}

await rm(target, { recursive: true, force: true })
await mkdir(target, { recursive: true })

for (const name of ['cmaps', 'standard_fonts', 'wasm', 'iccs', 'image_decoders']) {
  const from = join(source, name)
  if (await exists(from)) await cp(from, join(target, name), { recursive: true })
}
