import { Link } from 'react-router-dom'

export default function AccessibilityPage() {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <Link to="/" className="bc-back-link" style={{ marginBottom: 32, display: 'inline-flex' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="m9 18 6-6-6-6"/></svg>
          العودة للرئيسية
        </Link>

        <div className="legal-header">
          <h1 className="legal-title">إمكانية الوصول</h1>
          <p className="legal-date">آخر تحديث: أبريل 2026</p>
        </div>

        <div className="legal-body">
          <section className="legal-section">
            <h2>التزامنا</h2>
            <p>نلتزم بجعل منصتنا متاحة للجميع بما في ذلك ذوي الإعاقات، وفق معايير WCAG 2.1.</p>
          </section>

          <section className="legal-section">
            <h2>الميزات المتاحة</h2>
            <ul className="legal-list">
              <li>دعم كامل للغة العربية واتجاه RTL</li>
              <li>تباين ألوان عالٍ لتسهيل القراءة</li>
              <li>التنقل بلوحة المفاتيح في جميع أقسام الموقع</li>
              <li>نصوص بديلة لجميع الصور والأيقونات</li>
              <li>تصميم متجاوب يعمل على جميع الأجهزة</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>الإبلاغ عن مشكلة</h2>
            <p>إذا واجهت أي صعوبة في الوصول إلى أي جزء من الموقع، يرجى التواصل معنا على: sarajoud900@gmail.com</p>
          </section>
        </div>
      </div>
    </div>
  )
}
