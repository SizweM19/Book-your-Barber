import type { Metadata, Viewport } from 'next'
import '@/index.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'Fade & Edge Barbershop | Book Your Barber',
  description: 'Book your fresh cut, beard trim, or grooming appointment online with Fade & Edge Barbershop.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
