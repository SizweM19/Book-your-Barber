import type { Metadata } from 'next'
import '../index.css'

export const metadata: Metadata = {
  title: 'Book Your Barber | Customer Booking',
  description: 'Fast, seamless online barber booking and appointment scheduling.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-900 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  )
}
