import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

interface Stats {
  rights: number
  users: number
  files: number
}

interface RightRow {
  id: number
  title: string
  holder_name: string
  ip_type: number
  wallet_address: string
  cert_id: string
  tx_hash: string
  created_at: string
}

interface UserRow {
  id: number
  full_name: string
  email: string
  role: string
  created_at: string
}

const IP_LABELS = ['حق مؤلف', 'علامة تجارية', 'براءة اختراع', 'استشارة']
const IP_COLORS = ['#2563eb', '#7c3aed', '#059669', '#d97706']
const IP_BG    = ['#eff6ff', '#f5f3ff', '#ecfdf5', '#fffbeb']

export default function AdminDashboard() {
  const { user, loading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [checking, setChecking] = useState(true)
  const [stats, setStats] = useState<Stats>({ rights: 0, users: 0, files: 0 })
  const [rights, setRights] = useState<RightRow[]>([])
  const [users, setUsers] = useState<UserRow[]>([])
  const [activeTab, setActiveTab] = useState<'rights' | 'users'>('rights')
  const [dataLoading, setDataLoading] = useState(true)

  // فحص صلاحية الأدمن — قائمة الإيميلات المصرح لها
  const ADMIN_EMAILS = ['sbattal419@gmail.com']

  useEffect(() => {
    if (loading) return
    if (!user) { setChecking(false); return }
    setIsAdmin(ADMIN_EMAILS.includes(user.email ?? ''))
    setChecking(false)
  }, [user, loading])

  // جلب البيانات
  useEffect(() => {
    if (!isAdmin) return
    setDataLoading(true)

    Promise.all([
      supabase.from('Rights').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('Ip_files').select('*', { count: 'exact', head: true }),
      supabase.from('Rights').select('id,title,holder_name,ip_type,wallet_address,cert_id,tx_hash,created_at').order('created_at', { ascending: false }).limit(20),
      supabase.from('users').select('id,full_name,email,role,created_at').order('created_at', { ascending: false }),
    ]).then(([r, u, f, rightsData, usersData]) => {
      setStats({ rights: r.count ?? 0, users: u.count ?? 0, files: f.count ?? 0 })
      setRights((rightsData.data ?? []) as RightRow[])
      setUsers((usersData.data ?? []) as UserRow[])
      setDataLoading(false)
    })
  }, [isAdmin])

  // ─── حالات العرض ──────────────────────────────────────────────────────────────
  if (loading || checking) {
    return (
      <div className="adm-center">
        <div className="bc-spinner" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="adm-center">
        <p className="adm-denied-msg">يجب تسجيل الدخول أولاً</p>
        <Link to="/login" className="btn-bc-primary">تسجيل الدخول</Link>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="adm-center">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p className="adm-denied-msg">ليس لديك صلاحية الوصول</p>
        <Link to="/" className="btn-bc-ghost">العودة للرئيسية</Link>
      </div>
    )
  }

  return (
    <div className="adm-page">
      {/* Topbar */}
      <header className="adm-topbar">
        <Link to="/" className="bc-back-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="m9 18 6-6-6-6"/>
          </svg>
          الرئيسية
        </Link>
        <div className="adm-topbar-title">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.6" strokeLinecap="round">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
          </svg>
          <span>لوحة التحكم</span>
        </div>
        <span className="adm-user-badge">{user.email}</span>
      </header>

      <main className="adm-main">
        {/* Stats */}
        <div className="adm-stats-row">
          <StatCard icon="📋" label="الحقوق المسجلة" value={stats.rights} color="#2563eb" />
          <StatCard icon="👥" label="المستخدمون" value={stats.users} color="#7c3aed" />
          <StatCard icon="📁" label="الملفات المرفوعة" value={stats.files} color="#059669" />
        </div>

        {/* Tabs */}
        <div className="adm-tabs">
          <button className={`adm-tab${activeTab === 'rights' ? ' adm-tab-active' : ''}`} onClick={() => setActiveTab('rights')}>
            الحقوق المسجلة
          </button>
          <button className={`adm-tab${activeTab === 'users' ? ' adm-tab-active' : ''}`} onClick={() => setActiveTab('users')}>
            المستخدمون
          </button>
        </div>

        {dataLoading ? (
          <div className="adm-loading"><div className="bc-spinner" /></div>
        ) : activeTab === 'rights' ? (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>العنوان</th>
                  <th>صاحب الحق</th>
                  <th>النوع</th>
                  <th>رقم الشهادة</th>
                  <th>المحفظة</th>
                  <th>التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {rights.length === 0 ? (
                  <tr><td colSpan={7} className="adm-empty-cell">لا توجد بيانات</td></tr>
                ) : rights.map((r, i) => (
                  <tr key={r.id}>
                    <td className="adm-td-num">{i + 1}</td>
                    <td className="adm-td-title">{r.title || '—'}</td>
                    <td>{r.holder_name || '—'}</td>
                    <td>
                      <span className="ip-badge" style={{ background: IP_BG[r.ip_type] ?? IP_BG[0], color: IP_COLORS[r.ip_type] ?? IP_COLORS[0], fontSize: 12 }}>
                        {IP_LABELS[r.ip_type] ?? '—'}
                      </span>
                    </td>
                    <td className="adm-td-mono">{r.cert_id ? `#${r.cert_id}` : '—'}</td>
                    <td className="adm-td-mono">{r.wallet_address ? `${r.wallet_address.slice(0,6)}...${r.wallet_address.slice(-4)}` : '—'}</td>
                    <td className="adm-td-date">{r.created_at ? new Date(r.created_at).toLocaleDateString('ar-EG') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>الاسم</th>
                  <th>البريد الإلكتروني</th>
                  <th>الدور</th>
                  <th>تاريخ التسجيل</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr><td colSpan={5} className="adm-empty-cell">لا توجد بيانات</td></tr>
                ) : users.map((u, i) => (
                  <tr key={u.id}>
                    <td className="adm-td-num">{i + 1}</td>
                    <td>{u.full_name || '—'}</td>
                    <td className="adm-td-email">{u.email || '—'}</td>
                    <td>
                      <span className={`adm-role-badge${u.role === 'admin' ? ' adm-role-admin' : ''}`}>
                        {u.role || 'user'}
                      </span>
                    </td>
                    <td className="adm-td-date">{u.created_at ? new Date(u.created_at).toLocaleDateString('ar-EG') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (
    <div className="adm-stat-card">
      <div className="adm-stat-icon" style={{ background: color + '18', color }}>{icon}</div>
      <div>
        <p className="adm-stat-value" style={{ color }}>{value.toLocaleString('ar-EG')}</p>
        <p className="adm-stat-label">{label}</p>
      </div>
    </div>
  )
}
