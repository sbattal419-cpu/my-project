import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { updateRightStatus, createNotification } from '../lib/supabase-ipr'
import { signOut } from '../lib/auth'

interface Stats { rights: number; users: number; files: number }

interface RightRow {
  id: number
  auth_user_id: string | null
  title: string
  holder_name: string
  ip_type: number
  wallet_address: string
  cert_id: string
  tx_hash: string
  created_at: string
  status: string | null
  review_note: string | null
}

interface UserRow {
  id: number
  auth_user_id: string | null
  full_name: string
  email: string
  role: string
  created_at: string
  national_id: string | null
  id_document_url: string | null
  kyc_status: string | null
  kyc_note: string | null
}

const IP_LABELS = ['حق مؤلف', 'علامة تجارية', 'براءة اختراع']
const IP_COLORS = ['#2563eb', '#7c3aed', '#059669', '#d97706']
const IP_BG    = ['#eff6ff', '#f5f3ff', '#ecfdf5', '#fffbeb']

const REJECT_REASONS = [
  'المعلومات المقدمة غير كافية',
  'خطأ في البيانات المدخلة',
  'الحق مسجل مسبقاً',
  'المستندات المرفقة غير واضحة',
  'أخرى',
]

function StatusBadge({ status }: { status: string | null }) {
  const s = status ?? 'pending'
  const map: Record<string, { label: string; color: string; bg: string }> = {
    pending:  { label: 'قيد المراجعة', color: '#d97706', bg: '#fffbeb' },
    approved: { label: 'مقبول',        color: '#059669', bg: '#ecfdf5' },
    rejected: { label: 'مرفوض',        color: '#dc2626', bg: '#fef2f2' },
  }
  const { label, color, bg } = map[s] ?? map.pending
  return <span className="ip-badge" style={{ background: bg, color, fontSize: 12 }}>{label}</span>
}

