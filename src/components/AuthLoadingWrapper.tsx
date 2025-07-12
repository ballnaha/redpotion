'use client';

import { ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { Box, CircularProgress, Typography } from '@mui/material';

interface AuthLoadingWrapperProps {
  children: ReactNode;
  requiredRole?: 'RESTAURANT_OWNER' | 'ADMIN' | 'CUSTOMER';
  loadingText?: string;
  unauthorizedText?: string;
  showSessionStatus?: boolean;
}

export default function AuthLoadingWrapper({ 
  children, 
  requiredRole,
  loadingText = 'กำลังโหลดข้อมูล...',
  unauthorizedText = 'ไม่มีสิทธิ์เข้าใช้งาน',
  showSessionStatus = false
}: AuthLoadingWrapperProps) {
  const { data: session, status } = useSession();

  // แสดง loading ระหว่างรอ session
  if (status === 'loading') {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh',
        gap: 2
      }}>
        <CircularProgress size={60} />
        <Typography variant="body1" sx={{ color: 'text.secondary', textAlign: 'center' }}>
          {loadingText}
        </Typography>
        {showSessionStatus && (
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
            กำลังตรวจสอบสิทธิ์การเข้าใช้งาน...
          </Typography>
        )}
      </Box>
    );
  }

  // ตรวจสอบ authentication ถ้ามีการกำหนด requiredRole
  if (requiredRole) {
    if (!session) {
      return (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '50vh',
          gap: 2
        }}>
          <Typography variant="h6" sx={{ color: 'error.main' }}>
            กรุณาเข้าสู่ระบบ
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            คุณต้องเข้าสู่ระบบเพื่อเข้าใช้งานหน้านี้
          </Typography>
        </Box>
      );
    }

    if (session.user.role !== requiredRole) {
      return (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '50vh',
          gap: 2
        }}>
          <Typography variant="h6" sx={{ color: 'error.main' }}>
            {unauthorizedText}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {requiredRole === 'RESTAURANT_OWNER' && 'คุณต้องเป็นเจ้าของร้านอาหารเพื่อเข้าใช้งานหน้านี้'}
            {requiredRole === 'ADMIN' && 'คุณต้องเป็นผู้ดูแลระบบเพื่อเข้าใช้งานหน้านี้'}
            {requiredRole === 'CUSTOMER' && 'คุณต้องเป็นลูกค้าเพื่อเข้าใช้งานหน้านี้'}
          </Typography>
        </Box>
      );
    }
  }

  return <>{children}</>;
} 