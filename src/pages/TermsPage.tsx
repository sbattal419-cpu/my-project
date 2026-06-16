import { Link } from 'react-router-dom'

export default function TermsPage() {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <Link to="/" className="bc-back-link" style={{ marginBottom: 32, display: 'inline-flex' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="m9 18 6-6-6-6"/></svg>
          العودة للرئيسية
        </Link>

        <div className="legal-header">
          <h1 className="legal-title">الشروط والأحكام</h1>
          <p className="legal-date">آخر تحديث: أبريل 2026</p>
        </div>

        <div className="legal-body">
          <section className="legal-section">
            <h2>1. القبول بالشروط</h2>
            <p>باستخدامك لمنصة إدارة حقوق الملكية الفكرية، فإنك توافق على الالتزام بهذه الشروط والأحكام. إن كنت لا توافق على أي من هذه الشروط، يرجى التوقف عن استخدام المنصة.</p>
          </section>

          <section className="legal-section">
            <h2>2. الاستخدام المسموح به</h2>
            <p>يُسمح باستخدام المنصة لتسجيل الحقوق الفكرية المشروعة فقط. يُحظر استخدامها لتسجيل حقوق مسروقة أو منتهكة أو مخالفة للقانون.</p>
          </section>

          <section className="legal-section">
            <h2>3. مسؤولية المستخدم</h2>
            <p>أنت مسؤول عن صحة المعلومات التي تقدمها عند تسجيل الحقوق. المنصة لا تتحمل مسؤولية أي نزاعات قانونية ناشئة عن بيانات مغلوطة أو حقوق منتهكة.</p>
          </section>

          <section className="legal-section">
            <h2>4. سجلات البلوكتشين</h2>
            <p>السجلات المنشورة على البلوكتشين دائمة وغير قابلة للحذف. تأكد من صحة جميع البيانات قبل إتمام عملية التسجيل.</p>
          </section>

          <section className="legal-section">
            <h2>5. التعديلات</h2>
            <p>نحتفظ بالحق في تعديل هذه الشروط في أي وقت. سيتم إخطار المستخدمين بأي تغييرات جوهرية عبر البريد الإلكتروني المسجل.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
