import type { Metadata } from 'next'
import { DM_Sans, Geist_Mono } from 'next/font/google'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Bagrry — AI meeting notes that close your open loops',
  description:
    'Bagrry captures your meeting context, links citations into verbatim transcripts, and extracts high-value action items automatically without meeting bots.',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${geistMono.variable} scroll-smooth`}>
      <body className="font-sans antialiased text-neutral-900 bg-[#fafaf7] dark:bg-[#161614] dark:text-neutral-100 selection:bg-[#c3dd4f] selection:text-[#1e2604]">
        {children}
      </body>
    </html>
  )
}
