// ════════════════════════════════════════════════════════════════
// FILE: src/lib/supabase-ipr.ts
// كل عمليات Supabase المتعلقة بالحقوق الفكرية، الملفات، الإشعارات، التقييمات
// الجداول: Rights | Ip_files | notifications | site_ratings | profiles
// للتعديل: ابحث عن اسم الجدول أو الوظيفة مثل: Rights / notifications / submitRating
// ════════════════════════════════════════════════════════════════
import { supabase } from './supabase'
import { supabaseAdmin } from './supabase-admin'
import type { RegisterResult } from './blockchain'
import { hammingDistance, PHASH_THRESHOLD, transferCertOnChain } from './blockchain'

// ════════════════════════════════════════════════════════════════
// SECTION: TYPES — أنواع البيانات
// للتعديل: ابحث عن TYPES
// ════════════════════════════════════════════════════════════════

// ExtraFields: حقول إضافية تختلف حسب نوع الحق الفكري (ipType)
export interface ExtraFieldsCopyright {
  work_type?: string        // نوع العمل: book / software / image / music / video
  publication_date?: string // تاريخ النشر
}
export interface ExtraFieldsTrademark {
  nice_class?: string       // تصنيف نيس الدولي (1-45)
  logo_description?: string // وصف الشعار
}
export interface ExtraFieldsPatent {
  technical_field?: string  // المجال التقني للاختراع
  inventors?: string        // أسماء المخترعين
  claims?: string           // المطالبات القانونية
}
export type ExtraFields = ExtraFieldsCopyright | ExtraFieldsTrademark | ExtraFieldsPatent

// RightsRow: بنية صف كامل من جدول Rights في Supabase
export interface RightsRow {
  id: number
  user_id: number | null
  auth_user_id: string | null    // يشير لـ auth.users.id
  title: string
  ip_type: number                // 0=حق مؤلف  1=علامة تجارية  2=براءة اختراع
  description: string
  holder_name: string
  holder_email: string | null
  cert_id: string                // رقم الشهادة على البلوكشين
  tx_hash: string                // هاش المعاملة على Ethereum
  document_hash: string          // SHA-256 للملف
  block_number: number           // رقم الكتلة
  wallet_address: string
  extra_fields: ExtraFields | null
  perceptual_hash: string | null // البصمة البصرية للصورة (pHash)
  status: 'pending' | 'approved' | 'rejected'
  review_note: string | null     // ملاحظة الأدمن عند المراجعة
  created_at: string
}

// SaveCertParams: المعاملات المطلوبة لحفظ شهادة جديدة → saveCertToSupabase
export interface SaveCertParams {
  userId: string
  walletAddress: string
  title: string
  ipType: number
  description: string
  holderName: string
  holderEmail?: string
  extraFields?: ExtraFields
  perceptualHash?: string
  result: RegisterResult   // نتيجة التسجيل من البلوكشين → src/lib/blockchain.ts
}

// ════════════════════════════════════════════════════════════════
// SECTION: RIGHTS — عمليات جدول Rights
// للتعديل: ابحث عن RIGHTS
// ════════════════════════════════════════════════════════════════

// ── checkPerceptualDuplicate ──────────────────────────────────
// يفحص إذا كان الملف مسجّلاً مسبقاً باستخدام Perceptual Hash
// يقارن pHash الجديد مع كل pHash في DB → hammingDistance ≤ PHASH_THRESHOLD = تكرار
// يُستخدم في: RegisterRightPage → handleFormSubmit قبل الانتقال لخطوة التأكيد
export async function checkPerceptualDuplicate(
  pHash: string
): Promise<{ isDuplicate: boolean; similarTitle?: string; similarHolder?: string }> {
  const { data } = await supabase
    .from('Rights')
    .select('title, holder_name, perceptual_hash')
    .not('perceptual_hash', 'is', null) // فقط الصفوف التي لها pHash

  if (!data?.length) return { isDuplicate: false }

  for (const row of data as { title: string; holder_name: string; perceptual_hash: string }[]) {
    if (row.perceptual_hash && hammingDistance(pHash, row.perceptual_hash) <= PHASH_THRESHOLD) {
      // وُجد تشابه بصري → أعد اسم العمل وصاحبه
      return { isDuplicate: true, similarTitle: row.title, similarHolder: row.holder_name }
    }
  }
  return { isDuplicate: false }
}

