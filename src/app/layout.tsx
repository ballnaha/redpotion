import type { Metadata } from 'next'
import { Prompt } from 'next/font/google'
import { ThemeRegistry } from './components/ThemeRegistry'
import SessionProvider from './components/SessionProvider'
import { NotificationProvider } from '../contexts/NotificationContext'
import './globals.css'

// Force page to revalidate every 5 minutes (300 seconds)
export const revalidate = 300

// Configure Prompt font with maximum Next.js optimization
const prompt = Prompt({
  weight: ['200', '300', '400', '500'],
  subsets: ['thai', 'latin'],
  display: 'swap',
  preload: true,
  variable: '--font-prompt'
})

export const metadata: Metadata = {
  title: {
    default: 'เดอะ เรด โพชั่น - แพลตฟอร์มให้เช่า Web Application สำหรับร้านอาหาร',
    template: '%s | เดอะ เรด โพชั่น'
  },
  description: 'แพลตฟอร์มให้เช่า Web Application สำหรับร้านอาหาร แบบ Multi-Tenant ระบบครบครัน เริ่มใช้งานได้ทันที ทดลองใช้ฟรี 90 วัน รองรับการสั่งอาหารออนไลน์ จัดการเมนู และระบบการส่ง',
  keywords: [
    'ระบบร้านอาหาร',
    'สั่งอาหารออนไลน์', 
    'multi-tenant restaurant',
    'web application เช่า',
    'ระบบจัดการร้านอาหาร',
    'food delivery system',
    'restaurant management',
    'SaaS restaurant',
    'ออเดอร์ออนไลน์',
    'ระบบ POS',
    'ร้านอาหารออนไลน์'
  ],
  authors: [{ name: 'The Red Potion Team' }],
  creator: 'The Red Potion',
  publisher: 'The Red Potion',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://theredpotion.com'),
  alternates: {
    canonical: '/',
    languages: {
      'th-TH': '/th',
    },
  },
  openGraph: {
    title: 'เดอะ เรด โพชั่น - แพลตฟอร์มให้เช่า Web Application สำหรับร้านอาหาร',
    description: 'แพลตฟอร์มให้เช่า Web Application สำหรับร้านอาหาร แบบ Multi-Tenant ระบบครบครัน เริ่มใช้งานได้ทันที ทดลองใช้ฟรี 90 วัน',
    url: 'https://theredpotion.com',
    siteName: 'เดอะ เรด โพชั่น',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'เดอะ เรด โพชั่น - แพลตฟอร์มสำหรับร้านอาหาร',
      },
    ],
    locale: 'th_TH',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'เดอะ เรด โพชั่น - แพลตฟอร์มให้เช่า Web Application สำหรับร้านอาหาร',
    description: 'แพลตฟอร์มให้เช่า Web Application สำหรับร้านอาหาร แบบ Multi-Tenant ระบบครบครัน เริ่มใช้งานได้ทันที',
    images: ['/images/og-image.jpg'],
    creator: '@theredpotion',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  category: 'technology',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th" suppressHydrationWarning className={prompt.variable}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#ffffff" />
        
        {/* Enhanced SEO Meta Tags */}
        <meta name="google-site-verification" content="your-google-verification-code" />
        <meta name="msvalidate.01" content="your-bing-verification-code" />
        
        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://images.unsplash.com" />
        
        {/* DNS Prefetch */}
        <link rel="dns-prefetch" href="//www.google-analytics.com" />
        
        <script 
          src="https://static.line-scdn.net/liff/edge/2/sdk.js"
          async
        ></script>
        
        {/* Structured Data - Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "เดอะ เรด โพชั่น",
              "alternateName": "The Red Potion",
              "url": "https://theredpotion.com",
              "logo": "https://theredpotion.com/images/logo_trim.png",
              "description": "แพลตฟอร์มให้เช่า Web Application สำหรับร้านอาหาร แบบ Multi-Tenant",
              "foundingDate": "2024",
              "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "+66-2-123-4567",
                "contactType": "customer service",
                "areaServed": "TH",
                "availableLanguage": ["Thai", "English"]
              },
              "sameAs": [
                "https://www.facebook.com/theredpotion",
                "https://twitter.com/theredpotion",
                "https://www.instagram.com/theredpotion"
              ]
            })
          }}
        />
        
        {/* Structured Data - Software Application */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "เดอะ เรด โพชั่น Restaurant Management System",
              "operatingSystem": "Web Browser",
              "applicationCategory": "BusinessApplication",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "THB",
                "description": "ทดลองใช้ฟรี 90 วัน"
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.9",
                "ratingCount": "1000",
                "bestRating": "5",
                "worstRating": "1"
              },
              "featureList": [
                "ระบบจัดการเมนู",
                "ระบบสั่งออนไลน์",
                "ระบบการส่ง",
                "รายงานขายดี"
              ]
            })
          }}
        />
      </head>
      <body suppressHydrationWarning className={prompt.className}>
        <SessionProvider>
          <ThemeRegistry>
            <NotificationProvider>
              <div 
                style={{ 
                  width: '100%',
                  minHeight: '100vh',
                  backgroundColor: '#ffffff',
                  overflow: 'hidden'
                }}
              >
                {children}
              </div>
            </NotificationProvider>
          </ThemeRegistry>
        </SessionProvider>
      </body>
    </html>
  )
} 