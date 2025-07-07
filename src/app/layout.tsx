import type { Metadata } from 'next'
import { Prompt } from 'next/font/google'
import { ThemeRegistry } from './components/ThemeRegistry'
import SessionProvider from './components/SessionProvider'
import { NotificationProvider } from '../contexts/NotificationContext'
import LiffHandler from '../components/LiffHandler'
import DynamicStructuredData from '../components/DynamicStructuredData'
import { getDefaultRestaurant } from '../lib/defaultRestaurant'
import './globals.css'

// Force page to revalidate every 5 minutes (300 seconds)
export const revalidate = 300

// Generate dynamic metadata based on restaurant
export async function generateMetadata(): Promise<Metadata> {
  try {
    const defaultRestaurant = await getDefaultRestaurant();
    
    if (defaultRestaurant) {
      const restaurantName = defaultRestaurant.restaurantName;
      const title = `${restaurantName} - สั่งอาหารออนไลน์`;
      const description = `สั่งอาหารออนไลน์จาก ${restaurantName} ระบบสั่งอาหารที่ทันสมัย รวดเร็ว และปลอดภัย พร้อมจัดส่งถึงบ้าน`;
      
      return {
        title: {
          default: title,
          template: `%s | ${restaurantName}`
        },
        description,
        keywords: [
          restaurantName,
          'สั่งอาหารออนไลน์',
          'ร้านอาหาร',
          'จัดส่งอาหาร',
          'food delivery',
          'online ordering',
          'restaurant',
          'อาหารอร่อย',
          'ส่งถึงบ้าน',
          'food online'
        ],
        authors: [{ name: restaurantName }],
        creator: restaurantName,
        publisher: restaurantName,
        formatDetection: {
          email: false,
          address: false,
          telephone: false,
        },
        metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
        alternates: {
          canonical: '/',
          languages: {
            'th-TH': '/th',
          },
        },
        openGraph: {
          title,
          description,
          url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
          siteName: restaurantName,
          images: [
            {
              url: '/images/default_restaurant1.jpg',
              width: 1200,
              height: 630,
              alt: `${restaurantName} - สั่งอาหารออนไลน์`,
            },
          ],
          locale: 'th_TH',
          type: 'website',
        },
        twitter: {
          card: 'summary_large_image',
          title,
          description,
          images: ['/images/default_restaurant1.jpg'],
          creator: `@${restaurantName.replace(/\s+/g, '').toLowerCase()}`,
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
        category: 'food',
      };
    }
  } catch (error) {
    console.error('Error generating restaurant metadata:', error);
  }

  // Fallback to default metadata
  return {
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
  };
}

// Configure Prompt font with maximum Next.js optimization
const prompt = Prompt({
  weight: ['200', '300', '400', '500'],
  subsets: ['thai', 'latin'],
  display: 'swap',
  preload: true,
  variable: '--font-prompt'
})

// Static metadata is now replaced by generateMetadata function above

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
        <link rel="preconnect" href="https://static.line-scdn.net" />
        
        {/* DNS Prefetch */}
        <link rel="dns-prefetch" href="//www.google-analytics.com" />
        <link rel="dns-prefetch" href="//static.line-scdn.net" />
        
        {/* Preload LIFF SDK for faster loading */}
        <link rel="preload" href="https://static.line-scdn.net/liff/edge/2/sdk.js" as="script" crossOrigin="anonymous" />
        
        <script 
          src="https://static.line-scdn.net/liff/edge/2/sdk.js"
          async
          crossOrigin="anonymous"
        ></script>
        
        {/* Register Service Worker for caching */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js')
                    .then(registration => console.log('✅ SW registered'))
                    .catch(error => console.log('❌ SW registration failed', error));
                });
              }
            `
          }}
        />
        
        {/* Dynamic Structured Data will be added by DynamicStructuredData component */}
      </head>
      <body suppressHydrationWarning className={prompt.className}>
        <SessionProvider>
          <ThemeRegistry>
            <NotificationProvider>
              <LiffHandler />
              <DynamicStructuredData />
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