// ════════════════════════════════════════════════════════════════
// FILE: src/components/ProtectedRoute.tsx
// يحمي الصفحات التي تحتاج تسجيل دخول
// إذا loading → يعرض spinner حتى يتحقق من الجلسة
// إذا لا يوجد user → يُحوّل لـ /login تلقائياً
// يُستخدم في: App.tsx يُلفّ به RegisterRightPage و AdminDashboard
// ════════════════════════════════════════════════════════════════
import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="auth-loading-page">
        <div className="auth-spinner" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return <>{children}</>
}
