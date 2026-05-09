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
