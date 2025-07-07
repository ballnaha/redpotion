'use client';

import React, { useEffect, useState, ReactNode } from 'react';
import { Box, CircularProgress, Typography, Alert, Button } from '@mui/material';
import { authenticateUser, quickAuthCheck, AuthResult } from '@/lib/hybridAuth';
import { getAppConfig } from '@/lib/appConfig';

interface AuthWrapperProps {
  children: ReactNode;
  restaurantId?: string;
  requireAuth?: boolean;
  fallbackComponent?: ReactNode;
  onAuthSuccess?: (user: any) => void;
  onAuthFailure?: (error: string) => void;
}

export default function AuthWrapper({
  children,
  restaurantId,
  requireAuth = true,
  fallbackComponent,
  onAuthSuccess,
  onAuthFailure
}: AuthWrapperProps) {
  const [authState, setAuthState] = useState<{
    loading: boolean;
    authenticated: boolean;
    user?: any;
    error?: string;
    authMethod?: string;
  }>({
    loading: true,
    authenticated: false
  });

  const config = getAppConfig();

  useEffect(() => {
    checkAuthentication();
  }, [restaurantId]);

  const checkAuthentication = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: undefined }));

      if (!requireAuth) {
        // ถ้าไม่บังคับ auth ให้ลองเช็คแต่ไม่บล็อก
        const quickCheck = await quickAuthCheck();
        setAuthState({
          loading: false,
          authenticated: quickCheck.isAuthenticated,
          user: quickCheck.user,
          authMethod: 'session'
        });
        
        if (quickCheck.isAuthenticated && onAuthSuccess) {
          onAuthSuccess(quickCheck.user);
        }
        return;
      }

      // ใช้ระบบ Hybrid Authentication
      const authResult = await authenticateUser({
        restaurantId,
        returnUrl: window.location.pathname + window.location.search
      });

      if (authResult.success && authResult.user) {
        setAuthState({
          loading: false,
          authenticated: true,
          user: authResult.user,
          authMethod: authResult.method
        });

        if (onAuthSuccess) {
          onAuthSuccess(authResult.user);
        }
      } else if (authResult.needsRedirect && authResult.redirectUrl) {
        // Redirect ไป login
        console.log('🔄 Redirecting to:', authResult.redirectUrl);
        window.location.href = authResult.redirectUrl;
      } else {
        setAuthState({
          loading: false,
          authenticated: false,
          error: authResult.error || 'Authentication failed',
          authMethod: authResult.method
        });

        if (onAuthFailure) {
          onAuthFailure(authResult.error || 'Authentication failed');
        }
      }
    } catch (error) {
      console.error('❌ Authentication wrapper error:', error);
      setAuthState({
        loading: false,
        authenticated: false,
        error: error instanceof Error ? error.message : 'Authentication error'
      });

      if (onAuthFailure) {
        onAuthFailure(error instanceof Error ? error.message : 'Authentication error');
      }
    }
  };

  const handleRetry = () => {
    checkAuthentication();
  };

  const handleManualLogin = () => {
    const loginUrl = restaurantId 
      ? `/auth/line-signin?restaurant=${restaurantId}&returnUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`
      : `/auth/line-signin?returnUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`;
    window.location.href = loginUrl;
  };

  // Loading state
  if (authState.loading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="50vh"
        gap={2}
      >
        <CircularProgress size={40} />
        <Typography variant="body2" color="text.secondary">
          กำลังตรวจสอบการเข้าสู่ระบบ...
        </Typography>
        {config.enableDebugLogs && (
          <Typography variant="caption" color="text.secondary">
            Debug: Using {authState.authMethod || 'hybrid'} authentication
          </Typography>
        )}
      </Box>
    );
  }

  // Error state
  if (authState.error && requireAuth) {
    if (fallbackComponent) {
      return <>{fallbackComponent}</>;
    }

    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="50vh"
        gap={2}
        p={3}
      >
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            ไม่สามารถเข้าสู่ระบบได้
          </Typography>
          <Typography variant="body2" gutterBottom>
            {authState.error}
          </Typography>
          {config.enableDebugLogs && (
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Debug: Auth method - {authState.authMethod}
            </Typography>
          )}
        </Alert>

        <Box display="flex" gap={1}>
          <Button variant="outlined" onClick={handleRetry}>
            ลองใหม่
          </Button>
          <Button variant="contained" onClick={handleManualLogin}>
            เข้าสู่ระบบ LINE
          </Button>
        </Box>
      </Box>
    );
  }

  // Not authenticated but not required
  if (!authState.authenticated && !requireAuth) {
    return <>{children}</>;
  }

  // Not authenticated and required
  if (!authState.authenticated && requireAuth) {
    if (fallbackComponent) {
      return <>{fallbackComponent}</>;
    }

    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="50vh"
        gap={2}
        p={3}
      >
        <Alert severity="info">
          <Typography variant="h6" gutterBottom>
            กรุณาเข้าสู่ระบบ
          </Typography>
          <Typography variant="body2">
            คุณต้องเข้าสู่ระบบผ่าน LINE เพื่อใช้งานส่วนนี้
          </Typography>
        </Alert>

        <Button variant="contained" onClick={handleManualLogin}>
          เข้าสู่ระบบ LINE
        </Button>
      </Box>
    );
  }

  // Success - render children
  return <>{children}</>;
} 