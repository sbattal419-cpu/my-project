import { supabase } from './supabase'
import type { RegisterResult } from './blockchain'
import { hammingDistance, PHASH_THRESHOLD } from './blockchain'

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ExtraFieldsCopyright {
  work_type?: string
  publication_date?: string
}
export interface ExtraFieldsTrademark {
  nice_class?: string
  logo_description?: string
}
export interface ExtraFieldsPatent {
  technical_field?: string
  inventors?: string
  claims?: string
}
export type ExtraFields = ExtraFieldsCopyright | ExtraFieldsTrademark | ExtraFieldsPatent

export interface RightsRow {
  id: number
  user_id: number | null
  auth_user_id: string | null
  title: string
  ip_type: number
  description: string
  holder_name: string
  holder_email: string | null
  cert_id: string
  tx_hash: string
  document_hash: string
  block_number: number
  wallet_address: string
  extra_fields: ExtraFields | null
  perceptual_hash: string | null
  status: 'pending' | 'approved' | 'rejected'
  review_note: string | null
  created_at: string
}

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
  result: RegisterResult
}

// ─── فحص التشابه البصري قبل التسجيل ─────────────────────────────────────────
export async function checkPerceptualDuplicate(
  pHash: string
): Promise<{ isDuplicate: boolean; similarTitle?: string; similarHolder?: string }> {
  const { data } = await supabase
    .from('Rights')
    .select('title, holder_name, perceptual_hash')
    .not('perceptual_hash', 'is', null)

  if (!data?.length) return { isDuplicate: false }

  for (const row of data as { title: string; holder_name: string; perceptual_hash: string }[]) {
    if (row.perceptual_hash && hammingDistance(pHash, row.perceptual_hash) <= PHASH_THRESHOLD) {
      return { isDuplicate: true, similarTitle: row.title, similarHolder: row.holder_name }
    }
  }
  return { isDuplicate: false }
}

// ─── حفظ بعد تسجيل البلوكتشين ────────────────────────────────────────────────
export async function saveCertToSupabase(params: SaveCertParams): Promise<void> {
  const { error } = await supabase.from('Rights').insert({
    auth_user_id:    params.userId,
    wallet_address:  params.walletAddress,
    title:           params.title,
    ip_type:         params.ipType,
    description:     params.description,
    holder_name:     params.holderName,
    holder_email:    params.holderEmail ?? null,
    extra_fields:    params.extraFields ?? null,
    perceptual_hash: params.perceptualHash ?? null,
    cert_id:         params.result.certId,
    tx_hash:         params.result.txHash,
    document_hash:   params.result.documentHash,
    block_number:    params.result.blockNumber,
  })
  if (error) throw error
}

// ─── رفع الملف لـ Supabase Storage وحفظ السجل ────────────────────────────────
export async function uploadIPFile(file: File, certId: string): Promise<void> {
  const ext  = file.name.split('.').pop() ?? 'bin'
  const path = `${certId}/${Date.now()}.${ext}`

  const { error: uploadErr } = await supabase.storage.from('ip-files').upload(path, file)
  if (uploadErr) throw uploadErr

  const { data: { user } } = await supabase.auth.getUser()
  const { error: dbErr } = await supabase.from('Ip_files').insert({
    cert_id:      certId,
    file_name:    file.name,
    file_type:    file.type || ext,
    uploaded_at:  new Date().toISOString().slice(0, 10),
    auth_user_id: user?.id ?? null,
  })
  if (dbErr) throw dbErr
}

// ─── مراجعة الحقوق (أدمن) ────────────────────────────────────────────────────
export async function updateRightStatus(
  id: number,
  status: 'approved' | 'rejected',
  reviewNote?: string
): Promise<void> {
  const { error } = await supabase
    .from('Rights')
    .update({ status, review_note: reviewNote ?? null })
    .eq('id', id)
  if (error) throw error
}

// ─── الإشعارات ────────────────────────────────────────────────────────────────
export interface Notification {
  id: number
  auth_user_id: string
  title: string
  message: string
  type: 'success' | 'error' | 'info'
  is_read: boolean
  created_at: string
}

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
    type: params.type,
  })
  if (error) throw error
}

export async function getUserNotifications(authUserId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('auth_user_id', authUserId)
    .order('created_at', { ascending: false })
    .limit(30)
  if (error) throw error
  return (data ?? []) as Notification[]
}

export async function markNotificationsRead(authUserId: string): Promise<void> {
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('auth_user_id', authUserId)
    .eq('is_read', false)
}

// ─── جلب شهادات المستخدم من Supabase ─────────────────────────────────────────
export async function getUserCerts(userId: string): Promise<RightsRow[]> {
  const { data, error } = await supabase
    .from('Rights')
    .select('*')
    .eq('auth_user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as RightsRow[]
}

// ─── السجل العام (كل الحقوق) ──────────────────────────────────────────────────
export async function getAllRights(): Promise<RightsRow[]> {
  const { data, error } = await supabase
    .from('Rights')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) throw error
  return (data ?? []) as RightsRow[]
}

// ─── حفظ عنوان المحفظة في ملف المستخدم ──────────────────────────────────────
export async function saveWalletAddress(authUserId: string, walletAddress: string): Promise<void> {
  const { error } = await supabase
    .from('Rights')
    .update({ wallet_address: walletAddress })
    .eq('auth_user_id', authUserId)
    .eq('wallet_address', '')
  // نحفظ أيضاً في metadata المستخدم
  await supabase.auth.updateUser({ data: { wallet_address: walletAddress } })
  if (error) console.warn('wallet save:', error.message)
}

// ─── تقييمات الموقع ───────────────────────────────────────────────────────────
export interface RatingStats { avg: number; count: number }

export async function getRatingStats(): Promise<RatingStats> {
  const { data, error } = await supabase.from('site_ratings').select('stars')
  if (error) throw error
  const rows = (data ?? []) as { stars: number }[]
  if (!rows.length) return { avg: 0, count: 0 }
  const avg = rows.reduce((s, r) => s + r.stars, 0) / rows.length
  return { avg: Math.round(avg * 10) / 10, count: rows.length }
}

export async function getUserRating(userId: string): Promise<number | null> {
  const { data } = await supabase
    .from('site_ratings')
    .select('stars')
    .eq('auth_user_id', userId)
    .single()
  return (data as { stars: number } | null)?.stars ?? null
}

export async function submitRating(userId: string, stars: number): Promise<void> {
  const { error } = await supabase
    .from('site_ratings')
    .upsert({ auth_user_id: userId, stars }, { onConflict: 'auth_user_id' })
  if (error) throw error
}

export async function getStatistics(): Promise<{ rights: number; users: number }> {
  const [{ count: rights }, { count: users }] = await Promise.all([
    supabase.from('Rights').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
  ])
  return { rights: rights ?? 0, users: users ?? 0 }
}
