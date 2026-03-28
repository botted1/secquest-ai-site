import { Navbar } from "@/components/navbar"
import { ProcessTimeline } from "@/components/process-timeline"
import { InteractiveDemo } from "@/components/interactive-demo"
import { ArchitectureDiagram } from "@/components/architecture-diagram"
import { TechStack } from "@/components/tech-stack"
import { ImpactSection } from "@/components/impact-section"
import { Footer } from "@/components/footer"

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        <ProcessTimeline />
        <InteractiveDemo />
        <ArchitectureDiagram />
        <TechStack />
        <ImpactSection />
      </div>
      <Footer />
    </main>
  )
}
