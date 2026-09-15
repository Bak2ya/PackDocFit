import { PackDocFitApp } from './packdocfit.js'

const root = document.querySelector('#app')

try {
  if (!root) throw new Error('App root element was not found.')
  const app = new PackDocFitApp(root)
  app.start()
  window.__packDocFitReady = true
  window.packDocFit = app
} catch (error) {
  console.error('PackDocFit startup failed:', error)
  window.dispatchEvent(new CustomEvent('packdocfitfatal', { detail: error }))
}
