// ════════════════════════════════════════════════════════════════
// FILE: src/pages/HomePage.tsx
// الصفحة الرئيسية — تجمع كل الأقسام بالترتيب:
//   Navbar → Hero → Services → Statistics → HowItWorks → CTA → Rating → Footer
// لإضافة قسم جديد: استورده وضعه هنا بالترتيب المناسب
// ════════════════════════════════════════════════════════════════
import Navbar from '../components/Navbar'
import HeroSection from '../components/HeroSection'
import ServicesSection from '../components/ServicesSection'
import StatisticsSection from '../components/StatisticsSection'
import HowItWorksSection from '../components/HowItWorksSection'
import CTASection from '../components/CTASection'
import RatingSection from '../components/RatingSection'
import Footer from '../components/Footer'

export default function HomePage() {
  return (
    <>
      <Navbar />
      <HeroSection />
      <ServicesSection />
      <StatisticsSection />
      <HowItWorksSection />
      <CTASection />
      <RatingSection />
      <Footer />
    </>
  )
}