// ── saveCertToSupabase ────────────────────────────────────────
// يحفظ شهادة جديدة: أولاً في Intellectual_Properties ثم في Rights
// يُستخدم في: RegisterRightPage → handleRegister (الخطوة 2)
export async function saveCertToSupabase(params: SaveCertParams): Promise<{ ipId: number }> {
  const SVCKEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY as string
  const DBURL  = import.meta.env.VITE_SUPABASE_URL as string

  // دالة مساعدة: POST مباشر للـ REST API بـ service role key يتجاوز RLS
  const adminPost = async (table: string, body: object) => {
    const res = await fetch(`${DBURL}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        'apikey': SVCKEY,
        'Authorization': `Bearer ${SVCKEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(body),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(JSON.stringify(json))
    return Array.isArray(json) ? json[0] : json
  }

  // الخطوة 1: إدخال في Intellectual_Properties والحصول على ip_id
  const ipRow = await adminPost('Intellectual_Properties', {
    title:             params.title,
    type:              params.ipType,
    description:       params.description,
    registration_date: new Date().toISOString().slice(0, 10),
    status:            'pending',
  })
  if (!ipRow?.id) throw new Error('فشل حفظ السجل في Intellectual_Properties')

  // الخطوة 2: إدخال في Rights مع ip_id المستخرج
  await adminPost('Rights', {
    auth_user_id:    params.userId,
    wallet_address:  params.walletAddress,
    title:           params.title,
    ip_type:         params.ipType,
    right_type:      params.ipType,
    ip_id:           ipRow.id,
    description:     params.description,
    holder_name:     params.holderName,
    holder_email:    params.holderEmail ?? null,
    extra_fields:    params.extraFields ?? null,
    perceptual_hash: params.perceptualHash ?? null,
    cert_id:         params.result.certId,
    tx_hash:         params.result.txHash,
    document_hash:   params.result.documentHash,
    block_number:    params.result.blockNumber,
    status:          'pending',
  })

  return { ipId: ipRow.id }
}

// ── uploadIPFile ──────────────────────────────────────────────
// يرفع الملف المحمي لـ Supabase Storage → bucket: ip-files
// ثم يُسجّل سجلاً في جدول Ip_files لربط الملف بالشهادة
// يُستخدم في: RegisterRightPage → handleRegister (الخطوة 3)
export async function uploadIPFile(file: File, certId: string, ipId: number): Promise<void> {
  const ext  = file.name.split('.').pop() ?? 'bin'
  const path = `${certId}/${Date.now()}.${ext}` // مسار فريد: {certId}/{timestamp}.{ext}

  const { error: uploadErr } = await supabase.storage.from('ip-files').upload(path, file)
  if (uploadErr) throw uploadErr

  const { error: dbErr } = await supabase.from('Ip_files').insert({
    ip_id:        ipId,
    file_name:    file.name,
    file_type:    file.type || ext,
    uploaded_at:  new Date().toISOString().slice(0, 10), // تاريخ فقط بدون وقت
  })
  if (dbErr) throw dbErr
}

// ── getUserCerts ──────────────────────────────────────────────
// جلب كل شهادات مستخدم معين من جدول Rights مرتبة بالأحدث
// يُستخدم في: CertificatesPage
export async function getUserCerts(userId: string): Promise<RightsRow[]> {
  const db = supabaseAdmin ?? supabase
  const { data, error } = await db
    .from('Rights')
    .select('*')
    .eq('auth_user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as RightsRow[]
}

// ── transferCertificateAndSync ──────────────────────────────────
// نقل ملكية شهادة: يوقّع معاملة على البلوكشين ثم يزامن Supabase كاملاً
// نقطة دخول موحّدة — تُستخدم من CertificatesPage وSettingsModal معاً
// التعديل: صار ينقل auth_user_id + holder_name + holder_email للمالك الجديد
// (سابقاً كان يحدّث wallet_address فقط → الشهادة لا تظهر في "شهاداتي"
//  عند المالك الجديد لأن getUserCerts تفلتر على auth_user_id)
export async function transferCertificateAndSync(certId: string, toAddress: string): Promise<string> {
  const txHash = await transferCertOnChain(certId, toAddress)
  const db = supabaseAdmin ?? supabase
  const addr = toAddress.toLowerCase()

  // البحث عن حساب المالك الجديد عبر عنوان محفظته في profiles
  // (يتطلب عمود wallet_address في جدول profiles)
  const { data: newOwner } = await db
    .from('profiles')
    .select('auth_user_id, full_name, email')
    .ilike('wallet_address', addr) // مطابقة غير حساسة لحالة الأحرف
    .maybeSingle()

  const patch: Record<string, unknown> = { wallet_address: toAddress }
  if (newOwner?.auth_user_id) {
    // المستلم مستخدم مسجّل بالمنصة → انقل الصف كاملاً لحسابه
    patch.auth_user_id = newOwner.auth_user_id
    if (newOwner.full_name) patch.holder_name = newOwner.full_name
    patch.holder_email = newOwner.email ?? null
  }
  // إذا المستلم غير مسجّل: يتحدث wallet_address فقط،
  // ويرى شهادته فور توصيل محفظته (وضع Blockchain في CertificatesPage)

  const { error } = await db.from('Rights').update(patch).eq('cert_id', certId)
  if (error) throw error // سابقاً كان يفشل بصمت بدون أي فحص

  return txHash
}

// ── getCertTxHash ──────────────────────────────────────────────
// جلب هاش معاملة تسجيل شهادة بمعرّفها (للربط المباشر بـ Etherscan)
export async function getCertTxHash(certId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('Rights')
    .select('tx_hash')
    .eq('cert_id', certId)
    .maybeSingle()
  if (error || !data) return null
  return (data as { tx_hash: string }).tx_hash
}

// ── getRightByCertId ─────────────────────────────────────────────
// يجلب حقاً واحداً مباشرة برقم الشهادة (للشهادات الأقدم من آخر 100 حق)
// يُستخدم في: PublicRegistryPage → رابط QR لشهادة غير موجودة في القائمة المحمّلة
export async function getRightByCertId(certId: string): Promise<RightsRow | null> {
  const db = supabaseAdmin ?? supabase
  const { data, error } = await db
    .from('Rights')
    .select('*')
    .eq('cert_id', certId)
    .maybeSingle()
  if (error || !data) return null
  return data as RightsRow
}

// ── getAllRights ───────────────────────────────────────────────
// جلب كل الحقوق المسجّلة (حد أقصى 100) للأدمن أو السجل العام
// يُستخدم في: AdminDashboard → تبويب الحقوق
export async function getAllRights(): Promise<RightsRow[]> {
  const db = supabaseAdmin ?? supabase
  const { data, error } = await db
    .from('Rights')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) throw error
  return (data ?? []) as RightsRow[]
}

// ── saveWalletAddress ──────────────────────────────────────────
// يحفظ عنوان محفظة Ethereum في Rights وprofiles وuser_metadata
// التعديل: صار يحفظ العنوان في profiles.wallet_address أيضاً —
// ضروري لنقل الملكية: منه نعرف auth_user_id للمستلم من عنوان محفظته
// يُستخدم في: WalletConnect عند ربط محفظة جديدة
export async function saveWalletAddress(authUserId: string, walletAddress: string): Promise<void> {
  const { error } = await supabase
    .from('Rights')
    .update({ wallet_address: walletAddress })
    .eq('auth_user_id', authUserId)
    .eq('wallet_address', '') // يحدّث فقط الصفوف التي ليس لها عنوان محفظة

  // جديد: ربط المحفظة بالبروفايل (بأحرف صغيرة لتوحيد المقارنة)
  const { error: profileErr } = await supabase
    .from('profiles')
    .update({ wallet_address: walletAddress.toLowerCase() })
    .eq('auth_user_id', authUserId)
  if (profileErr) console.warn('profile wallet save:', profileErr.message)

  await supabase.auth.updateUser({ data: { wallet_address: walletAddress } })
  if (error) console.warn('wallet save:', error.message)
}

// ════════════════════════════════════════════════════════════════
// SECTION: NOTIFICATIONS — الإشعارات
// للتعديل: ابحث عن NOTIFICATIONS
// جدول: notifications (auth_user_id, title, message, type, is_read)
// ════════════════════════════════════════════════════════════════

export interface Notification {
  id: number
  auth_user_id: string
  title: string
  message: string
  type: 'success' | 'error' | 'info'
  is_read: boolean
  created_at: string
}

// ── createNotification ────────────────────────────────────────
// ينشئ إشعاراً جديداً لمستخدم معين في جدول notifications
// يُستخدم في: AdminDashboard عند قبول/رفض KYC أو حق فكري
export async function createNotification(params: {
  authUserId: string
  title: string
  message: string
  type: 'success' | 'error' | 'info'
}): Promise<void> {
  const { error } = await supabase.from('notifications').insert({
    auth_user_id: params.authUserId,
    title: params.title,
    message: params.message,
    type: params.type,  // 'success'=أخضر  'error'=أحمر  'info'=أزرق
  })
  if (error) throw error
}

// ── getUserNotifications ──────────────────────────────────────
// جلب آخر 30 إشعاراً للمستخدم مرتبة بالأحدث
// يُستخدم في: Navbar → جرس الإشعارات
export async function getUserNotifications(authUserId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('auth_user_id', authUserId)
    .order('created_at', { ascending: false })
    .limit(30) // آخر 30 إشعار فقط
  if (error) throw error
  return (data ?? []) as Notification[]
}

// ── markNotificationsRead ─────────────────────────────────────
// يضع is_read=true لكل الإشعارات غير المقروءة للمستخدم
// يُستخدم في: Navbar عند فتح قائمة الإشعارات
export async function markNotificationsRead(authUserId: string): Promise<void> {
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('auth_user_id', authUserId)
    .eq('is_read', false) // فقط الغير مقروءة — لتجنب عمليات غير ضرورية
}

// ════════════════════════════════════════════════════════════════
// SECTION: RATINGS — تقييمات الموقع
// للتعديل: ابحث عن RATINGS
// جدول: site_ratings (auth_user_id, stars) — كل مستخدم تقييم واحد
// ════════════════════════════════════════════════════════════════

export interface RatingStats { avg: number; count: number }

// ── getRatingStats ────────────────────────────────────────────
// يحسب متوسط التقييم وعدد المُقيِّمين من جدول site_ratings
// يُستخدم في: RatingSection (الصفحة الرئيسية)
export async function getRatingStats(): Promise<RatingStats> {
  const { data, error } = await supabase.from('site_ratings').select('stars')
  if (error) throw error
  const rows = (data ?? []) as { stars: number }[]
  if (!rows.length) return { avg: 0, count: 0 }
  const avg = rows.reduce((s, r) => s + r.stars, 0) / rows.length // المتوسط الحسابي
  return { avg: Math.round(avg * 10) / 10, count: rows.length }   // تقريب لرقم عشري واحد
}

// ── getUserRating ─────────────────────────────────────────────
// جلب تقييم مستخدم محدد (إذا قيّم سابقاً)
// يُستخدم في: RatingSection لعرض التقييم الحالي للمستخدم
export async function getUserRating(userId: string): Promise<number | null> {
  const { data } = await supabase
    .from('site_ratings')
    .select('stars')
    .eq('auth_user_id', userId)
    .single()
  return (data as { stars: number } | null)?.stars ?? null
}

// ── submitRating ──────────────────────────────────────────────
// يحفظ أو يحدّث تقييم المستخدم (upsert → insert إذا جديد، update إذا موجود)
// onConflict='auth_user_id' → مستخدم واحد = تقييم واحد فقط
// يُستخدم في: RatingSection عند اختيار النجوم
export async function submitRating(userId: string, stars: number): Promise<void> {
  const { error } = await supabase
    .from('site_ratings')
    .upsert({ auth_user_id: userId, stars }, { onConflict: 'auth_user_id' })
  if (error) throw error
}

// ════════════════════════════════════════════════════════════════
// SECTION: STATISTICS — إحصائيات الموقع
// للتعديل: ابحث عن STATISTICS
// ════════════════════════════════════════════════════════════════

// ── getStatistics ──────────────────────────────────────────────
// يجلب عدد الحقوق المسجّلة وعدد المستخدمين من DB في طلب واحد متوازٍ
// يُستخدم في: StatisticsSection، HeroSection، AdminDashboard
export async function getStatistics(): Promise<{ rights: number; users: number }> {
  const [{ count: rights }, { count: users }] = await Promise.all([
    supabase.from('Rights').select('*', { count: 'exact', head: true }),   // count فقط بدون بيانات
    supabase.from('profiles').select('*', { count: 'exact', head: true }), // count فقط بدون بيانات
  ])
  return { rights: rights ?? 0, users: users ?? 0 }
}
