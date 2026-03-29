import { Navbar } from "@/components/navbar"
import { HeroSection } from "@/components/hero-section"
import { ProblemSection } from "@/components/problem-section"
import { SolutionTeaser } from "@/components/solution-teaser"
import { Footer } from "@/components/footer"
import { ScrollBackground } from "@/components/scroll-background"

export default function HomePage() {
  return (
    <main className="relative min-h-screen bg-background">
      <ScrollBackground />
      <div className="relative z-10">
        <Navbar />
        <HeroSection />
        <ProblemSection />
        <SolutionTeaser />
        <Footer />
      </div>
    </main>
  )
}
