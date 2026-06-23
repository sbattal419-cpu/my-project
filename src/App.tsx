// ════════════════════════════════════════════════════════════════
// FILE: src/App.tsx
// جذر التطبيق — يحتوي التوجيه والسياقات العامة
// للتعديل: ابحث عن Route لإضافة صفحة جديدة
// خريطة الصفحات:
//   /              → HomePage
//   /login         → LoginPage
//   /register      → RegisterPage
//   /register-right → RegisterRightPage  [محمي]
//   /verify        → VerifyPage
//   /certificates  → CertificatesPage
//   /admin         → AdminDashboard      [محمي]
//   /reset-password → ResetPasswordPage
//   /registry      → PublicRegistryPage
//   /privacy | /terms | /accessibility → صفحات قانونية
// ════════════════════════════════════════════════════════════════
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthProvider } from './context/AuthContext'
import { playClick, playNav, playHover } from './lib/sounds'
import { LanguageProvider } from './context/LanguageContext'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import RegisterRightPage from './pages/RegisterRightPage'
import ProtectedRoute from './components/ProtectedRoute'
import VerifyPage from './pages/VerifyPage'
import CertificatesPage from './pages/CertificatesPage'
import AdminDashboard from './pages/AdminDashboard'
import ResetPasswordPage from './pages/ResetPasswordPage'
import PublicRegistryPage from './pages/PublicRegistryPage'
import PrivacyPage from './pages/PrivacyPage'
import TermsPage from './pages/TermsPage'
import AccessibilityPage from './pages/AccessibilityPage'

// SoundLayer — يُضيف أصوات نقر/hover على كل الأزرار والروابط تلقائياً
// يعمل بـ delegation (مستمع واحد على document) لكفاءة أفضل
function SoundLayer() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest('a, button, [role="button"]')
      if (!el || el.hasAttribute('data-no-sound')) return
      const isNav = el.tagName === 'A' && (el as HTMLAnchorElement).href && !(el as HTMLAnchorElement).href.includes('#')
      isNav ? playNav() : playClick()
    }
    let lastHovered: Element | null = null
    const onHover = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest('a, button, [role="button"]')
      if (!el || el === lastHovered || el.hasAttribute('data-no-sound')) return
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
      <LanguageProvider>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/register-right" element={<ProtectedRoute><RegisterRightPage /></ProtectedRoute>} />
          <Route path="/verify" element={<VerifyPage />} />
          <Route path="/certificates" element={<CertificatesPage />} />
          <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/accessibility" element={<AccessibilityPage />} />
          <Route path="/registry" element={<PublicRegistryPage />} />
        </Routes>
      </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  )
}
