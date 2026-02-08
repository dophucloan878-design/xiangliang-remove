import React from "react"
import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import Script from 'next/script'
import './globals.css'

export const metadata: Metadata = {
  title: 'Xiangliang Remove - Free AI Background Remover',
  description: 'Instantly remove image backgrounds with AI. 100% automatic, free, and done in seconds!',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <Script
          src="https://www.paypal.com/sdk/js?client-id=BAALCYuBcFqHt95P16g6btFID8ML9-rTA472U4Xneo83bqz_KpHJsevxQOt5ihzW0ciGy5Hv_ZgK8Him6M&components=hosted-buttons&disable-funding=venmo&currency=USD"
          strategy="afterInteractive"
        />
        {children}
        <Analytics />
      </body>
    </html>
  )
}
