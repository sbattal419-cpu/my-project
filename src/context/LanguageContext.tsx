import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

export type Lang = 'ar' | 'en'

const T: Record<string, Record<Lang, string>> = {
  // Navbar
  'nav.home':         { ar: 'الرئيسية',            en: 'Home' },
  'nav.services':     { ar: 'الخدمات',              en: 'Services' },
  'nav.how':          { ar: 'كيف يعمل',             en: 'How It Works' },
  'nav.register':     { ar: 'تسجيل حق',             en: 'Register Right' },
  'nav.verify':       { ar: 'التحقق',               en: 'Verify' },
  'nav.certificates': { ar: 'شهاداتي',              en: 'My Certificates' },
  'nav.login':        { ar: 'تسجيل الدخول',         en: 'Login' },
  'nav.logout':       { ar: 'تسجيل الخروج',         en: 'Log Out' },
  // Settings modal
  'set.title':        { ar: 'الإعدادات',            en: 'Settings' },
  'set.profile':      { ar: 'معلومات الحساب',       en: 'Account Info' },
  'set.password':     { ar: 'تغيير كلمة المرور',    en: 'Change Password' },
  'set.language':     { ar: 'اللغة',                en: 'Language' },
  'set.transfer':     { ar: 'نقل الملكية',          en: 'Transfer Ownership' },
  'set.photo':        { ar: 'تغيير الصورة',         en: 'Change Photo' },
  // Profile section
  'pro.name':         { ar: 'الاسم الكامل',         en: 'Full Name' },
  'pro.email':        { ar: 'البريد الإلكتروني',    en: 'Email' },
  'pro.save':         { ar: 'حفظ التغييرات',        en: 'Save Changes' },
  'pro.saved':        { ar: 'تم الحفظ ✓',           en: 'Saved ✓' },
  // Password section
  'pwd.new':          { ar: 'كلمة المرور الجديدة',  en: 'New Password' },
  'pwd.confirm':      { ar: 'تأكيد كلمة المرور',    en: 'Confirm Password' },
  'pwd.save':         { ar: 'تغيير كلمة المرور',    en: 'Change Password' },
  'pwd.min':          { ar: 'يجب أن تكون 8 أحرف على الأقل', en: 'Must be at least 8 characters' },
  'pwd.mismatch':     { ar: 'كلمتا المرور غير متطابقتين',   en: 'Passwords do not match' },
  'pwd.done':         { ar: 'تم تغيير كلمة المرور بنجاح',   en: 'Password changed successfully' },
  // Language section
  'lang.current':     { ar: 'اللغة الحالية',        en: 'Current Language' },
  'lang.arabic':      { ar: 'العربية',              en: 'Arabic (العربية)' },
  'lang.english':     { ar: 'الإنجليزية',           en: 'English' },
  // Transfer section
  'tr.select':        { ar: 'اختر الحق المراد نقله', en: 'Select the right to transfer' },
  'tr.wallet':        { ar: 'عنوان المحفظة الجديدة',  en: 'New Wallet Address' },
  'tr.btn':           { ar: 'نقل الملكية',           en: 'Transfer Ownership' },
  'tr.confirm':       { ar: 'تأكيد النقل',           en: 'Confirm Transfer' },
  'tr.done':          { ar: 'تم نقل الملكية بنجاح',  en: 'Ownership transferred successfully' },
  'tr.none':          { ar: 'لا توجد حقوق مسجلة',   en: 'No registered rights found' },
  // Common
  'cancel':           { ar: 'إلغاء',                en: 'Cancel' },
  'error':            { ar: 'حدث خطأ، حاول مجدداً', en: 'An error occurred, please try again' },
}

interface LangCtx {
  lang: Lang
  dir: 'rtl' | 'ltr'
  toggle: () => void
  t: (key: string) => string
}

const LangContext = createContext<LangCtx>({
  lang: 'ar', dir: 'rtl',
  toggle: () => {},
  t: (k) => k,
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem('lang') as Lang) ?? 'ar')

  useEffect(() => {
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr')
    document.documentElement.setAttribute('lang', lang)
    localStorage.setItem('lang', lang)
  }, [lang])

  const toggle = () => setLang(l => l === 'ar' ? 'en' : 'ar')
  const t = (key: string) => T[key]?.[lang] ?? key

  return (
    <LangContext.Provider value={{ lang, dir: lang === 'ar' ? 'rtl' : 'ltr', toggle, t }}>
      {children}
    </LangContext.Provider>
  )
}

export const useLang = () => useContext(LangContext)