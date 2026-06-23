import { supabase } from './supabase'

export async function uploadAvatar(file: File, userId: string): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${userId}/avatar.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type })
  if (uploadError) throw uploadError

  const { data } = supabase.storage.from('avatars').getPublicUrl(path)

  const { error: updateError } = await supabase.auth.updateUser({
    data: { avatar_url: data.publicUrl }
  })
  if (updateError) throw updateError

  return data.publicUrl
}

export async function signUp(email: string, password: string, fullName?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName ?? '' } },
  })
  if (error) throw error
  return data
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function updateProfile(fullName: string) {
  const { error } = await supabase.auth.updateUser({ data: { full_name: fullName } })
  if (error) throw error
}

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
}

export async function verifyCurrentPassword(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error('كلمة المرور الحالية غير صحيحة')
}

export async function verifyEmailOTP(email: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'signup',
  })
  if (error) throw error
  return data
}

export async function resendVerificationOTP(email: string) {
  const { error } = await supabase.auth.resend({ type: 'signup', email })
  if (error) throw error
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email)
  if (error) throw error
}

export async function verifyRecoveryOTP(email: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'recovery',
  })
  if (error) throw error
  return data
}

export async function updateEmail(newEmail: string) {
  const { error } = await supabase.auth.updateUser({ email: newEmail })
  if (error) throw error
}

export async function updatePhone(phone: string) {
  const { error } = await supabase.auth.updateUser({ data: { phone_number: phone } })
  if (error) throw error
}

export async function uploadIDDocument(file: File, userId: string): Promise<void> {
  const ext  = file.name.split('.').pop() ?? 'jpg'
  const path = `${userId}/id.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('id-documents')
    .upload(path, file, { upsert: true, contentType: file.type })
  if (uploadError) throw uploadError

  const { error: updateError } = await supabase.auth.updateUser({
    data: { id_verified: true, id_uploaded_at: new Date().toISOString() },
  })
  if (updateError) throw updateError
}

export async function submitKYC(nationalId: string, documentFile: File): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('يجب تسجيل الدخول أولاً')

  const ext  = documentFile.name.split('.').pop() ?? 'jpg'
  const path = `${user.id}/id-kyc.${ext}`

  const { error: uploadErr } = await supabase.storage
    .from('id-documents')
    .upload(path, documentFile, { upsert: true, contentType: documentFile.type })
  if (uploadErr) throw uploadErr

  const { data: urlData } = supabase.storage.from('id-documents').getPublicUrl(path)

  const { error: dbErr } = await supabase
    .from('profiles')
    .update({
      national_id:      nationalId.trim(),
      id_document_url:  urlData.publicUrl,
      kyc_status:       'pending',
      kyc_submitted_at: new Date().toISOString(),
      kyc_note:         null,
    })
    .eq('auth_user_id', user.id)
  if (dbErr) throw dbErr
}

export async function getKYCStatus(): Promise<{
  national_id: string | null
  kyc_status: string | null
  kyc_note: string | null
  id_document_url: string | null
} | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('national_id, kyc_status, kyc_note, id_document_url')
    .eq('auth_user_id', user.id)
    .single()

  return data
}
