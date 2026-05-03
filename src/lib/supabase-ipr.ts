import { supabase } from './supabase'
import type { RegisterResult } from './blockchain'

// ─── Types ────────────────────────────────────────────────────────────────────
export interface RightsRow {
  id: number
  user_id: number | null
  auth_user_id: string | null
  title: string
  ip_type: number
  description: string
  holder_name: string
  cert_id: string
  tx_hash: string
  document_hash: string
  block_number: number
  wallet_address: string
  created_at: string
}

export interface SaveCertParams {
  userId: string          // Supabase auth UUID
  walletAddress: string
  title: string
  ipType: number
  description: string
  holderName: string
  result: RegisterResult
}

// ─── حفظ بعد تسجيل البلوكتشين ────────────────────────────────────────────────
export async function saveCertToSupabase(params: SaveCertParams): Promise<void> {
  const { error } = await supabase.from('Rights').insert({
    auth_user_id:  params.userId,
    wallet_address: params.walletAddress,
    title:         params.title,
    ip_type:       params.ipType,
    description:   params.description,
    holder_name:   params.holderName,
    cert_id:       params.result.certId,
    tx_hash:       params.result.txHash,
    document_hash: params.result.documentHash,
    block_number:  params.result.blockNumber,
  })
  if (error) throw error
}

// ─── رفع الملف لـ Supabase Storage وحفظ السجل ────────────────────────────────
export async function uploadIPFile(file: File, certId: string): Promise<void> {
  const ext  = file.name.split('.').pop() ?? 'bin'
  const path = `${certId}/${Date.now()}.${ext}`

  const { error: uploadErr } = await supabase.storage.from('ip-files').upload(path, file)
  if (uploadErr) throw uploadErr

  const { error: dbErr } = await supabase.from('Ip_files').insert({
    file_name:   file.name,
    file_type:   file.type || ext,
    uploaded_at: new Date().toISOString().slice(0, 10),
    ip_id:       Number(certId) || null,
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
