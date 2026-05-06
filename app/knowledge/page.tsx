import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { KnowledgeClient } from "./knowledge-client"

export const metadata = {
  title: "Knowledge Base | SecQuest AI",
  description: "Upload security policies to power your AI agent",
}

export default async function KnowledgePage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login?callbackUrl=/knowledge")
  }

  return <KnowledgeClient userName={session.user.name || "Admin"} />
}
