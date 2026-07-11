// ════════════════════════════════════════════════════════════════
// FILE: src/lib/supabase-ipr.ts
// كل عمليات Supabase المتعلقة بالحقوق الفكرية، الملفات، الإشعارات، التقييمات
// الجداول: Rights | Ip_files | notifications | site_ratings | profiles
// للتعديل: ابحث عن اسم الجدول أو الوظيفة مثل: Rights / notifications / submitRating
// ════════════════════════════════════════════════════════════════
import { supabase } from './supabase'
import type { RegisterResult } from './blockchain'
import { hammingDistance, PHASH_THRESHOLD } from './blockchain'

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
// يحفظ شهادة جديدة في جدول Rights بعد التسجيل على البلوكشين
// يُستخدم في: RegisterRightPage → handleRegister (الخطوة 2)
export async function saveCertToSupabase(params: SaveCertParams): Promise<void> {
  const { error } = await supabase.from('Rights').insert({
    auth_user_id:    params.userId,
    wallet_address:  params.walletAddress,
    title:           params.title,
    ip_type:         params.ipType,
    description:     params.description,
    holder_name:     params.holderName,
    holder_email:    params.holderEmail ?? null,
    extra_fields:    params.extraFields ?? null,   // حقول إضافية حسب نوع الحق
    perceptual_hash: params.perceptualHash ?? null,
    cert_id:         params.result.certId,         // من البلوكشين
    tx_hash:         params.result.txHash,         // من البلوكشين
    document_hash:   params.result.documentHash,   // SHA-256 للملف
    block_number:    params.result.blockNumber,    // رقم الكتلة
    status:          'pending',                    // الحالة الافتراضية عند التسجيل
  })
  if (error) throw error
}

// ── uploadIPFile ──────────────────────────────────────────────
// يرفع الملف المحمي لـ Supabase Storage → bucket: ip-files
// ثم يُسجّل سجلاً في جدول Ip_files لربط الملف بالشهادة
// يُستخدم في: RegisterRightPage → handleRegister (الخطوة 3)
export async function uploadIPFile(file: File, certId: string): Promise<void> {
  const ext  = file.name.split('.').pop() ?? 'bin'
  const path = `${certId}/${Date.now()}.${ext}` // مسار فريد: {certId}/{timestamp}.{ext}

  const { error: uploadErr } = await supabase.storage.from('ip-files').upload(path, file)
  if (uploadErr) throw uploadErr

  const { data: { user } } = await supabase.auth.getUser()
  const { error: dbErr } = await supabase.from('Ip_files').insert({
    cert_id:      certId,
    file_name:    file.name,
    file_type:    file.type || ext,
    uploaded_at:  new Date().toISOString().slice(0, 10), // تاريخ فقط بدون وقت
    auth_user_id: user?.id ?? null,
  })
  if (dbErr) throw dbErr
}

// ── updateRightStatus ─────────────────────────────────────────
// يغيّر حالة حق فكري (approved/rejected) ويضيف ملاحظة المراجعة
// يُستخدم في: AdminDashboard → تبويب "إدارة الحقوق"
export async function updateRightStatus(
  id: number,
  status: 'approved' | 'rejected',
  reviewNote?: string
): Promise<void> {
  const { error } = await supabase
    .from('Rights')
    .update({ status, review_note: reviewNote ?? null })
    .eq('id', id) // تحديث صف واحد بالـ id
  if (error) throw error
}

// ── getUserCerts ──────────────────────────────────────────────
// جلب كل شهادات مستخدم معين من جدول Rights مرتبة بالأحدث
// يُستخدم في: CertificatesPage
export async function getUserCerts(userId: string): Promise<RightsRow[]> {
  const { data, error } = await supabase
    .from('Rights')
    .select('*')
    .eq('auth_user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as RightsRow[]
}

// ── getAllRights ───────────────────────────────────────────────
// جلب كل الحقوق المسجّلة (حد أقصى 100) للأدمن أو السجل العام
// يُستخدم في: AdminDashboard → تبويب الحقوق
export async function getAllRights(): Promise<RightsRow[]> {
  const { data, error } = await supabase
    .from('Rights')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100) // لمنع جلب كميات ضخمة
  if (error) throw error
  return (data ?? []) as RightsRow[]
}

// ── saveWalletAddress ──────────────────────────────────────────
// يحفظ عنوان محفظة Ethereum في Rights وفي user_metadata
// يُستخدم في: WalletConnect عند ربط محفظة جديدة
export async function saveWalletAddress(authUserId: string, walletAddress: string): Promise<void> {
  const { error } = await supabase
    .from('Rights')
    .update({ wallet_address: walletAddress })
    .eq('auth_user_id', authUserId)
    .eq('wallet_address', '') // يحدّث فقط الصفوف التي ليس لها عنوان محفظة
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
