import { Link } from 'react-router-dom'

export default function PrivacyPage() {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <Link to="/" className="bc-back-link" style={{ marginBottom: 32, display: 'inline-flex' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="m9 18 6-6-6-6"/></svg>
          العودة للرئيسية
        </Link>

        <div className="legal-header">
          <h1 className="legal-title">سياسة الخصوصية</h1>
          <p className="legal-date">آخر تحديث: أبريل 2026</p>
        </div>

        <div className="legal-body">
          <section className="legal-section">
            <h2>1. المعلومات التي نجمعها</h2>
            <p>نجمع المعلومات التي تقدمها مباشرة عند إنشاء حساب أو تسجيل حق فكري، وتشمل: الاسم الكامل، البريد الإلكتروني، عنوان المحفظة الرقمية، وبيانات الحقوق المسجلة.</p>
          </section>

          <section className="legal-section">
            <h2>2. كيف نستخدم معلوماتك</h2>
            <p>تُستخدم المعلومات المجمعة لأغراض تسجيل وحماية الحقوق الفكرية، والتواصل معك بشأن طلباتك، وتحسين خدماتنا. لا نبيع أو نشارك بياناتك مع أطراف ثالثة.</p>
          </section>

          <section className="legal-section">
            <h2>3. أمان البيانات</h2>
            <p>نستخدم تقنيات تشفير متقدمة وبلوكتشين لضمان سلامة بياناتك. السجلات المسجلة على البلوكتشين دائمة وغير قابلة للتعديل مما يضمن أصالة حقوقك.</p>
          </section>

          <section className="legal-section">
            <h2>4. ملفات تعريف الارتباط</h2>
            <p>نستخدم ملفات تعريف الارتباط لتحسين تجربة المستخدم والحفاظ على جلسة تسجيل الدخول. يمكنك تعطيلها من إعدادات المتصفح.</p>
          </section>

          <section className="legal-section">
            <h2>5. التواصل معنا</h2>
            <p>لأي استفسار حول سياسة الخصوصية، يمكنك التواصل عبر البريد الإلكتروني: sarajoud900@gmail.com</p>
          </section>
        </div>
      </div>
    </div>
  )
}
