import './style.css'
import { PackDocFitApp } from './packdocfit.js'

const root = document.querySelector('#app')
const app = new PackDocFitApp(root)
app.start()
