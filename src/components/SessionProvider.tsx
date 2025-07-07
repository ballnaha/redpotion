'use client'

import { SessionProvider as NextAuthSessionProvider, useSession } from 'next-auth/react'
import { Box, CircularProgress } from '@mui/material'
import { useEffect, useState } from 'react'
import { checkLineSession } from '@/lib/sessionUtils'

interface Props {
  children: React.ReactNode
}

function SessionLoadingWrapper({ children }: Props) {
  const { data: session, status } = useSession()
  const [isSessionRecovering, setIsSessionRecovering] = useState(false)
  const [sessionRecovered, setSessionRecovered] = useState(false)

  // เพิ่ม session recovery เมื่อ NextAuth session ไม่มีแต่อาจมี LINE session
  useEffect(() => {
    const attemptSessionRecovery = async () => {
      // ถ้า NextAuth ยังไม่โหลดเสร็จ หรือมี session แล้ว ไม่ต้อง recover
      if (status === 'loading' || status === 'authenticated' || sessionRecovered) {
        return;
      }

      // ถ้าไม่มี NextAuth session ให้ลอง LINE session recovery
      console.log('🔄 NextAuth session not found, attempting LINE session recovery...');
      setIsSessionRecovering(true);

      try {
        const lineSessionResult = await checkLineSession();
        if (lineSessionResult.authenticated && lineSessionResult.user) {
          console.log('✅ LINE session recovered:', lineSessionResult.user.name);
          setSessionRecovered(true);
          
          // รอสักครู่แล้ว refresh หน้าเพื่อให้ NextAuth อัพเดท
          setTimeout(() => {
            console.log('🔄 Refreshing page to sync sessions...');
            window.location.reload();
          }, 1000);
        } else {
          console.log('❌ LINE session recovery failed');
          setSessionRecovered(false);
        }
      } catch (error) {
        console.error('❌ Session recovery error:', error);
        setSessionRecovered(false);
      } finally {
        setIsSessionRecovering(false);
      }
    };

    // รอ 1 วินาทีก่อนลอง recovery เพื่อให้ NextAuth มีเวลาโหลด
    const recoveryTimeout = setTimeout(attemptSessionRecovery, 1000);

    return () => clearTimeout(recoveryTimeout);
  }, [status, sessionRecovered]);

  // แสดง loading เมื่อ NextAuth กำลังโหลดหรือกำลัง recover session
  if (status === 'loading' || isSessionRecovering) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
        flexDirection="column"
        gap={2}
      >
        <CircularProgress size={40} />
        <Box fontSize="0.9rem" color="text.secondary">
          {isSessionRecovering ? 'กำลังกู้คืน session...' : 'กำลังโหลด...'}
        </Box>
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