export default function AdminDashboard() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [isAdmin, setIsAdmin] = useState(false)
  const [checking, setChecking] = useState(true)
  const [stats, setStats] = useState<Stats>({ rights: 0, users: 0, files: 0 })
  const [rights, setRights] = useState<RightRow[]>([])
  const [users, setUsers] = useState<UserRow[]>([])
  const [activeTab, setActiveTab] = useState<'rights' | 'users' | 'kyc'>('rights')
  const [dataLoading, setDataLoading] = useState(true)

  // حالة المودال
  const [rejectModal, setRejectModal] = useState<{ row: RightRow } | null>(null)
  const [rejectReason, setRejectReason] = useState(REJECT_REASONS[0])
  const [rejectCustom, setRejectCustom] = useState('')
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  // KYC
  const [kycActionLoading, setKycActionLoading] = useState<number | null>(null)
  const [kycRejectModal, setKycRejectModal] = useState<{ user: UserRow } | null>(null)
  const [kycRejectNote, setKycRejectNote] = useState('')

  useEffect(() => {
    if (loading) return
    if (!user) { setChecking(false); return }
    supabase
      .from('profiles')
      .select('role')
      .eq('auth_user_id', user.id)
      .single()
      .then(({ data }) => {
        setIsAdmin(data?.role === 'admin')
        setChecking(false)
      })
  }, [user, loading])

  const loadData = () => {
    setDataLoading(true)
    Promise.all([
      supabase.from('Rights').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('Ip_files').select('*', { count: 'exact', head: true }),
      supabase.from('Rights')
        .select('id,auth_user_id,title,holder_name,ip_type,wallet_address,cert_id,tx_hash,created_at,status,review_note')
        .order('created_at', { ascending: false }).limit(50),
      supabase.from('profiles').select('id,auth_user_id,full_name,email,role,created_at,national_id,id_document_url,kyc_status,kyc_note').order('created_at', { ascending: false }),
    ]).then(([r, u, f, rightsData, usersData]) => {
      setStats({ rights: r.count ?? 0, users: u.count ?? 0, files: f.count ?? 0 })
      setRights((rightsData.data ?? []) as RightRow[])
      setUsers((usersData.data ?? []) as UserRow[])
      setDataLoading(false)
    })
  }

  useEffect(() => { if (isAdmin) loadData() }, [isAdmin])

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  const handleApprove = async (row: RightRow) => {
    if (!row.auth_user_id) return
    setActionLoading(row.id)
    try {
      await updateRightStatus(row.id, 'approved')
      await createNotification({
        authUserId: row.auth_user_id,
        title: 'تم قبول طلبك ✅',
        message: `تهانينا! تم قبول تسجيل حقك الفكري "${row.title}" والشهادة رقم #${row.cert_id} سارية المفعول.`,
        type: 'success',
      })
      setRights(rs => rs.map(r => r.id === row.id ? { ...r, status: 'approved' } : r))
      showToast('تم قبول الطلب وإرسال الإشعار للمستخدم', true)
    } catch {
      showToast('حدث خطأ أثناء القبول', false)
    } finally {
      setActionLoading(null)
    }
  }

  const handleRejectConfirm = async () => {
    if (!rejectModal) return
    const { row } = rejectModal
    if (!row.auth_user_id) return
    setActionLoading(row.id)
    const note = rejectReason === 'أخرى' ? (rejectCustom.trim() || 'سبب غير محدد') : rejectReason
    try {
      await updateRightStatus(row.id, 'rejected', note)
      await createNotification({
        authUserId: row.auth_user_id,
        title: 'تم رفض طلبك ❌',
        message: `نأسف، تم رفض تسجيل حقك الفكري "${row.title}". السبب: ${note}. يمكنك تعديل البيانات وإعادة المحاولة.`,
        type: 'error',
      })
      setRights(rs => rs.map(r => r.id === row.id ? { ...r, status: 'rejected', review_note: note } : r))
      showToast('تم رفض الطلب وإرسال الإشعار للمستخدم', true)
      setRejectModal(null)
      setRejectCustom('')
      setRejectReason(REJECT_REASONS[0])
    } catch {
      showToast('حدث خطأ أثناء الرفض', false)
    } finally {
      setActionLoading(null)
    }
  }

  const handleKYCApprove = async (u: UserRow) => {
    setKycActionLoading(u.id)
    try {
      await supabase.from('profiles').update({ kyc_status: 'verified', kyc_note: null }).eq('id', u.id)
      if (u.auth_user_id) {
        await createNotification({
          authUserId: u.auth_user_id,
          title: 'تم التحقق من هويتك ✅',
          message: 'تهانينا! تم قبول بيانات هويتك الوطنية. حسابك الآن موثّق بالكامل.',
          type: 'success',
        })
      }
      setUsers(us => us.map(x => x.id === u.id ? { ...x, kyc_status: 'verified' } : x))
      showToast('تم التحقق من هوية المستخدم وإرسال الإشعار', true)
    } catch {
      showToast('حدث خطأ أثناء التحديث', false)
    } finally {
      setKycActionLoading(null)
    }
  }

  const handleKYCRejectConfirm = async () => {
    if (!kycRejectModal) return
    const u = kycRejectModal.user
    const note = kycRejectNote.trim() || 'البيانات المقدمة غير مطابقة'
    setKycActionLoading(u.id)
    try {
      await supabase.from('profiles').update({ kyc_status: 'rejected', kyc_note: note }).eq('id', u.id)
      if (u.auth_user_id) {
        await createNotification({
          authUserId: u.auth_user_id,
          title: 'تم رفض طلب التحقق ❌',
          message: `نأسف، تم رفض بيانات هويتك. السبب: ${note}. يمكنك إعادة الإرسال مع تصحيح البيانات.`,
          type: 'error',
        })
      }
      setUsers(us => us.map(x => x.id === u.id ? { ...x, kyc_status: 'rejected', kyc_note: note } : x))
      showToast('تم رفض طلب التحقق وإرسال الإشعار', true)
      setKycRejectModal(null)
      setKycRejectNote('')
    } catch {
      showToast('حدث خطأ أثناء التحديث', false)
    } finally {
      setKycActionLoading(null)
    }
  }

  if (loading || checking) return <div className="adm-center"><div className="bc-spinner" /></div>

  if (!user) return (
    <div className="adm-center">
      <p className="adm-denied-msg">يجب تسجيل الدخول أولاً</p>
      <Link to="/login" className="btn-bc-primary">تسجيل الدخول</Link>
    </div>
  )

  if (!isAdmin) return (
    <div className="adm-center">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <p className="adm-denied-msg">ليس لديك صلاحية الوصول</p>
      <Link to="/" className="btn-bc-ghost">العودة للرئيسية</Link>
    </div>
  )

  return (
    <div className="adm-page">
      {/* Toast */}
      {toast && (
        <div className={`adm-toast${toast.ok ? ' adm-toast-ok' : ' adm-toast-err'}`}>
          {toast.ok ? '✅' : '❌'} {toast.msg}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="adm-overlay" onClick={() => setRejectModal(null)}>
          <div className="adm-modal" onClick={e => e.stopPropagation()}>
            <div className="adm-modal-header">
              <span className="adm-modal-title">سبب الرفض</span>
              <button className="wsm-close" onClick={() => setRejectModal(null)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <p className="adm-modal-right-title">"{rejectModal.row.title}"</p>
            <div className="adm-modal-reasons">
              {REJECT_REASONS.map(r => (
                <label key={r} className={`adm-reason-opt${rejectReason === r ? ' adm-reason-selected' : ''}`}>
                  <input type="radio" name="reason" value={r} checked={rejectReason === r} onChange={() => setRejectReason(r)} hidden />
                  {r}
                </label>
              ))}
            </div>
            {rejectReason === 'أخرى' && (
              <textarea
                className="adm-modal-textarea"
                placeholder="اكتب السبب..."
                value={rejectCustom}
                onChange={e => setRejectCustom(e.target.value)}
                rows={3}
              />
            )}
            <div className="adm-modal-actions">
              <button className="adm-btn-cancel" onClick={() => setRejectModal(null)}>إلغاء</button>
              <button
                className="adm-btn-reject-confirm"
                disabled={actionLoading === rejectModal.row.id}
                onClick={handleRejectConfirm}
              >
                {actionLoading === rejectModal.row.id ? <span className="btn-spinner" /> : null}
                تأكيد الرفض وإرسال الإشعار
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KYC Reject Modal */}
      {kycRejectModal && (
        <div className="adm-overlay" onClick={() => setKycRejectModal(null)}>
          <div className="adm-modal" onClick={e => e.stopPropagation()}>
            <div className="adm-modal-header">
              <span className="adm-modal-title">سبب رفض التحقق</span>
              <button className="wsm-close" onClick={() => setKycRejectModal(null)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <p className="adm-modal-right-title">{kycRejectModal.user.full_name || kycRejectModal.user.email}</p>
            <textarea
              className="adm-modal-textarea"
              placeholder="اكتب سبب الرفض (مثال: صورة الهوية غير واضحة)"
              value={kycRejectNote}
              onChange={e => setKycRejectNote(e.target.value)}
              rows={3}
            />
            <div className="adm-modal-actions">
              <button className="adm-btn-cancel" onClick={() => setKycRejectModal(null)}>إلغاء</button>
              <button
                className="adm-btn-reject-confirm"
                disabled={kycActionLoading === kycRejectModal.user.id}
                onClick={handleKYCRejectConfirm}
              >
                {kycActionLoading === kycRejectModal.user.id ? <span className="btn-spinner" /> : null}
                تأكيد الرفض وإرسال الإشعار
              </button>
            </div>
          </div>
        </div>
      )}

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
        <div className="adm-topbar-end">
          <span className="adm-user-badge">{user.email}</span>
          <button
            className="adm-logout-btn"
            onClick={async () => { await signOut(); navigate('/login', { replace: true }) }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            تسجيل الخروج
          </button>
        </div>
      </header>

      <main className="adm-main">
        <div className="adm-stats-row">
          <StatCard icon="📋" label="الحقوق المسجلة" value={stats.rights} color="#2563eb" />
          <StatCard icon="👥" label="المستخدمون"     value={stats.users}  color="#7c3aed" />
          <StatCard icon="📁" label="الملفات المرفوعة" value={stats.files} color="#059669" />
        </div>

        <div className="adm-tabs">
          <button className={`adm-tab${activeTab === 'rights' ? ' adm-tab-active' : ''}`} onClick={() => setActiveTab('rights')}>
            الحقوق المسجلة
          </button>
          <button className={`adm-tab${activeTab === 'users' ? ' adm-tab-active' : ''}`} onClick={() => setActiveTab('users')}>
            المستخدمون
          </button>
          <button className={`adm-tab${activeTab === 'kyc' ? ' adm-tab-active' : ''}`} onClick={() => setActiveTab('kyc')}>
            التحقق من الهوية
            {users.filter(u => u.kyc_status === 'pending').length > 0 && (
              <span className="adm-tab-badge">{users.filter(u => u.kyc_status === 'pending').length}</span>
            )}
          </button>
        </div>

        {dataLoading ? (
          <div className="adm-loading"><div className="bc-spinner" /></div>
        ) : activeTab === 'kyc' ? (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>الاسم</th>
                  <th>البريد</th>
                  <th>رقم الهوية</th>
                  <th>وثيقة الهوية</th>
                  <th>الحالة</th>
                  <th>الإجراء</th>
                </tr>
              </thead>
              <tbody>
                {users.filter(u => u.kyc_status && u.kyc_status !== 'none').length === 0 ? (
                  <tr><td colSpan={7} className="adm-empty-cell">لا توجد طلبات تحقق مقدّمة</td></tr>
                ) : users.filter(u => u.kyc_status && u.kyc_status !== 'none').map((u, i) => (
                  <tr key={u.id}>
                    <td className="adm-td-num">{i + 1}</td>
                    <td>{u.full_name || '—'}</td>
                    <td className="adm-td-email">{u.email || '—'}</td>
                    <td className="adm-td-mono" dir="ltr">{u.national_id || '—'}</td>
                    <td>
                      {u.id_document_url ? (
                        <a href={u.id_document_url} target="_blank" rel="noreferrer" className="adm-doc-link">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                          </svg>
                          عرض
                        </a>
                      ) : '—'}
                    </td>
                    <td>
                      {u.kyc_status === 'verified' && <span className="adm-kyc-badge adm-kyc-verified">✓ موثّق</span>}
                      {u.kyc_status === 'pending'  && <span className="adm-kyc-badge adm-kyc-pending">⏳ قيد المراجعة</span>}
                      {u.kyc_status === 'rejected' && (
                        <div>
                          <span className="adm-kyc-badge adm-kyc-rejected">✕ مرفوض</span>
                          {u.kyc_note && <p className="adm-review-note">{u.kyc_note}</p>}
                        </div>
                      )}
                    </td>
                    <td>
                      {u.kyc_status === 'pending' ? (
                        <div className="adm-actions">
                          <button
                            className="adm-btn-approve"
                            disabled={kycActionLoading === u.id}
                            onClick={() => handleKYCApprove(u)}
                          >
                            {kycActionLoading === u.id ? <span className="btn-spinner" style={{ width: 12, height: 12, borderWidth: 2 }} /> : '✓'} قبول
                          </button>
                          <button
                            className="adm-btn-reject"
                            disabled={kycActionLoading === u.id}
                            onClick={() => { setKycRejectModal({ user: u }); setKycRejectNote('') }}
                          >
                            ✕ رفض
                          </button>
                        </div>
                      ) : (
                        <span className="adm-reviewed-label">تمت المراجعة</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
                  <th>الحالة</th>
                  <th>التاريخ</th>
                  <th>الإجراء</th>
                </tr>
              </thead>
              <tbody>
                {rights.length === 0 ? (
                  <tr><td colSpan={8} className="adm-empty-cell">لا توجد بيانات</td></tr>
                ) : rights.map((r, i) => (
                  <tr key={r.id} className={r.status === 'approved' ? 'adm-row-approved' : r.status === 'rejected' ? 'adm-row-rejected' : ''}>
                    <td className="adm-td-num">{i + 1}</td>
                    <td className="adm-td-title">{r.title || '—'}</td>
                    <td>{r.holder_name || '—'}</td>
                    <td>
                      <span className="ip-badge" style={{ background: IP_BG[r.ip_type] ?? IP_BG[0], color: IP_COLORS[r.ip_type] ?? IP_COLORS[0], fontSize: 12 }}>
                        {IP_LABELS[r.ip_type] ?? '—'}
                      </span>
                    </td>
                    <td className="adm-td-mono">{r.cert_id ? `#${r.cert_id}` : '—'}</td>
                    <td>
                      <StatusBadge status={r.status} />
                      {r.review_note && r.status === 'rejected' && (
                        <p className="adm-review-note">{r.review_note}</p>
                      )}
                    </td>
                    <td className="adm-td-date">{r.created_at ? new Date(r.created_at).toLocaleDateString('ar-EG') : '—'}</td>
                    <td>
                      {(r.status === 'pending' || r.status === null) ? (
                        <div className="adm-actions">
                          <button
                            className="adm-btn-approve"
                            disabled={actionLoading === r.id}
                            onClick={() => handleApprove(r)}
                          >
                            {actionLoading === r.id ? <span className="btn-spinner" style={{ width: 12, height: 12, borderWidth: 2 }} /> : '✓'} قبول
                          </button>
                          <button
                            className="adm-btn-reject"
                            disabled={actionLoading === r.id}
                            onClick={() => { setRejectModal({ row: r }); setRejectReason(REJECT_REASONS[0]); setRejectCustom('') }}
                          >
                            ✕ رفض
                          </button>
                        </div>
                      ) : (
                        <span className="adm-reviewed-label">تمت المراجعة</span>
                      )}
                    </td>
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
                  <th>#</th><th>الاسم</th><th>البريد الإلكتروني</th><th>الدور</th><th>تاريخ التسجيل</th>
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