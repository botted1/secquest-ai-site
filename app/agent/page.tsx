import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { AgentPageClient } from "./agent-client"

export const metadata = {
  title: "Security Questionnaire Agent | SecQuest AI",
  description: "Upload security questionnaires and get AI-powered answers with confidence scoring using Amazon Bedrock and Claude 3.",
}

export default async function AgentPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <AgentPageClient userName={session.user?.name || "User"} />
      <Footer />
    </main>
  )
}
