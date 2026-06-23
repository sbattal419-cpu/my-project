// ════════════════════════════════════════════════════════════════
// FILE: src/main.tsx
// نقطة بدء التطبيق — يُشغّل React ويربطه بعنصر #root في index.html
// ════════════════════════════════════════════════════════════════
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
