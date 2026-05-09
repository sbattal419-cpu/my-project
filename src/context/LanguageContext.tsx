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

  // Hero section
  'hero.tag':          { ar: 'منصة رسمية معتمدة', en: 'Official Certified Platform' },
  'hero.title.pre':    { ar: 'ابدأ في',           en: 'Start' },
  'hero.title.accent': { ar: 'حماية حقوقك',       en: 'Protecting Your Rights' },
  'hero.title.post':   { ar: 'اليوم',             en: 'Today' },
  'hero.title':        { ar: 'منصة رقمية لإدارة حقوق الملكية الفكرية', en: 'Digital Platform for Intellectual Property Rights Management' },
  'hero.desc':         { ar: 'انضم إلى آلاف المبدعين والمبتكرين الذين يثقون بمنصتنا لحماية حقوقهم الفكرية والملكية', en: 'Join thousands of creators and innovators who trust our platform to protect their intellectual and property rights' },
  'hero.bullet.1':     { ar: 'تسجيل فوري وآمن',         en: 'Instant & Secure Registration' },
  'hero.bullet.2':     { ar: 'حماية قانونية معتمدة',    en: 'Certified Legal Protection' },
  'hero.bullet.3':     { ar: 'واجهة سهلة الاستخدام',    en: 'Easy-to-Use Interface' },
  'hero.bullet.4':     { ar: 'دعم فني متواصل',          en: 'Continuous Technical Support' },
  'hero.btn.free':     { ar: 'ابدأ الآن مجاناً',        en: 'Get Started Free' },
  'hero.btn.register': { ar: 'تسجيل حق جديد',           en: 'Register New Right' },
  'hero.btn.search':   { ar: 'البحث عن حق',             en: 'Search for a Right' },
  'hero.trust':        { ar: 'موثوق من أكثر من 10,000 مسجل — محمي وفق أعلى معايير الأمان', en: 'Trusted by over 10,000 registrants — Protected by the highest security standards' },
  'hero.float.label':  { ar: 'حق مسجل', en: 'Registered Rights' },

  // Why our platform
  'why.badge':    { ar: 'لماذا منصتنا؟',                                                                             en: 'Why Our Platform?' },
  'why.title':    { ar: 'المزايا التي تميّزنا',                                                                       en: 'What Sets Us Apart' },
  'why.subtitle': { ar: 'نوفر لك أحدث التقنيات والأدوات لحماية حقوقك الفكرية والملكية بكل سهولة وموثوقية',           en: 'We provide the latest technologies and tools to protect your intellectual property rights with ease and reliability' },
  'why.1.title':  { ar: 'تسجيل سريع وآمن',    en: 'Fast & Secure Registration' },
  'why.1.desc':   { ar: 'سجّل حقوقك بخطوات بسيطة تضمن أمان بياناتك وموثوقية معلوماتك',                             en: 'Register your rights with simple steps that guarantee data security and information reliability' },
  'why.2.title':  { ar: 'حماية متقدمة',        en: 'Advanced Protection' },
  'why.2.desc':   { ar: 'نظام حماية شفاف يضمن أمان حقوقك الرقمية وفق أعلى المعايير الدولية',                        en: 'A transparent protection system that ensures the security of your digital rights to the highest international standards' },
  'why.3.title':  { ar: 'بحث واستعلام',        en: 'Search & Inquiry' },
  'why.3.desc':   { ar: 'ابحث واستعلم عن الحقوق المسجلة بسهولة ودقة عبر نظامنا المتكامل',                           en: 'Search and inquire about registered rights easily and accurately through our integrated system' },
  'why.4.title':  { ar: 'معالجة فورية',        en: 'Instant Processing' },
  'why.4.desc':   { ar: 'تتم معالجة طلباتك بشكل فوري مع إشعارات آنية لمتابعة حالة ملفك',                            en: 'Your requests are processed instantly with real-time notifications to track your file status' },
  'why.5.title':  { ar: 'موثوقية عالية',       en: 'High Reliability' },
  'why.5.desc':   { ar: 'منصة معتمدة رسمياً تعمل على مدار الساعة لخدمتك بأعلى معايير الجودة',                       en: 'An officially certified platform operating around the clock to serve you with the highest quality standards' },
  'why.6.title':  { ar: 'دعم مستمر',           en: 'Continuous Support' },
  'why.6.desc':   { ar: 'فريق دعم متخصص متواجد دائماً لمساعدتك وحل جميع استفساراتك بسرعة',                         en: 'A specialized support team always available to help you and resolve all your inquiries quickly' },

  // Services section
  'svc.badge':    { ar: '✦ خدماتنا', en: '✦ Our Services' },
  'svc.title':    { ar: 'خدمات الحقوق الملكية والفكرية', en: 'Intellectual Property Rights Services' },
  'svc.subtitle': { ar: 'نوفر منظومة متكاملة من الخدمات القانونية لحماية جميع أنواع الحقوق الفكرية بمعايير دولية عالية الجودة.', en: 'We provide a comprehensive system of legal services to protect all types of intellectual property rights with high international quality standards.' },
  'svc.1.title':  { ar: 'تسجيل حقوق النشر',        en: 'Copyright Registration' },
  'svc.1.desc':   { ar: 'حماية أعمالك الإبداعية والأدبية والفنية من خلال إجراءات تسجيل رسمية معتمدة.', en: 'Protect your creative, literary, and artistic works through officially accredited registration procedures.' },
  'svc.2.title':  { ar: 'تسجيل العلامات التجارية',  en: 'Trademark Registration' },
  'svc.2.desc':   { ar: 'تأمين هوية علامتك التجارية وتمييزها قانونياً في الأسواق المحلية والدولية.', en: 'Secure your brand identity and legally distinguish it in local and international markets.' },
  'svc.3.title':  { ar: 'تسجيل براءات الاختراع',    en: 'Patent Registration' },
  'svc.3.desc':   { ar: 'حماية اختراعاتك وابتكاراتك التقنية وضمان حقوق الاستغلال الحصري لمدة قانونية.', en: 'Protect your inventions and technical innovations and ensure exclusive exploitation rights for a legal period.' },
  'svc.4.title':  { ar: 'الاستشارات القانونية',      en: 'Legal Consultations' },
  'svc.4.desc':   { ar: 'خبراء قانونيون متخصصون في الملكية الفكرية يقدمون المشورة والدعم اللازمين لحماية حقوقك.', en: 'Specialized legal experts in intellectual property providing the advice and support needed to protect your rights.' },

  // How it works
  'how.badge':    { ar: '✦ كيف يعمل النظام', en: '✦ How It Works' },
  'how.title':    { ar: 'خطوات تسجيل حقوقك', en: 'Steps to Register Your Rights' },
  'how.subtitle': { ar: 'إجراءات واضحة ومبسطة تضمن حصولك على حماية حقوقك الفكرية بأسرع وقت ممكن وبأعلى معايير الدقة والاحترافية.', en: 'Clear and simplified procedures that ensure you get your intellectual property rights protected as quickly as possible with the highest standards of accuracy and professionalism.' },
  'how.step':     { ar: 'خطوة', en: 'Step' },
  'how.1.title':  { ar: 'إنشاء حساب',    en: 'Create Account' },
  'how.1.desc':   { ar: 'سجّل حسابك في المنصة بخطوات بسيطة وآمنة باستخدام بياناتك الشخصية أو الرسمية.', en: 'Register your account on the platform with simple and secure steps using your personal or official details.' },
  'how.2.title':  { ar: 'رفع الوثائق',   en: 'Upload Documents' },
  'how.2.desc':   { ar: 'أرفق جميع المستندات والملفات المطلوبة بصيغ آمنة وموثوقة عبر نظامنا الإلكتروني.', en: 'Attach all required documents and files in secure and reliable formats through our electronic system.' },
  'how.3.title':  { ar: 'مراجعة الطلب',  en: 'Review Application' },
  'how.3.desc':   { ar: 'يقوم فريق متخصص من الخبراء القانونيين بمراجعة طلبك والتحقق من استيفاء جميع المتطلبات.', en: 'A specialized team of legal experts reviews your application and verifies that all requirements are met.' },
  'how.4.title':  { ar: 'إصدار الشهادة', en: 'Issue Certificate' },
  'how.4.desc':   { ar: 'استلم شهادتك الرسمية المعتمدة إلكترونياً التي تثبت حقوقك الفكرية بشكل قانوني ومعترف به.', en: 'Receive your officially certified digital certificate that legally proves your intellectual property rights.' },

  // CTA section
  'cta.badge':  { ar: 'ابدأ الحماية الآن',               en: 'Start Protection Now' },
  'cta.title':  { ar: 'ابدأ الآن بحماية حقوقك الفكرية', en: 'Start Protecting Your Intellectual Rights Now' },
  'cta.desc':   { ar: 'لا تتأخر في تأمين إبداعاتك وابتكاراتك. منصتنا تجعل تسجيل الحقوق الفكرية أمراً سهلاً وسريعاً وموثوقاً بالكامل.', en: "Don't delay in securing your creations and innovations. Our platform makes registering intellectual property rights easy, fast, and fully reliable." },
  'cta.btn':    { ar: 'سجّل حقوقك الآن',                en: 'Register Your Rights Now' },

  // Statistics section
  'stats.badge':    { ar: 'بالأرقام',                     en: 'In Numbers' },
  'stats.title':    { ar: 'إنجازاتنا تتحدث عنا',         en: 'Our Achievements Speak for Themselves' },
  'stats.subtitle': { ar: 'أرقام حقيقية تعكس ثقة عملائنا ومستوى خدماتنا المتميزة على مدار سنوات من العطاء.', en: "Real numbers reflecting our clients' trust and the level of our distinguished services over years of dedication." },
  'stats.rights':   { ar: 'حق مسجل',    en: 'Registered Rights' },
  'stats.users':    { ar: 'مستخدم نشط', en: 'Active Users' },
  'stats.years':    { ar: 'سنة خبرة',   en: 'Years of Experience' },

  // Footer
  'footer.brand.desc':    { ar: 'منصة حكومية رسمية متخصصة في تسجيل وحماية الحقوق الملكية والفكرية، تعمل وفق أعلى المعايير القانونية الدولية لضمان حقوقك الإبداعية والتجارية.', en: 'An official government platform specializing in the registration and protection of intellectual property rights, operating according to the highest international legal standards.' },
  'footer.quick':         { ar: 'روابط سريعة',      en: 'Quick Links' },
  'footer.contact.title': { ar: 'تواصل معنا',       en: 'Contact Us' },
  'footer.home':          { ar: 'الرئيسية',         en: 'Home' },
  'footer.services.link': { ar: 'الخدمات',          en: 'Services' },
  'footer.about.link':    { ar: 'عن المؤسسة',       en: 'About' },
  'footer.contact.link':  { ar: 'تواصل معنا',       en: 'Contact Us' },
  'footer.register.link': { ar: 'تسجيل الحقوق',    en: 'Register Rights' },
  'footer.search.link':   { ar: 'البحث في الحقوق', en: 'Search Rights' },
  'footer.mycerts.link':  { ar: 'شهاداتي الرقمية', en: 'My Digital Certificates' },
  'footer.copy':          { ar: 'إدارة الحقوق الملكية والفكرية. جميع الحقوق محفوظة.', en: 'Intellectual Property Rights Management. All rights reserved.' },
  'footer.privacy':       { ar: 'سياسة الخصوصية',  en: 'Privacy Policy' },
  'footer.terms':         { ar: 'الشروط والأحكام',  en: 'Terms & Conditions' },
  'footer.accessibility': { ar: 'إمكانية الوصول',  en: 'Accessibility' },
  'footer.address':       { ar: 'الجمهورية العربية السورية، حلب', en: 'Aleppo, Syrian Arab Republic' },

  // Auth shared
  'auth.back':         { ar: 'العودة للرئيسية',   en: 'Back to Home' },
  'auth.brand.name':   { ar: 'إدارة الحقوق الملكية', en: 'Intellectual Property' },
  'auth.brand.sub':    { ar: 'والفكرية',           en: 'Rights Management' },

  // Login page
  'login.title':       { ar: 'تسجيل الدخول',      en: 'Sign In' },
  'login.subtitle':    { ar: 'أهلاً بعودتك، يرجى إدخال بيانات حسابك', en: 'Welcome back, please enter your account details' },
  'login.email':       { ar: 'البريد الإلكتروني', en: 'Email' },
  'login.password':    { ar: 'كلمة المرور',        en: 'Password' },
  'login.forgot':      { ar: 'نسيت كلمة المرور؟', en: 'Forgot password?' },
  'login.btn':         { ar: 'دخول',               en: 'Sign In' },
  'login.btn.loading': { ar: 'جارٍ الدخول...',     en: 'Signing in...' },
  'login.no.account':  { ar: 'ليس لديك حساب؟',    en: "Don't have an account?" },
  'login.signup.link': { ar: 'إنشاء حساب جديد',   en: 'Create new account' },
  'reset.title':       { ar: 'استعادة كلمة المرور', en: 'Reset Password' },
  'reset.desc':        { ar: 'أدخل بريدك الإلكتروني وسنرسل لك رابط لإعادة تعيين كلمة المرور', en: 'Enter your email and we will send you a password reset link' },
  'reset.btn':         { ar: 'إرسال رابط الاستعادة', en: 'Send Reset Link' },
  'reset.btn.loading': { ar: 'جاري الإرسال...',    en: 'Sending...' },
  'reset.done.msg':    { ar: 'تم إرسال رابط الاستعادة إلى بريدك الإلكتروني', en: 'A reset link has been sent to your email' },
  'reset.done.sub':    { ar: 'تحقق من صندوق الوارد أو Spam', en: 'Check your inbox or Spam folder' },
  'reset.err':         { ar: 'حدث خطأ، تأكد من البريد الإلكتروني وحاول مجدداً', en: 'An error occurred, check your email and try again' },

  // Register page
  'register.title':       { ar: 'إنشاء حساب جديد',  en: 'Create New Account' },
  'register.subtitle':    { ar: 'أنشئ حسابك وابدأ في حماية حقوقك الفكرية', en: 'Create your account and start protecting your intellectual rights' },
  'register.name':        { ar: 'الاسم الكامل',      en: 'Full Name' },
  'register.email':       { ar: 'البريد الإلكتروني', en: 'Email' },
  'register.password':    { ar: 'كلمة المرور',        en: 'Password' },
  'register.confirm':     { ar: 'تأكيد كلمة المرور', en: 'Confirm Password' },
  'register.btn':         { ar: 'إنشاء الحساب',       en: 'Create Account' },
  'register.btn.loading': { ar: 'جارٍ الإنشاء...',   en: 'Creating...' },
  'register.has.account': { ar: 'لديك حساب بالفعل؟', en: 'Already have an account?' },
  'register.login.link':  { ar: 'تسجيل الدخول',      en: 'Sign In' },
  'register.success':     { ar: 'تم إنشاء حسابك بنجاح!', en: 'Account created successfully!' },
  'register.check.inbox': { ar: 'راجع صندوق الوارد وانقر على رابط التأكيد لتفعيل حسابك', en: 'Check your inbox and click the confirmation link to activate your account' },
  'register.goto.login':  { ar: 'الذهاب لتسجيل الدخول', en: 'Go to Sign In' },

  // Public Registry Page
  'pub.page.title':    { ar: 'السجل العام للحقوق الفكرية',                              en: 'Public IP Rights Registry' },
  'pub.page.desc':     { ar: 'استعرض جميع الحقوق الفكرية المسجلة رسمياً على المنصة',    en: 'Browse all officially registered intellectual property rights on the platform' },
  'pub.search.ph':     { ar: 'ابحث بالعنوان أو اسم صاحب الحق...',                       en: 'Search by title or holder name...' },
  'pub.filter.all':    { ar: 'الكل',                                                     en: 'All' },
  'pub.total':         { ar: 'حق مسجل',                                                 en: 'registered rights' },
  'pub.empty.title':   { ar: 'لا توجد نتائج',                                           en: 'No Results' },
  'pub.empty.desc':    { ar: 'لم يتم العثور على حقوق تطابق بحثك',                       en: 'No rights found matching your search' },
  'pub.cert':          { ar: 'شهادة',                                                    en: 'Cert' },
  'pub.holder':        { ar: 'صاحب الحق',                                               en: 'Holder' },
  'pub.rating.title':  { ar: 'قيّم المنصة',                                             en: 'Rate the Platform' },
  'pub.rating.desc':   { ar: 'ساعدنا في تحسين خدماتنا بتقييمك الصادق',                 en: 'Help us improve our services with your honest rating' },
  'pub.rating.avg':    { ar: 'متوسط التقييم',                                           en: 'Average Rating' },
  'pub.rating.from':   { ar: 'من 5',                                                    en: 'out of 5' },
  'pub.rating.count':  { ar: 'تقييم',                                                   en: 'ratings' },
  'pub.rating.login':  { ar: 'سجّل دخولك لتقييم المنصة',                               en: 'Sign in to rate the platform' },
  'pub.rating.yours':  { ar: 'تقييمك',                                                  en: 'Your rating' },
  'pub.rating.submit': { ar: 'إرسال التقييم',                                           en: 'Submit Rating' },
  'pub.rating.change': { ar: 'تغيير',                                                   en: 'Change' },
  'pub.rating.done':   { ar: 'شكراً على تقييمك!',                                      en: 'Thank you for your rating!' },
  'pub.rating.pick':   { ar: 'اختر تقييمك',                                            en: 'Pick your rating' },
  'nav.registry':      { ar: 'السجل العام',                                             en: 'Public Registry' },

  // IP Types
  'ipt.0': { ar: 'حقوق النشر',        en: 'Copyright' },
  'ipt.1': { ar: 'العلامات التجارية', en: 'Trademark' },
  'ipt.2': { ar: 'براءات الاختراع',   en: 'Patent' },
  'ipt.3': { ar: 'استشارة قانونية',   en: 'Legal Consultation' },

  // Shared page chrome
  'pg.back':  { ar: 'الرئيسية',             en: 'Home' },
  'pg.brand': { ar: 'إدارة الحقوق الملكية', en: 'IP Rights Management' },

  // VerifyPage
  'vfy.page.title':  { ar: 'التحقق من الحقوق',                               en: 'Verify Rights' },
  'vfy.page.desc':   { ar: 'تحقق من صحة أي حق فكري مسجل على البلوكتشين',    en: 'Verify any registered intellectual property right on the blockchain' },
  'vfy.tab.id':      { ar: 'بحث برقم الشهادة',                               en: 'Search by Certificate ID' },
  'vfy.tab.hash':    { ar: 'بحث بهاش الوثيقة',                               en: 'Search by Document Hash' },
  'vfy.ph.id':       { ar: 'أدخل رقم الشهادة (مثال: 1)',                     en: 'Enter certificate number (e.g. 1)' },
  'vfy.ph.hash':     { ar: 'أدخل هاش الوثيقة (0x...)',                       en: 'Enter document hash (0x...)' },
  'vfy.search':      { ar: 'بحث',                                             en: 'Search' },
  'vfy.searching':   { ar: 'بحث...',                                          en: 'Searching...' },
  'vfy.valid':       { ar: 'صالحة',                                           en: 'Valid' },
  'vfy.revoked':     { ar: 'ملغاة',                                           en: 'Revoked' },
  'vfy.f.cert.id':   { ar: 'رقم الشهادة',                                    en: 'Certificate No.' },
  'vfy.f.holder':    { ar: 'صاحب الحق',                                       en: 'Right Holder' },
  'vfy.f.bc.owner':  { ar: 'المالك على البلوكتشين',                           en: 'Blockchain Owner' },
  'vfy.f.reg.date':  { ar: 'تاريخ التسجيل',                                   en: 'Registration Date' },
  'vfy.f.desc':      { ar: 'الوصف',                                           en: 'Description' },
  'vfy.f.doc.hash':  { ar: 'هاش الوثيقة',                                    en: 'Document Hash' },
  'vfy.etherscan':   { ar: 'عرض على Etherscan',                               en: 'View on Etherscan' },
  'vfy.link.reg':    { ar: 'تسجيل حق جديد',                                  en: 'Register New Right' },
  'vfy.link.certs':  { ar: 'شهاداتي الرقمية',                                 en: 'My Certificates' },
  'vfy.err.no.id':   { ar: 'لا توجد شهادة بهذا الرقم',                       en: 'No certificate found with this ID' },
  'vfy.err.no.hash': { ar: 'لم يتم العثور على شهادة مسجلة بهذا الهاش',      en: 'No registered certificate found with this hash' },
  'vfy.err.fail':    { ar: 'فشل التحقق. تأكد من صحة القيمة المدخلة.',        en: 'Verification failed. Check the entered value.' },

  // RegisterRightPage
  'rr.step1':           { ar: 'بيانات الحق',                         en: 'Right Data' },
  'rr.step2':           { ar: 'تأكيد ودفع',                          en: 'Confirm & Pay' },
  'rr.step3':           { ar: 'الشهادة',                             en: 'Certificate' },
  'rr.form.title':      { ar: 'تسجيل حق فكري جديد',                 en: 'Register New Intellectual Right' },
  'rr.form.desc':       { ar: 'أدخل بيانات الحق لتسجيله على البلوكتشين بشكل دائم وآمن', en: 'Enter right details to register it permanently and securely on the blockchain' },
  'rr.ip.type':         { ar: 'نوع الحق الفكري',                    en: 'IP Type' },
  'rr.f.title':         { ar: 'عنوان الحق',                         en: 'Right Title' },
  'rr.ph.title':        { ar: 'مثال: رواية "الطريق الطويل"',        en: 'e.g. "The Long Road" novel' },
  'rr.f.holder':        { ar: 'اسم صاحب الحق',                      en: 'Right Holder Name' },
  'rr.ph.holder':       { ar: 'الاسم الكامل لصاحب الحق',            en: 'Full name of the right holder' },
  'rr.f.desc':          { ar: 'وصف الحق',                           en: 'Right Description' },
  'rr.optional':        { ar: '(اختياري)',                           en: '(optional)' },
  'rr.ph.desc':         { ar: 'وصف مختصر للحق الفكري وتفاصيله...', en: 'Brief description of the right and its details...' },
  'rr.file.label':      { ar: 'الملف المراد حمايته',                en: 'File to Protect' },
  'rr.file.opt':        { ar: '(اختياري — صورة، PDF، ...)',         en: '(optional — image, PDF, ...)' },
  'rr.file.hint':       { ar: 'اضغط لاختيار ملف أو اسحبه هنا',    en: 'Click to choose a file or drag it here' },
  'rr.file.max':        { ar: 'الحد الأقصى 50 ميغابايت',            en: 'Maximum 50 MB' },
  'rr.file.hashing':    { ar: 'جاري حساب الهاش...',                en: 'Computing hash...' },
  'rr.file.toobig':     { ar: 'حجم الملف يجب أن يكون أقل من 50 ميغابايت', en: 'File size must be less than 50 MB' },
  'rr.next':            { ar: 'التالي: مراجعة وتأكيد',              en: 'Next: Review & Confirm' },
  'rr.confirm.title':   { ar: 'مراجعة وتأكيد',                      en: 'Review & Confirm' },
  'rr.confirm.desc':    { ar: 'تحقق من البيانات وربط محفظتك قبل الإرسال إلى البلوكتشين', en: 'Verify data and connect your wallet before sending to the blockchain' },
  'rr.wallet.status':   { ar: 'حالة المحفظة',                       en: 'Wallet Status' },
  'rr.summary':         { ar: 'ملخص بيانات الحق',                  en: 'Right Data Summary' },
  'rr.rf.type':         { ar: 'النوع',                              en: 'Type' },
  'rr.rf.title':        { ar: 'العنوان',                            en: 'Title' },
  'rr.rf.holder':       { ar: 'صاحب الحق',                          en: 'Right Holder' },
  'rr.rf.desc':         { ar: 'الوصف',                              en: 'Description' },
  'rr.rf.file':         { ar: 'الملف',                              en: 'File' },
  'rr.rf.hash':         { ar: 'هاش الملف',                          en: 'File Hash' },
  'rr.gas.note':        { ar: 'ستُرسل معاملة إلى Sepolia Testnet. تأكد من توفر ETH تجريبي لرسوم الغاز.', en: 'A transaction will be sent to Sepolia Testnet. Ensure you have test ETH for gas fees.' },
  'rr.prev':            { ar: 'السابق',                              en: 'Previous' },
  'rr.processing':      { ar: 'جاري التسجيل...',                   en: 'Registering...' },
  'rr.submit':          { ar: 'تسجيل الآن',                         en: 'Register Now' },
  'rr.success.title':   { ar: 'تم التسجيل بنجاح!',                 en: 'Registered Successfully!' },
  'rr.success.desc':    { ar: 'تم تسجيل حقك الفكري على البلوكتشين بشكل دائم وثابت', en: 'Your intellectual right has been permanently registered on the blockchain' },
  'rr.result.cert.id':  { ar: 'رقم الشهادة',                        en: 'Certificate Number' },
  'rr.result.tx':       { ar: 'معرف المعاملة (TxHash)',              en: 'Transaction ID (TxHash)' },
  'rr.result.hash':     { ar: 'هاش الوثيقة',                        en: 'Document Hash' },
  'rr.result.block':    { ar: 'رقم الكتلة',                         en: 'Block Number' },
  'rr.view.certs':      { ar: 'عرض شهاداتي',                        en: 'View My Certificates' },
  'rr.verify.cert':     { ar: 'التحقق من شهادة',                   en: 'Verify Certificate' },
  'rr.err.rejected':    { ar: 'تم رفض المعاملة من المحفظة',         en: 'Transaction rejected by wallet' },
  'rr.err.duplicate':   { ar: 'هذا الملف مسجل مسبقاً على البلوكتشين. استخدم ملفاً مختلفاً.', en: 'This file is already registered on the blockchain. Use a different file.' },
  'rr.err.failed':      { ar: 'فشل التسجيل. تأكد من توفر ETH تجريبي كافٍ ثم حاول مجدداً.', en: 'Registration failed. Ensure you have enough test ETH and try again.' },

  // CertificatesPage
  'my.page.title':       { ar: 'شهاداتي الرقمية',                                            en: 'My Digital Certificates' },
  'my.page.desc':        { ar: 'شهاداتك الفكرية المسجلة على بلوكتشين Sepolia',              en: 'Your intellectual certificates registered on Sepolia blockchain' },
  'my.wallet.req':       { ar: 'ربط المحفظة مطلوب',                                          en: 'Wallet Connection Required' },
  'my.wallet.desc':      { ar: 'اربط محفظتك على شبكة Sepolia لعرض شهاداتك الرقمية',        en: 'Connect your Sepolia wallet to view your digital certificates' },
  'my.loading':          { ar: 'جاري تحميل الشهادات من البلوكتشين...',                       en: 'Loading certificates from the blockchain...' },
  'my.empty.title':      { ar: 'لا توجد شهادات بعد',                                         en: 'No Certificates Yet' },
  'my.empty.desc':       { ar: 'لم تقم بتسجيل أي حقوق فكرية من هذه المحفظة حتى الآن',      en: 'You have not registered any intellectual rights from this wallet yet' },
  'my.cert.registered':  { ar: 'شهادة مسجلة',                                                en: 'certificates registered' },
  'my.refresh':          { ar: 'تحديث',                                                       en: 'Refresh' },
  'my.doc.hash':         { ar: 'هاش الوثيقة',                                                en: 'Document Hash' },
  'my.valid':            { ar: '● صالحة',                                                    en: '● Valid' },
  'my.revoked':          { ar: '● ملغاة',                                                    en: '● Revoked' },
  'my.transfer.btn':     { ar: 'تحويل الملكية',                                              en: 'Transfer Ownership' },
  'my.modal.title':      { ar: 'تحويل ملكية الشهادة',                                        en: 'Transfer Certificate Ownership' },
  'my.modal.desc':       { ar: 'أدخل عنوان المحفظة الجديد لتحويل ملكية هذه الشهادة. هذا الإجراء لا يمكن التراجع عنه.', en: 'Enter the new wallet address to transfer ownership. This action cannot be undone.' },
  'my.wallet.recipient': { ar: 'عنوان المحفظة المستقبِلة',                                   en: 'Recipient Wallet Address' },
  'my.modal.warn':       { ar: 'بعد التحويل لن تظهر هذه الشهادة في قائمتك',                en: 'After transfer, this certificate will no longer appear in your list' },
  'my.transferring':     { ar: 'جاري التحويل...',                                            en: 'Transferring...' },
  'my.confirm.transfer': { ar: 'تأكيد التحويل',                                              en: 'Confirm Transfer' },
  'my.success.transfer': { ar: 'تم تحويل الشهادة بنجاح!',                                   en: 'Certificate transferred successfully!' },
  'my.err.rejected':     { ar: 'تم رفض المعاملة من المحفظة',                                en: 'Transaction rejected by wallet' },
  'my.err.failed':       { ar: 'فشل التحويل. تأكد من صحة العنوان وتوفر ETH تجريبي.',        en: 'Transfer failed. Check the address and ensure you have test ETH.' },
  'my.err.load':         { ar: 'فشل تحميل الشهادات',                                         en: 'Failed to load certificates' },

  // Profile - email & phone
  'pro.email.change':    { ar: 'تغيير الإيميل',                   en: 'Change Email' },
  'pro.email.new':       { ar: 'الإيميل الجديد',                   en: 'New Email' },
  'pro.email.send':      { ar: 'إرسال رابط التحقق',               en: 'Send Verification Link' },
  'pro.email.sent':      { ar: 'تم إرسال رابط التحقق إلى إيميلك الجديد، تحقق من صندوق الوارد', en: 'Verification link sent to your new email, check your inbox' },
  'pro.email.cancel':    { ar: 'إلغاء',                            en: 'Cancel' },
  'pro.phone':           { ar: 'رقم الهاتف',                       en: 'Phone Number' },
  'pro.phone.placeholder': { ar: '+963xxxxxxxxx',                  en: '+1xxxxxxxxxx' },
  'pro.phone.send':      { ar: 'إرسال رمز التحقق',                en: 'Send OTP' },
  'pro.phone.otp':       { ar: 'رمز التحقق (OTP)',                 en: 'Verification Code (OTP)' },
  'pro.phone.verify':    { ar: 'تحقق',                             en: 'Verify' },
  'pro.phone.done':      { ar: 'تم التحقق من رقم الهاتف بنجاح ✓', en: 'Phone number verified successfully ✓' },
  'pro.phone.sending':   { ar: 'جارٍ الإرسال...',                  en: 'Sending...' },
  'pro.phone.verifying': { ar: 'جارٍ التحقق...',                   en: 'Verifying...' },

  // Settings modal
  'set.title':    { ar: 'الإعدادات',            en: 'Settings' },
  'set.profile':  { ar: 'معلومات الحساب',       en: 'Account Info' },
  'set.password': { ar: 'تغيير كلمة المرور',    en: 'Change Password' },
  'set.language': { ar: 'اللغة',                en: 'Language' },
  'set.transfer': { ar: 'نقل الملكية',          en: 'Transfer Ownership' },
  'set.photo':    { ar: 'تغيير الصورة',         en: 'Change Photo' },
  'pro.name':     { ar: 'الاسم الكامل',         en: 'Full Name' },
  'pro.email':    { ar: 'البريد الإلكتروني',    en: 'Email' },
  'pro.save':     { ar: 'حفظ التغييرات',        en: 'Save Changes' },
  'pro.saved':    { ar: 'تم الحفظ ✓',           en: 'Saved ✓' },
  'pwd.new':      { ar: 'كلمة المرور الجديدة',  en: 'New Password' },
  'pwd.confirm':  { ar: 'تأكيد كلمة المرور',    en: 'Confirm Password' },
  'pwd.save':     { ar: 'تغيير كلمة المرور',    en: 'Change Password' },
  'pwd.min':      { ar: 'يجب أن تكون 8 أحرف على الأقل', en: 'Must be at least 8 characters' },
  'pwd.mismatch': { ar: 'كلمتا المرور غير متطابقتين',   en: 'Passwords do not match' },
  'pwd.done':     { ar: 'تم تغيير كلمة المرور بنجاح',   en: 'Password changed successfully' },
  'lang.current': { ar: 'اللغة الحالية',        en: 'Current Language' },
  'lang.arabic':  { ar: 'العربية',              en: 'Arabic (العربية)' },
  'lang.english': { ar: 'الإنجليزية',           en: 'English' },
  'tr.select':    { ar: 'اختر الحق المراد نقله', en: 'Select the right to transfer' },
  'tr.wallet':    { ar: 'عنوان المحفظة الجديدة', en: 'New Wallet Address' },
  'tr.btn':       { ar: 'نقل الملكية',           en: 'Transfer Ownership' },
  'tr.confirm':   { ar: 'تأكيد النقل',           en: 'Confirm Transfer' },
  'tr.done':      { ar: 'تم نقل الملكية بنجاح',  en: 'Ownership transferred successfully' },
  'tr.none':      { ar: 'لا توجد حقوق مسجلة',   en: 'No registered rights found' },
  'cancel':       { ar: 'إلغاء',                 en: 'Cancel' },
  'error':        { ar: 'حدث خطأ، حاول مجدداً', en: 'An error occurred, please try again' },
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
