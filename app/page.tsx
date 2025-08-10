import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { HeroSection } from "@/components/home/hero-section"
import { FeaturedProducts } from "@/components/home/featured-products"
import { StatsSection } from "@/components/home/stats-section"
import { SubsidiariesSection } from "@/components/home/subsidiaries-section"
import { TestimonialsSection } from "@/components/home/testimonials-section"
import { NewsletterSection } from "@/components/home/newsletter-section"
import { DailyQuoteDisplay } from "@/components/daily-quote-display"

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroSection />
        <FeaturedProducts />
        <StatsSection />
        <SubsidiariesSection />
        <TestimonialsSection />
        <NewsletterSection />
      </main>
      <Footer />
      <DailyQuoteDisplay />
    </div>
  )
}
