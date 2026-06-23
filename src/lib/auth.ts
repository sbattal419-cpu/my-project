// ════════════════════════════════════════════════════════════════
// FILE: src/lib/auth.ts
// كل العمليات المتعلقة بالمستخدم: تسجيل، دخول، خروج، KYC، OTP
// للتعديل: ابحث عن اسم الوظيفة مباشرة مثل: signUp / signIn / submitKYC
// ════════════════════════════════════════════════════════════════
import { supabase } from './supabase'

// ── uploadAvatar ──────────────────────────────────────────────
// يرفع صورة الأفاتار لـ Supabase Storage → bucket: avatars
// ثم يحدّث user_metadata.avatar_url في Supabase Auth
// يُستخدم في: ProfilePage
export async function uploadAvatar(file: File, userId: string): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${userId}/avatar.${ext}` // مسار الصورة: {userId}/avatar.{ext}

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type }) // upsert=true يستبدل القديمة
  if (uploadError) throw uploadError

  const { data } = supabase.storage.from('avatars').getPublicUrl(path) // رابط عام للصورة

  const { error: updateError } = await supabase.auth.updateUser({
    data: { avatar_url: data.publicUrl } // حفظ الرابط في metadata المستخدم
  })
  if (updateError) throw updateError

  return data.publicUrl
}

// ── signUp ────────────────────────────────────────────────────
// إنشاء حساب جديد في Supabase Auth
// يُرسل إيميل تحقق تلقائياً يحتوي رمز OTP 8 أرقام
// يُستخدم في: RegisterPage
export async function signUp(email: string, password: string, fullName?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName ?? '' } }, // full_name يُحفظ في user_metadata
  })
  if (error) throw error
  return data
}

// ── signIn ────────────────────────────────────────────────────
// تسجيل دخول بالإيميل وكلمة المرور
// يُستخدم في: LoginPage، RegisterPage (بعد تأكيد OTP)
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

// ── signOut ───────────────────────────────────────────────────
// تسجيل الخروج وإنهاء الجلسة
// يُستخدم في: AdminDashboard، Navbar
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// ── getUser ───────────────────────────────────────────────────
// جلب بيانات المستخدم الحالي من Supabase Auth
// يُستخدم في: AuthContext، أي مكان يحتاج user.id
export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// ── updateProfile ─────────────────────────────────────────────
// تحديث الاسم الكامل في user_metadata
// يُستخدم في: ProfilePage → حقل تعديل الاسم
export async function updateProfile(fullName: string) {
  const { error } = await supabase.auth.updateUser({ data: { full_name: fullName } })
  if (error) throw error
}

// ── updatePassword ────────────────────────────────────────────
// تغيير كلمة المرور للمستخدم الحالي
// يُستخدم في: ProfilePage → تغيير كلمة المرور
export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
}

// ── verifyCurrentPassword ─────────────────────────────────────
// التحقق من كلمة المرور الحالية قبل تغييرها
// يُستخدم في: ProfilePage → للتأكد من الهوية قبل تغيير الكلمة
export async function verifyCurrentPassword(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error('كلمة المرور الحالية غير صحيحة')
}

// ── verifyEmailOTP ────────────────────────────────────────────
// التحقق من رمز OTP المُرسَل لتأكيد البريد عند إنشاء حساب
// type='signup' → للتحقق من الحساب الجديد
// يُستخدم في: RegisterPage → خطوة OTP
export async function verifyEmailOTP(email: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'signup', // نوع OTP: تأكيد حساب جديد
  })
  if (error) throw error
  return data
}

// ── resendVerificationOTP ─────────────────────────────────────
// إعادة إرسال رمز OTP للتحقق من الحساب
// يُستخدم في: RegisterPage → زر "إعادة إرسال الرمز"
export async function resendVerificationOTP(email: string) {
  const { error } = await supabase.auth.resend({ type: 'signup', email })
  if (error) throw error
}

// ── resetPassword ─────────────────────────────────────────────
// طلب إعادة تعيين كلمة المرور → يُرسل OTP للإيميل
// يُستخدم في: LoginPage → نموذج "نسيت كلمة المرور"
export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email)
  if (error) throw error
}

// ── verifyRecoveryOTP ─────────────────────────────────────────
// التحقق من رمز OTP الخاص بإعادة تعيين كلمة المرور
// type='recovery' → يختلف عن signup OTP
// يُستخدم في: LoginPage → المودال الثاني (إدخال الرمز)
export async function verifyRecoveryOTP(email: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'recovery', // نوع OTP: إعادة تعيين كلمة المرور
  })
  if (error) throw error
  return data
}

// ── updateEmail ───────────────────────────────────────────────
// طلب تغيير البريد الإلكتروني (يُرسل تأكيداً للإيميل الجديد)
// يُستخدم في: ProfilePage → تغيير الإيميل
export async function updateEmail(newEmail: string) {
  const { error } = await supabase.auth.updateUser({ email: newEmail })
  if (error) throw error
}

// ── updatePhone ───────────────────────────────────────────────
// حفظ رقم الهاتف في user_metadata (ليس Supabase Phone Auth)
// يُستخدم في: ProfilePage → حقل رقم الهاتف
export async function updatePhone(phone: string) {
  const { error } = await supabase.auth.updateUser({ data: { phone_number: phone } })
  if (error) throw error
}

// ── uploadIDDocument ──────────────────────────────────────────
// رفع وثيقة هوية للمستخدم → bucket: id-documents
// يُحدّث user_metadata: id_verified=true
// ملاحظة: هذه الوظيفة القديمة — استخدم submitKYC بدلاً منها
// يُستخدم في: غير مستخدمة حالياً (submitKYC أشمل)
export async function uploadIDDocument(file: File, userId: string): Promise<void> {
  const ext  = file.name.split('.').pop() ?? 'jpg'
  const path = `${userId}/id.${ext}` // مسار الملف في bucket id-documents

  const { error: uploadError } = await supabase.storage
    .from('id-documents')
    .upload(path, file, { upsert: true, contentType: file.type })
  if (uploadError) throw uploadError

  const { error: updateError } = await supabase.auth.updateUser({
    data: { id_verified: true, id_uploaded_at: new Date().toISOString() },
  })
  if (updateError) throw updateError
}

// ════════════════════════════════════════════════════════════════
// SECTION: KYC — التحقق من الهوية (Know Your Customer)
// للتعديل: ابحث عن KYC
// ════════════════════════════════════════════════════════════════

// ── submitKYC ─────────────────────────────────────────────────
// يرفع صورة الهوية الوطنية لـ Storage ثم يحدّث جدول profiles
// الخطوات:
// 1. رفع الملف → id-documents/{userId}/id-kyc.{ext}
// 2. تحديث profiles: national_id + id_document_url + kyc_status='pending'
// يُستخدم في: RegisterRightPage → نموذج KYC Gate
export async function submitKYC(nationalId: string, documentFile: File): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('يجب تسجيل الدخول أولاً')

  const ext  = documentFile.name.split('.').pop() ?? 'jpg'
  const path = `${user.id}/id-kyc.${ext}` // مسار فريد لكل مستخدم

  // رفع الملف لـ Storage
  const { error: uploadErr } = await supabase.storage
    .from('id-documents')
    .upload(path, documentFile, { upsert: true, contentType: documentFile.type })
  if (uploadErr) throw uploadErr

  const { data: urlData } = supabase.storage.from('id-documents').getPublicUrl(path) // رابط الملف

  // حفظ بيانات KYC في جدول profiles
  const { error: dbErr } = await supabase
    .from('profiles')
    .update({
      national_id:      nationalId.trim(),    // رقم الهوية الوطنية
      id_document_url:  urlData.publicUrl,    // رابط صورة الوثيقة
      kyc_status:       'pending',            // في انتظار مراجعة الأدمن
      kyc_submitted_at: new Date().toISOString(),
      kyc_note:         null,                 // يُملأ من الأدمن عند القبول/الرفض
    })
    .eq('auth_user_id', user.id) // تحديث صف المستخدم الحالي فقط
  if (dbErr) throw dbErr
}

// ── getKYCStatus ──────────────────────────────────────────────
// جلب حالة KYC الحالية من جدول profiles
// القيم المحتملة لـ kyc_status: 'none' | 'pending' | 'verified' | 'rejected'
// يُستخدم في: RegisterRightPage → تحديد أي شاشة تُعرض (gate / pending / form)
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
    .eq('auth_user_id', user.id) // جلب صف المستخدم الحالي فقط
    .single()

  return data
}
