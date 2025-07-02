'use client'

import { SessionProvider as NextAuthSessionProvider, useSession } from 'next-auth/react'
import { Box, CircularProgress } from '@mui/material'
import { useEffect, useState } from 'react'

interface Props {
  children: React.ReactNode
}

// Loading Component สำหรับแสดงระหว่างรอ session
function SessionLoadingWrapper({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // ถ้ายังไม่ได้ hydrate ให้แสดง loading
  if (!isClient) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: `
          linear-gradient(135deg, 
            rgba(74, 144, 226, 0.1) 0%, 
            rgba(102, 126, 234, 0.1) 100%
          )
        `,
      }}>
        <CircularProgress size={60} />
      </Box>
    )
  }

  // ถ้า session กำลัง loading ให้แสดง loading
  if (status === 'loading') {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: `
          linear-gradient(135deg, 
            rgba(74, 144, 226, 0.1) 0%, 
            rgba(102, 126, 234, 0.1) 100%
          )
        `,
      }}>
        <CircularProgress size={60} />
      </Box>
    )
  }

  return <>{children}</>
}

export default function SessionProvider({ children }: Props) {
  return (
    <NextAuthSessionProvider 
      refetchOnWindowFocus={false} 
      refetchInterval={0}
      refetchWhenOffline={false}
    >
      <SessionLoadingWrapper>
        {children}
      </SessionLoadingWrapper>
    </NextAuthSessionProvider>
  )
} 