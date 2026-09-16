import { readFileSync, existsSync } from 'node:fs'
import { STRINGS } from '../src/i18n.js'

const version = '0.2.0'
const build = 8
const requiredFiles = ['README.md','BUILD_HISTORY.md','PROJECT_HANDOFF.md','CHANGELOG.md','src/packdocfit.js','src/style.css','src/i18n.js']
for (const file of requiredFiles) {
  if (!existsSync(file)) throw new Error(`Missing required file: ${file}`)
}

const pkg = JSON.parse(readFileSync('package.json','utf8'))
if (pkg.version !== version) throw new Error(`package.json version mismatch: ${pkg.version}`)

const app = readFileSync('src/packdocfit.js','utf8')
if (!app.includes(`APP_VERSION = '${version}'`)) throw new Error('APP_VERSION mismatch')
if (!app.includes(`APP_BUILD = ${build}`)) throw new Error('APP_BUILD mismatch')

const used = [...app.matchAll(/this\.t\('([^']+)'/g)].map(m => m[1])
const keys = [...new Set(used)].sort()
for (const lang of ['ko','en','ja','es']) {
  const missing = keys.filter(key => !(key in STRINGS[lang]))
  if (missing.length) throw new Error(`${lang} missing translations: ${missing.join(', ')}`)
}

const css = readFileSync('src/style.css','utf8')
for (const theme of ['data-theme="dark"','data-theme="black"']) {
  if (!css.includes(theme)) throw new Error(`Missing theme CSS: ${theme}`)
}

for (const file of ['README.md','BUILD_HISTORY.md','PROJECT_HANDOFF.md']) {
  const text = readFileSync(file,'utf8')
  if (!text.includes(`v${version}`) || !text.includes(`Build ${build}`)) throw new Error(`${file} current Version/Build mismatch`)
}

console.log(`PackDocFit v${version} Build ${build}: static project checks passed (${keys.length} localized UI keys).`)
