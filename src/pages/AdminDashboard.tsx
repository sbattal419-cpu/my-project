// ════════════════════════════════════════════════════════════════
// FILE: src/pages/AdminDashboard.tsx
// لوحة تحكم الأدمن — إدارة الحقوق والمستخدمين والتحقق من الهوية
// للوصول: يجب أن يكون profiles.role = 'admin'
// للتعديل: ابحث عن اسم القسم مثل: HANDLERS / JSX / KYC / RIGHTS / STATS
// ════════════════════════════════════════════════════════════════
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { createNotification } from '../lib/supabase-ipr'
import { signOut } from '../lib/auth'
import { compileAndDeploy, saveManualAddress } from '../lib/deploy'
import { getContractAddress, isContractDeployed } from '../lib/blockchain'
import { supabaseAdmin } from '../lib/supabase-admin'

// ════════════════════════════════════════════════════════════════
// SECTION: TYPES — أنواع البيانات
// ════════════════════════════════════════════════════════════════
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


// ════════════════════════════════════════════════════════════════
// SECTION: MAIN COMPONENT
// ════════════════════════════════════════════════════════════════
export default function AdminDashboard() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  // ── حالة صلاحية الأدمن ───────────────────────────────────────
  const [isAdmin,  setIsAdmin]  = useState(false) // هل المستخدم أدمن؟
  const [checking, setChecking] = useState(true)  // جاري فحص الصلاحية

  // ── حالة البيانات ─────────────────────────────────────────────
  const [stats,       setStats]       = useState<Stats>({ rights: 0, users: 0, files: 0 })
  const [rights,      setRights]      = useState<RightRow[]>([])
  const [users,       setUsers]       = useState<UserRow[]>([])
  const [activeTab,   setActiveTab]   = useState<'rights' | 'users' | 'kyc' | 'contract'>('rights')
  const [dataLoading, setDataLoading] = useState(true)

  // ── حالة نشر العقد الذكي ──────────────────────────────────────
  const [deployStatus,   setDeployStatus]   = useState('')
  const [deploying,      setDeploying]      = useState(false)
  const [deployedAddr,   setDeployedAddr]   = useState(getContractAddress())
  const [manualAddr,     setManualAddr]     = useState('')
  const [manualSaved,    setManualSaved]    = useState(false)

  const handleDeploy = async () => {
    setDeploying(true)
    setDeployStatus('')
    try {
      const addr = await compileAndDeploy(setDeployStatus)
      setDeployedAddr(addr)
      setDeployStatus('✅ تم النشر بنجاح!')
      showToast('تم نشر العقد الذكي بنجاح', true)
    } catch (e: any) {
      setDeployStatus('❌ ' + (e?.message ?? 'حدث خطأ'))
    } finally {
      setDeploying(false)
    }
  }

  const handleSaveManual = () => {
    const addr = manualAddr.trim()
    if (!addr.startsWith('0x') || addr.length !== 42) {
      showToast('عنوان غير صحيح — يجب أن يبدأ بـ 0x ويتكون من 42 حرفاً', false)
      return
    }
    saveManualAddress(addr)
    setDeployedAddr(addr)
    setManualSaved(true)
    showToast('تم حفظ عنوان العقد', true)
  }

  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  // ── حالة مودال رفض/حذف KYC ───────────────────────────────────
  const [kycActionLoading, setKycActionLoading] = useState<number | null>(null)
  const [kycRejectModal,   setKycRejectModal]   = useState<{ user: UserRow } | null>(null)
  const [kycRejectNote,    setKycRejectNote]    = useState('')
  const [kycRevokeModal,   setKycRevokeModal]   = useState<{ user: UserRow } | null>(null) // مودال إلغاء توثيق مستخدم موثَّق (verified)
  const [kycRevokeNote,    setKycRevokeNote]    = useState('')                              // ملاحظة الإلغاء → تُرسَل في الإشعار
  const [kycImageModal, setKycImageModal] = useState<{ url: string; loading: boolean } | null>(null) // { url=signed URL, loading=جاري الجلب }

  // handleViewKYCImage — يفتح مودال عرض صورة هوية المستخدم
  // bucket عام → الرابط المخزّن يعمل مباشرة
  const handleViewKYCImage = (docUrl: string) => {
    setKycImageModal({ url: docUrl, loading: false })
  }

  // ── فحص صلاحية الأدمن من جدول profiles ──────────────────────
  // يقرأ profiles.role للمستخدم الحالي → 'admin' يعطي صلاحية الوصول
  // للتعديل: ابحث عن ADMIN CHECK
  useEffect(() => {
    if (loading) return
    if (!user) { setChecking(false); return }
    supabase
      .from('profiles')
      .select('role')
      .eq('auth_user_id', user.id) // جلب صف المستخدم الحالي
      .single()
      .then(({ data }) => {
        setIsAdmin(data?.role === 'admin') // فقط role='admin' يُسمح له
        setChecking(false)
      })
  }, [user, loading])

  // ── loadData — جلب كل بيانات لوحة التحكم دفعة واحدة ─────────
  // يجلب: عدادات الإحصائيات + قائمة الحقوق + قائمة المستخدمين
  // يُستدعى: عند تأكيد الصلاحية (isAdmin=true)
  const loadData = () => {
    setDataLoading(true)
    const db = supabaseAdmin ?? supabase
    Promise.all([
      db.from('Rights').select('*', { count: 'exact', head: true }),
      db.from('profiles').select('*', { count: 'exact', head: true }),
      db.from('Ip_files').select('*', { count: 'exact', head: true }),
      db.from('Rights')
        .select('id,auth_user_id,title,holder_name,ip_type,wallet_address,cert_id,tx_hash,created_at,status,review_note')
        .order('created_at', { ascending: false }).limit(50),
      db.from('profiles').select('id,auth_user_id,full_name,email,role,created_at,national_id,id_document_url,kyc_status,kyc_note').order('created_at', { ascending: false }),
    ]).then(([r, u, f, rightsData, usersData]) => {
      setStats({ rights: r.count ?? 0, users: u.count ?? 0, files: f.count ?? 0 })
      setRights((rightsData.data ?? []) as RightRow[])
      setUsers((usersData.data ?? []) as UserRow[])
      setDataLoading(false)
    })
  }

  useEffect(() => { if (isAdmin) loadData() }, [isAdmin])

  // showToast — يعرض رسالة نجاح/خطأ مؤقتة (3.5 ثانية)
  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  // ════════════════════════════════════════════════════════════════
  // SECTION: HANDLERS — معالجات KYC
  // للتعديل: ابحث عن HANDLERS
  // ════════════════════════════════════════════════════════════════

  // kycDirectUpdate — يحدّث profiles مباشرة عبر REST API بالـ service role key متجاوزاً RLS
  const kycDirectUpdate = async (profileId: string | number, body: Record<string, unknown>): Promise<string | null> => {
    const svcKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY as string
    const url    = import.meta.env.VITE_SUPABASE_URL as string
    if (!svcKey) return 'مفتاح الخدمة غير موجود في .env.local'
    const res = await fetch(`${url}/rest/v1/profiles?id=eq.${profileId}`, {
      method: 'PATCH',
      headers: {
        'apikey': svcKey,
        'Authorization': `Bearer ${svcKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(body),
    })
    if (!res.ok) return await res.text()
    return null // null = نجاح
  }

  // handleKYCApprove — قبول طلب التحقق من الهوية (KYC)
  const handleKYCApprove = async (u: UserRow) => {
    setKycActionLoading(u.id)
    try {
      const err = await kycDirectUpdate(u.id, { kyc_status: 'verified', kyc_note: null })
      if (err) { showToast(`خطأ: ${err}`, false); return }
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
    } catch (e: unknown) {
      showToast(`خطأ: ${e instanceof Error ? e.message : 'غير معروف'}`, false)
    } finally {
      setKycActionLoading(null)
    }
  }

  // handleKYCRejectConfirm — رفض طلب KYC مع ملاحظة + إشعار
  const handleKYCRejectConfirm = async () => {
    if (!kycRejectModal) return
    const u = kycRejectModal.user
    const note = kycRejectNote.trim() || 'البيانات المقدمة غير مطابقة'
    setKycActionLoading(u.id)
    try {
      const err = await kycDirectUpdate(u.id, { kyc_status: 'rejected', kyc_note: note })
      if (err) { showToast(`خطأ: ${err}`, false); return }
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

  // handleKYCRevokeConfirm — إلغاء توثيق الهوية لمستخدم موثَّق مسبقاً مع إشعار
  const handleKYCRevokeConfirm = async () => {
    if (!kycRevokeModal) return
    const u = kycRevokeModal.user
    const note = kycRevokeNote.trim() || 'تم إلغاء توثيق هويتك من قِبل الإدارة'
    setKycActionLoading(u.id)
    try {
      const err = await kycDirectUpdate(u.id, { kyc_status: 'none', kyc_note: null, national_id: null, id_document_url: null })
      if (err) { showToast(`خطأ: ${err}`, false); return }
      if (u.auth_user_id) {
        await createNotification({
          authUserId: u.auth_user_id,
          title: 'تم إلغاء توثيق هويتك ⚠️',
          message: `تم إلغاء توثيق هويتك من قِبل الإدارة. الملاحظة: ${note}. يمكنك إعادة تقديم بيانات هويتك.`,
          type: 'error',
        })
      }
      setUsers(us => us.map(x => x.id === u.id ? { ...x, kyc_status: 'none', kyc_note: null, national_id: null, id_document_url: null } : x))
      showToast('تم إلغاء التوثيق وإرسال الإشعار للمستخدم', true)
      setKycRevokeModal(null)
      setKycRevokeNote('')
    } catch {
      showToast('حدث خطأ أثناء إلغاء التوثيق', false)
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

      {/* KYC Image Modal — يعرض صورة هوية المستخدم */}
      {/* loading=true: spinner أثناء جلب signed URL من Supabase */}
      {/* url تنتهي .pdf: رابط "فتح ملف PDF" في تاب جديد */}
      {/* غير ذلك: صورة مع onError كـ fallback إذا انتهت صلاحية الـ URL */}
      {kycImageModal && (
        <div className="adm-overlay" onClick={() => setKycImageModal(null)}>
          <div className="adm-modal" style={{ maxWidth: 620 }} onClick={e => e.stopPropagation()}>
            <div className="adm-modal-header">
              <span className="adm-modal-title">صورة الهوية</span>
              <button className="wsm-close" onClick={() => setKycImageModal(null)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              {kycImageModal.loading ? (
                <div className="bc-spinner" style={{ margin: '40px auto' }} />
              ) : kycImageModal.url.toLowerCase().endsWith('.pdf') ? (
                <a href={kycImageModal.url} target="_blank" rel="noreferrer" className="adm-doc-link" style={{ fontSize: 16 }}>
                  فتح ملف PDF
                </a>
              ) : (
                <>
                  <img
                    src={kycImageModal.url}
                    alt="صورة الهوية"
                    style={{ maxWidth: '100%', maxHeight: '60vh', borderRadius: 8, border: '1px solid #e2e8f0', display: 'block', margin: '0 auto' }}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* KYC Revoke Modal — يؤكد إلغاء توثيق مستخدم موثَّق ويطلب ملاحظة اختيارية */}
      {/* البانر الأحمر: تحذير من حذف البيانات بشكل دائم */}
      {/* textarea: ملاحظة اختيارية تُضاف لنص الإشعار المرسَل للمستخدم */}
      {kycRevokeModal && (
        <div className="adm-overlay" onClick={() => setKycRevokeModal(null)}>
          <div className="adm-modal" onClick={e => e.stopPropagation()}>
            <div className="adm-modal-header">
              <span className="adm-modal-title">إلغاء توثيق الهوية</span>
              <button className="wsm-close" onClick={() => setKycRevokeModal(null)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <p className="adm-modal-right-title">{kycRevokeModal.user.full_name || kycRevokeModal.user.email}</p>
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: '#ef4444' }}>
              ⚠️ سيتم حذف بيانات الهوية وإلغاء التوثيق. سيحتاج المستخدم لإعادة رفع هويته.
            </div>
            <textarea
              className="adm-modal-textarea"
              placeholder="اكتب ملاحظة للمستخدم (مثال: تبيّن أن الهوية مزوّرة، معلومات غير مطابقة...)"
              value={kycRevokeNote}
              onChange={e => setKycRevokeNote(e.target.value)}
              rows={3}
            />
            <div className="adm-modal-actions">
              <button className="adm-btn-cancel" onClick={() => setKycRevokeModal(null)}>إلغاء</button>
              <button
                className="adm-btn-reject-confirm"
                style={{ background: '#ef4444' }}
                disabled={kycActionLoading === kycRevokeModal.user.id}
                onClick={handleKYCRevokeConfirm}
              >
                {kycActionLoading === kycRevokeModal.user.id ? <span className="btn-spinner" /> : null}
                تأكيد الإلغاء وإرسال الإشعار
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
          <StatCard icon="📋" label="الحقوق المسجلة"  value={stats.rights} color="#2563eb" onClick={() => setActiveTab('rights')} />
          <StatCard icon="👥" label="المستخدمون"      value={stats.users}  color="#7c3aed" onClick={() => setActiveTab('users')} />
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
          <button className={`adm-tab${activeTab === 'contract' ? ' adm-tab-active' : ''}`} onClick={() => setActiveTab('contract')}>
            العقد الذكي
            {!isContractDeployed() && <span className="adm-tab-badge" style={{ background: '#ef4444' }}>!</span>}
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
                      {/* button بدل <a> — bucket خاص لا يدعم الرابط المباشر → handleViewKYCImage تجلب signed URL */}
                      {u.id_document_url ? (
                        <button className="adm-doc-link" style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => handleViewKYCImage(u.id_document_url!)}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                          </svg>
                          عرض
                        </button>
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
                      ) : u.kyc_status === 'verified' ? (
                        // زر "إلغاء التوثيق" — يظهر فقط للمستخدمين الموثَّقين → يفتح kycRevokeModal
                        <button
                          className="adm-btn-reject"
                          style={{ fontSize: 12 }}
                          disabled={kycActionLoading === u.id}
                          onClick={() => { setKycRevokeModal({ user: u }); setKycRevokeNote('') }}
                        >
                          {kycActionLoading === u.id ? <span className="btn-spinner" style={{ width: 12, height: 12, borderWidth: 2 }} /> : '🗑'}  إلغاء التوثيق
                        </button>
                      ) : (
                        <span className="adm-reviewed-label">تمت المراجعة</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'contract' ? (
          <div style={{ maxWidth: 620, margin: '0 auto', padding: '8px 0' }}>
            {/* حالة العقد */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px',
              borderRadius: 10, marginBottom: 20,
              background: deployedAddr && deployedAddr !== '0x0000000000000000000000000000000000000000'
                ? 'rgba(5,150,105,0.08)' : 'rgba(239,68,68,0.08)',
              border: `1px solid ${deployedAddr && deployedAddr !== '0x0000000000000000000000000000000000000000' ? 'rgba(5,150,105,0.25)' : 'rgba(239,68,68,0.25)'}`,
            }}>
              <span style={{ fontSize: 22 }}>
                {deployedAddr && deployedAddr !== '0x0000000000000000000000000000000000000000' ? '✅' : '⚠️'}
              </span>
              <div>
                <p style={{ margin: 0, fontWeight: 600, fontSize: 14,
                  color: deployedAddr && deployedAddr !== '0x0000000000000000000000000000000000000000' ? '#059669' : '#dc2626' }}>
                  {deployedAddr && deployedAddr !== '0x0000000000000000000000000000000000000000'
                    ? 'العقد الذكي منشور ويعمل'
                    : 'العقد الذكي غير منشور — التسجيل معطّل'}
                </p>
                {deployedAddr && deployedAddr !== '0x0000000000000000000000000000000000000000' && (
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6b7280', fontFamily: 'monospace', wordBreak: 'break-all' }} dir="ltr">
                    {deployedAddr}
                  </p>
                )}
              </div>
            </div>

            {/* زر النشر التلقائي */}
            {(!deployedAddr || deployedAddr === '0x0000000000000000000000000000000000000000') && (
              <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border, #e2e8f0)', borderRadius: 12, padding: '20px 24px', marginBottom: 20 }}>
                <h3 style={{ margin: '0 0 8px', fontSize: 16 }}>نشر العقد تلقائياً</h3>
                <p style={{ margin: '0 0 16px', fontSize: 13, color: '#6b7280' }}>
                  سيقوم المتصفح بتحميل المترجم وتجميع العقد ونشره على Sepolia عبر MetaMask.
                  تأكد من أن محفظتك على شبكة Sepolia وبها ETH تجريبي.
                </p>
                {deployStatus && (
                  <p style={{ margin: '0 0 12px', fontSize: 13, padding: '8px 12px', borderRadius: 8,
                    background: deployStatus.startsWith('✅') ? 'rgba(5,150,105,0.08)' : deployStatus.startsWith('❌') ? 'rgba(239,68,68,0.08)' : 'rgba(59,130,246,0.08)',
                    color: deployStatus.startsWith('✅') ? '#059669' : deployStatus.startsWith('❌') ? '#dc2626' : '#2563eb',
                    border: '1px solid currentColor', borderColor: 'transparent',
                  }}>
                    {deployStatus}
                  </p>
                )}
                <button
                  className="btn-bc-primary"
                  style={{ width: '100%', justifyContent: 'center', gap: 8 }}
                  disabled={deploying}
                  onClick={handleDeploy}
                >
                  {deploying ? <span className="bc-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : '🚀'}
                  {deploying ? 'جاري النشر...' : 'نشر العقد الذكي عبر MetaMask'}
                </button>
              </div>
            )}

            {/* إضافة عنوان يدوياً */}
            <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border, #e2e8f0)', borderRadius: 12, padding: '20px 24px', marginBottom: 20 }}>
              <h3 style={{ margin: '0 0 8px', fontSize: 16 }}>إدخال عنوان العقد يدوياً</h3>
              <p style={{ margin: '0 0 12px', fontSize: 13, color: '#6b7280' }}>
                إذا نشرت العقد من مكان آخر، الصق عنوانه هنا:
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="wsm-input"
                  dir="ltr"
                  placeholder="0x..."
                  value={manualAddr}
                  onChange={e => { setManualAddr(e.target.value); setManualSaved(false) }}
                  style={{ flex: 1, fontFamily: 'monospace', fontSize: 13 }}
                />
                <button className="adm-btn-approve" onClick={handleSaveManual}>
                  {manualSaved ? '✓ محفوظ' : 'حفظ'}
                </button>
              </div>
            </div>

            {/* تعليمات .env.local */}
            {deployedAddr && deployedAddr !== '0x0000000000000000000000000000000000000000' && (
              <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 12, padding: '16px 20px' }}>
                <p style={{ margin: '0 0 8px', fontWeight: 600, fontSize: 13, color: '#2563eb' }}>
                  💡 لجعل العنوان دائماً (بعد إعادة تحميل الصفحة):
                </p>
                <p style={{ margin: '0 0 8px', fontSize: 12, color: '#6b7280' }}>
                  أضف هذا السطر في ملف <code>.env.local</code>:
                </p>
                <div style={{ background: '#1e293b', borderRadius: 8, padding: '10px 14px', fontFamily: 'monospace', fontSize: 12, color: '#94a3b8', direction: 'ltr', wordBreak: 'break-all' }}>
                  VITE_CONTRACT_ADDRESS={deployedAddr}
                </div>
                <p style={{ margin: '8px 0 0', fontSize: 12, color: '#6b7280' }}>
                  ثم أعد تشغيل التطبيق (npm run dev)
                </p>
              </div>
            )}
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
                  <th>التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {rights.length === 0 ? (
                  <tr><td colSpan={6} className="adm-empty-cell">لا توجد بيانات</td></tr>
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

// ════════════════════════════════════════════════════════════════
// SECTION: STAT CARD — بطاقة الإحصائية القابلة للنقر
// للتعديل: ابحث عن STAT CARD
// إذا كان onClick موجوداً → تُضاف كلاسة adm-stat-card-link + سهم
// ════════════════════════════════════════════════════════════════
function StatCard({ icon, label, value, color, onClick }: { icon: string; label: string; value: number; color: string; onClick?: () => void }) {
  return (
    <div className={`adm-stat-card${onClick ? ' adm-stat-card-link' : ''}`} onClick={onClick} role={onClick ? 'button' : undefined}>
      <div className="adm-stat-icon" style={{ background: color + '18', color }}>{icon}</div>
      <div>
        <p className="adm-stat-value" style={{ color }}>{value.toLocaleString('ar-EG')}</p>
        <p className="adm-stat-label">{label}</p>
      </div>
      {onClick && (
        <svg className="adm-stat-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
          <path d="m15 18-6-6 6-6"/>
        </svg>
      )}
    </div>
  )
}