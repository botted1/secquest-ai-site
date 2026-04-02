import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/components/auth-provider'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ['latin'],
  variable: '--font-jetbrains',
})

export const metadata: Metadata = {
  title: 'Security Questionnaire Agent | AWS Hackathon 2026',
  description: 'AI-powered security questionnaire automation. Transform 40 hours of manual work into 4 minutes with Amazon Bedrock and intelligent RAG.',
  keywords: ['security questionnaire', 'AI automation', 'Amazon Bedrock', 'enterprise security', 'compliance automation'],
  authors: [{ name: 'SecQuest AI Team' }],
  openGraph: {
    title: 'Security Questionnaire Agent | AWS Hackathon 2026',
    description: 'AI-powered security questionnaire automation. From 40 hours to 4 minutes.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Security Questionnaire Agent | AWS Hackathon 2026',
    description: 'AI-powered security questionnaire automation. From 40 hours to 4 minutes.',
  },
}

export const viewport: Viewport = {
  themeColor: '#0a1628',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
