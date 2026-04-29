import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthProvider } from './context/AuthContext'
import { playClick, playNav, playHover } from './lib/sounds'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import RegisterRightPage from './pages/RegisterRightPage'
import VerifyPage from './pages/VerifyPage'
import CertificatesPage from './pages/CertificatesPage'
import AdminDashboard from './pages/AdminDashboard'
import PrivacyPage from './pages/PrivacyPage'
import TermsPage from './pages/TermsPage'
import AccessibilityPage from './pages/AccessibilityPage'

function SoundLayer() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest('a, button, [role="button"]')
      if (!el) return
      const isNav = el.tagName === 'A' && (el as HTMLAnchorElement).href && !(el as HTMLAnchorElement).href.includes('#')
      isNav ? playNav() : playClick()
    }
    let lastHovered: Element | null = null
    const onHover = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest('a, button, [role="button"]')
      if (!el || el === lastHovered) return
      lastHovered = el
      playHover()
    }
    const onLeave = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest('a, button, [role="button"]')
      if (el === lastHovered) lastHovered = null
    }
    document.addEventListener('click', onClick)
    document.addEventListener('mouseover', onHover)
    document.addEventListener('mouseout', onLeave)
    return () => {
      document.removeEventListener('click', onClick)
      document.removeEventListener('mouseover', onHover)
      document.removeEventListener('mouseout', onLeave)
    }
  }, [])
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <SoundLayer />
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/register-right" element={<RegisterRightPage />} />
          <Route path="/verify" element={<VerifyPage />} />
          <Route path="/certificates" element={<CertificatesPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/accessibility" element={<AccessibilityPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
