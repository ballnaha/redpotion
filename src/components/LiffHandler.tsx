'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, CircularProgress, Typography, Button, Paper } from '@mui/material';
import { getAppConfig, appUtils } from '@/lib/appConfig';

// Component ที่ใช้ useSearchParams ต้องอยู่ใน Suspense boundary
function LiffHandlerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLineApp, setIsLineApp] = useState(false);

  // ตรวจสอบว่าเข้าจาก LINE app หรือไม่
  const checkLineApp = () => {
    if (typeof window === 'undefined') return false;
    
    const userAgent = navigator.userAgent;
    const referrer = document.referrer;
    
    // ตรวจสอบ User Agent และ Referrer
    const isFromLineApp = userAgent.includes('Line') || 
                         userAgent.includes('LIFF') ||
                         referrer.includes('liff.line.me') ||
                         referrer.includes('liff-web.line.me');
    
    console.log('📱 LINE App Detection:', {
      userAgent: userAgent,
      referrer: referrer,
      isFromLineApp: isFromLineApp
    });
    
    return isFromLineApp;
  };

  // ฟังก์ชันหลักสำหรับจัดการ LIFF
  useEffect(() => {
    const handleLiff = async () => {
      try {
        const config = getAppConfig();
        
        // ตรวจสอบ URL parameter สำหรับ bypass
        const urlParams = new URLSearchParams(window.location.search);
        const bypassMode = urlParams.get('bypass') === 'true';
        
        // ตรวจสอบว่าเข้าจาก LINE app หรือไม่
        const lineAppDetected = checkLineApp();
        setIsLineApp(lineAppDetected);
        
        if (config.enableDebugLogs) {
          console.log('🔧 App Config:', config);
          console.log('📱 LINE App Detected:', lineAppDetected);
          console.log('🔓 Bypass Mode:', bypassMode);
        }
        
        // ถ้ามี bypass parameter ให้ข้ามการตรวจสอบ
        if (bypassMode && config.enableBypassMode) {
          console.log('🔓 Bypass mode enabled');
          setLoading(false);
          return;
        }

        // ถ้าไม่ได้เข้าจาก LINE app ให้แสดงข้อความแจ้งเตือน
        if (!lineAppDetected && config.enforceLineApp) {
          console.log('🚫 Not from LINE app, blocking access');
          
          // ถ้าอนุญาตให้เข้าจาก desktop
          if (config.allowDesktopAccess) {
            console.log('🛠️ Desktop access allowed by config');
            setLoading(false);
            return;
          }
          
          setError('desktop');
          setLoading(false);
          return;
        }

        // ตรวจสอบว่าอยู่ในหน้า auth หรือไม่
        const currentPath = window.location.pathname;
        const isAuthPage = currentPath.startsWith('/auth/');
        const isLiffPage = currentPath === '/liff';
        
        if (isAuthPage && !isLiffPage) {
          console.log('🚫 Auth page detected, skipping LIFF');
          setLoading(false);
          return;
        }

        // เฉพาะหน้าที่ต้องการ LIFF เท่านั้น
        const needsLiff = isLiffPage || 
                         searchParams.get('liff') === 'true';

        // สำหรับหน้าเมนูและตะกร้า ให้ปิด loading ทันทีเพื่อไม่ให้ซ้อนกับ loading อื่น
        const isMenuOrCart = currentPath.startsWith('/menu/') || currentPath.startsWith('/cart/');
        
        if (!needsLiff && !isMenuOrCart) {
          console.log('🚫 Page does not need LIFF');
          setLoading(false);
          return;
        }
        
        if (isMenuOrCart) {
          console.log('🍽️ Menu/Cart page detected, skipping LIFF handler loading to avoid multiple loading states');
          setLoading(false);
          return;
        }

        // ถ้าอยู่ในหน้าที่ต้องการ LIFF และมี liff flag แล้ว ไม่ต้องทำอะไร
        if ((currentPath.startsWith('/menu/') || currentPath.startsWith('/cart/')) && searchParams.get('liff') === 'true') {
          console.log('🍽️ Already in LIFF-enabled page with flag, skipping initialization');
          setLoading(false);
          return;
        }

        // Initialize LIFF
        const { getValidatedLiffId } = await import('@/lib/liffUtils');
        const { liffId, error: liffError } = getValidatedLiffId();
        
        if (!liffId) {
          console.error('❌ Invalid LIFF configuration:', liffError);
          setError('invalid_config');
          setLoading(false);
          return;
        }
        
        if (!window.liff) {
          console.error('❌ LIFF SDK not available');
          setError('liff_sdk');
          setLoading(false);
          return;
        }

        console.log('🚀 Initializing LIFF...');
        try {
          await window.liff.init({ liffId });
          console.log('✅ LIFF initialized');
        } catch (initError) {
          console.error('❌ LIFF initialization failed:', initError);
          if (initError instanceof Error && (
              initError.message.includes('already initialized') || 
              initError.message.includes('LIFF has already been initialized')
            )) {
            console.log('✅ LIFF already initialized, continuing...');
          } else {
            setError('liff_init_failed');
            setLoading(false);
            return;
          }
        }

        // ตรวจสอบสถานะการ login
        if (!window.liff.isLoggedIn()) {
          console.log('❌ Not logged in to LINE');
          
          // Redirect ไป LINE signin พร้อมส่ง current path
          const restaurantId = extractRestaurantIdFromPath();
          const currentPath = window.location.pathname;
          const lineSigninUrl = restaurantId 
            ? `/auth/line-signin?restaurant=${restaurantId}&from=liff&returnUrl=${encodeURIComponent(currentPath)}`
            : `/auth/line-signin?from=liff&returnUrl=${encodeURIComponent(currentPath)}`;
          
          console.log('🔄 Redirecting to LINE signin:', lineSigninUrl);
          router.replace(lineSigninUrl);
          return;
        }

        console.log('✅ User logged in to LINE');

        // ถ้า login แล้ว ให้ทำการ auto login
        await performAutoLogin();

      } catch (error) {
        console.error('❌ LIFF error:', error);
        setError('init_failed');
      } finally {
        setLoading(false);
      }
    };

    const extractRestaurantIdFromPath = () => {
      const path = window.location.pathname;
      const match = path.match(/\/menu\/([^\/]+)/);
      return match?.[1] || null;
    };

    const performAutoLogin = async () => {
      try {
        const accessToken = window.liff.getAccessToken();
        if (!accessToken) {
          throw new Error('No access token');
        }

        // ส่ง request ไป backend
        const restaurantId = extractRestaurantIdFromPath();
        const loginCurrentPath = window.location.pathname;
        console.log('🔐 Performing auto login with restaurantId:', restaurantId, 'currentPath:', loginCurrentPath);

        const response = await fetch('/api/auth/line-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            accessToken: accessToken,
            restaurantId: restaurantId,
            returnUrl: loginCurrentPath
          })
        });

        if (!response.ok) {
          throw new Error('Login failed');
        }

        const loginData = await response.json();
        console.log('✅ Auto login successful:', loginData);

        // ตัดสินใจ redirect
        const currentPath = window.location.pathname;
        const urlParams = new URLSearchParams(window.location.search);
        const hasLiffFlag = urlParams.get('liff') === 'true';
        
        // ถ้าอยู่ในหน้าที่ต้องการ LIFF แล้ว
        if ((currentPath.startsWith('/menu/') || currentPath.startsWith('/cart/')) && loginData.user.role === 'CUSTOMER') {
          // ถ้าอยู่ในหน้าที่ต้องการ LIFF และมี flag แล้ว ไม่ต้อง redirect
          if (hasLiffFlag) {
            console.log('🍽️ Already in LIFF page with flag, no redirect needed');
            return; // ไม่ต้อง redirect
          } else {
            // ถ้าไม่มี flag ให้เพิ่ม flag ตามหน้าปัจจุบัน
            console.log('🍽️ Adding LIFF flag to current page');
            router.replace(`${currentPath}?liff=true&t=${Date.now()}`);
          }
        } else if (loginData.redirectUrl && loginData.redirectUrl !== '/') {
          // ใช้ redirect URL จาก API
          console.log('🔄 Following redirect:', loginData.redirectUrl);
          if (loginData.redirectUrl.startsWith('/menu/')) {
            router.replace(`${loginData.redirectUrl}?liff=true&t=${Date.now()}`);
          } else {
            router.replace(loginData.redirectUrl);
          }
        } else {
          // Default redirect
          if (loginData.user.role === 'RESTAURANT_OWNER') {
            router.replace('/restaurant');
          } else {
            router.replace('/');
          }
        }

      } catch (error) {
        console.error('❌ Auto login failed:', error);
        setError('login_failed');
      }
    };

    // เริ่มต้น
    handleLiff();
  }, [router, searchParams]);

  // แสดง error สำหรับ desktop access
  if (error === 'desktop') {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#f5f5f5',
          p: 2
        }}
      >
        <Paper
          sx={{
            p: 4,
            maxWidth: 400,
            textAlign: 'center',
            borderRadius: 2
          }}
        >
          <Typography variant="h6" gutterBottom color="error">
            เข้าถึงไม่ได้
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }} color="text.secondary">
            กรุณาเข้าใช้งานผ่าน LINE application บนมือถือเท่านั้น
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => window.open('https://line.me/th/', '_blank')}
            sx={{
              bgcolor: '#00B900',
              '&:hover': { bgcolor: '#009900' }
            }}
          >
            เปิด LINE
          </Button>
        </Paper>
      </Box>
    );
  }

  // ซ่อน error messages เพื่อป้องกันการแสดงข้อความที่ทำให้สับสน
  // ไม่แสดง error UI เลย เพื่อให้ component อื่นๆ ทำงานได้ปกติ
  if (error && error !== 'desktop') {
    // Silent error - ไม่แสดงอะไร แต่ log error สำหรับ debugging
    console.log('🔇 LiffHandler error (silenced):', error);
    return null; // ไม่แสดง error UI
  }

  // แสดง loading
  if (loading) {
    return (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          zIndex: 9999
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={40} sx={{ mb: 2, color: '#10B981' }} />
          <Typography variant="body2" color="text.secondary">
            กำลังเชื่อมต่อ LINE...
          </Typography>
        </Box>
      </Box>
    );
  }

  return null;
}

// Loading fallback component
function LiffHandlerFallback() {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        zIndex: 9999
      }}
    >
      <Box sx={{ textAlign: 'center' }}>
        <CircularProgress size={40} sx={{ mb: 2, color: '#10B981' }} />
        <Typography variant="body2" color="text.secondary">
          กำลังโหลด...
        </Typography>
      </Box>
    </Box>
  );
}

// Main component ที่ห่อด้วย Suspense
export default function LiffHandler() {
  return (
    <Suspense fallback={<LiffHandlerFallback />}>
      <LiffHandlerContent />
    </Suspense>
  );
} 