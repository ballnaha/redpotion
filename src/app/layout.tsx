import type { Metadata } from 'next'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { Box } from '@mui/material'
import theme from './theme/theme'
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
        <script 
          src="https://static.line-scdn.net/liff/edge/2/sdk.js"
          async
        ></script>
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Box 
            sx={{ 
              width: '100%',
              minHeight: '100vh',
              backgroundColor: '#ffffff',
              overflow: 'hidden',
            }}
          >
            {children}
          </Box>
        </ThemeProvider>
      </body>
    </html>
  )
} 