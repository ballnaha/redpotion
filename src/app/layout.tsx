import type { Metadata } from 'next'
import { ThemeRegistry } from './components/ThemeRegistry'
import './globals.css'

export const metadata: Metadata = {
  title: 'The Red Potion - Customer',
  description: 'Food delivery app with liquid glass design',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#ffffff" />
        <link
          href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <script 
          src="https://static.line-scdn.net/liff/edge/2/sdk.js"
          async
        ></script>
      </head>
      <body suppressHydrationWarning style={{ fontFamily: "'Prompt', sans-serif" }}>
        <ThemeRegistry>
          <div 
            style={{ 
              width: '100%',
              minHeight: '100vh',
              backgroundColor: '#ffffff',
              overflow: 'hidden',
            }}
          >
            {children}
          </div>
        </ThemeRegistry>
      </body>
    </html>
  )
} 