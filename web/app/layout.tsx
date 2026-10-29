import type { Metadata } from 'next'
import { DM_Sans, Roboto, Geist_Mono } from 'next/font/google'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-roboto',
  display: 'swap',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Bagrry: AI notepad that closes your open loops',
  description:
    'Bagrry captures your personal context and never lets you miss your commitments. Closes open loops automatically without meeting bots.',
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
    <html lang="en" className={`${dmSans.variable} ${roboto.variable} ${geistMono.variable} scroll-smooth`}>
      <body className="font-sans antialiased text-neutral-900 bg-white selection:bg-[#ff8133]/20 selection:text-neutral-900">
        {children}
      </body>
    </html>
  )
}
