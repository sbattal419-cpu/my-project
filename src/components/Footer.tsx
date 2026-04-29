import { Link } from 'react-router-dom'

const ANCHOR_LINKS = [
  { href: '#home',     label: 'الرئيسية' },
  { href: '#services', label: 'الخدمات' },
  { href: '#about',    label: 'عن المؤسسة' },
  { href: '#contact',  label: 'تواصل معنا' },
]

const PAGE_LINKS = [
  { to: '/register-right', label: 'تسجيل الحقوق' },
  { to: '/verify',         label: 'البحث في الحقوق' },
  { to: '/certificates',   label: 'شهاداتي الرقمية' },
]

export default function Footer() {
  return (
    <footer className="footer" id="contact">
      <div className="container">
        <div className="footer-grid">
          {/* Brand */}
          <div>
            <div className="footer-logo">
              <svg width="38" height="38" viewBox="0 0 44 44" fill="none">
                <path d="M22 5L38 12V26C38 35 22 42 22 42C22 42 6 35 6 26V12L22 5Z"
                  fill="rgba(37,99,235,0.35)" stroke="#3b82f6" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M14 22L19.5 28.5L30 16"
                  stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div>
                <div className="footer-logo-name">إدارة الحقوق الملكية</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>والفكرية</div>
              </div>
            </div>
            <p className="footer-brand-desc">
              منصة حكومية رسمية متخصصة في تسجيل وحماية الحقوق الملكية والفكرية،
              تعمل وفق أعلى المعايير القانونية الدولية لضمان حقوقك الإبداعية والتجارية.
            </p>
            <div className="footer-socials">
              {/* Twitter/X */}
              <a href="#" className="footer-social-btn" aria-label="تويتر">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.631 5.905-5.631Zm-1.161 17.52h1.833L7.084 4.126H5.117Z"/>
                </svg>
              </a>
              {/* LinkedIn */}
              <a href="#" className="footer-social-btn" aria-label="لينكدإن">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
              {/* Facebook */}
              <a href="#" className="footer-social-btn" aria-label="فيسبوك">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              {/* YouTube */}
              <a href="#" className="footer-social-btn" aria-label="يوتيوب">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="footer-col-title">روابط سريعة</h4>
            <ul className="footer-link-list">
              {ANCHOR_LINKS.map(l => (
                <li key={l.href}>
                  <a href={l.href} className="footer-link">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6"/>
                    </svg>
                    {l.label}
                  </a>
                </li>
              ))}
              {PAGE_LINKS.map(l => (
                <li key={l.to}>
                  <Link to={l.to} className="footer-link">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6"/>
                    </svg>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="footer-col-title">تواصل معنا</h4>

            <div className="footer-contact-row">
              <span className="footer-contact-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </span>
              <a href="https://maps.google.com/?q=حلب،+سوريا" target="_blank" rel="noopener noreferrer" className="footer-phone">الجمهورية العربية السورية، حلب</a>
            </div>

            <div className="footer-contact-row">
              <span className="footer-contact-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </span>
              <a href="mailto:sarajoud900@gmail.com" className="footer-phone">sarajoud900@gmail.com</a>
            </div>

            <div className="footer-contact-row">
              <span className="footer-contact-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.12 6.12l1.27-.9a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
              </span>
              <a href="tel:+963968806388" className="footer-phone">+963 968 806 388</a>
            </div>

            <div className="footer-contact-row">
              <span className="footer-contact-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.12 6.12l1.27-.9a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
              </span>
              <a href="tel:+963943845372" className="footer-phone">+963 943 845 372</a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="footer-bottom">
          <p className="footer-copy">
            © {new Date().getFullYear()} إدارة الحقوق الملكية والفكرية. جميع الحقوق محفوظة.
          </p>
          <nav className="footer-legal">
            <Link to="/privacy" className="footer-legal-link">سياسة الخصوصية</Link>
            <Link to="/terms" className="footer-legal-link">الشروط والأحكام</Link>
            <Link to="/accessibility" className="footer-legal-link">إمكانية الوصول</Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}
