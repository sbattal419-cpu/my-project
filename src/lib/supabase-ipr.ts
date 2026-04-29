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
