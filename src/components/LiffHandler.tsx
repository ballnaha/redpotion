'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, CircularProgress, Typography } from '@mui/material';

// Component ที่ใช้ useSearchParams ต้องอยู่ใน Suspense boundary
function LiffHandlerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [liffLoading, setLiffLoading] = useState(true);
  const [isLiffPage, setIsLiffPage] = useState(false);
  const [autoLoginAttempted, setAutoLoginAttempted] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isFromLiff, setIsFromLiff] = useState(false);
  const [isMenuPage, setIsMenuPage] = useState(false);

  // ฟังก์ชันตรวจสอบว่าเข้าจาก LIFF หรือไม่
  const checkIfFromLiff = () => {
    if (typeof window === 'undefined') return false;
    
    // ตรวจสอบ referrer
    const referrer = document.referrer;
    const isLiffReferrer = referrer.includes('liff.line.me') || referrer.includes('liff-web.line.me');
    
    // ตรวจสอบ user agent
    const userAgent = navigator.userAgent;
    const isLineApp = userAgent.includes('Line') || userAgent.includes('LIFF');
    
    // ตรวจสอบ URL parameters ที่บ่งบอกว่าเข้าจาก LIFF
    const hasLiffParams = window.location.search.includes('liff') || 
                         window.location.search.includes('utm_source=line');
    
    console.log('🔍 LIFF Detection:', {
      referrer,
      isLiffReferrer,
      userAgent,
      isLineApp,
      hasLiffParams,
      pathname: window.location.pathname
    });
    
    return isLiffReferrer || isLineApp || hasLiffParams;
  };

  // ฟังก์ชันตรวจสอบว่าเป็นหน้า menu หรือไม่
  const checkIfMenuPage = () => {
    if (typeof window === 'undefined') return false;
    return window.location.pathname.startsWith('/menu/');
  };

  // ตรวจสอบว่าอยู่ในฝั่ง client หรือไม่
  useEffect(() => {
    setIsClient(true);
  }, []);

  // ตรวจสอบว่าเป็นหน้า LIFF และเข้าจาก LIFF หรือไม่
  useEffect(() => {
    if (!isClient) return;

    setIsLiffPage(window.location.pathname === '/liff');
    setIsFromLiff(checkIfFromLiff());
    setIsMenuPage(checkIfMenuPage());
  }, [isClient]);

  useEffect(() => {
    if (!isClient) {
      setLiffLoading(false);
      return;
    }

    const initializeLiff = async () => {
      try {
        console.log('🚀 Initializing LIFF...');
        
        // ตรวจสอบว่าอยู่ในหน้า auth หรือไม่
        const isAuthPage = window.location.pathname.startsWith('/auth/');
        const isLiffPageCheck = window.location.pathname === '/liff';
        
        if (isAuthPage && !isLiffPageCheck) {
          console.log('🚫 Auth page detected, skipping LIFF initialization');
          setLiffLoading(false);
          return;
        }

        console.log('🔍 Is from LIFF:', isFromLiff);
        console.log('🔍 Is menu page:', isMenuPage);

        // ตรวจสอบว่าต้องการ LIFF หรือไม่ (รวมหน้า menu ด้วย)
        const needsLiff = isLiffPageCheck || 
                          isFromLiff ||
                          isMenuPage ||
                          window.location.pathname.startsWith('/cart/') ||
                          searchParams.get('liff') === 'true' ||
                          navigator.userAgent.includes('Line');

        if (!needsLiff) {
          console.log('🚫 Page does not need LIFF, skipping initialization');
          setLiffLoading(false);
          return;
        }

        // สำหรับหน้า menu ที่ไม่ใช่ LIFF ให้ปล่อยให้ MenuPageComponent จัดการ authentication เอง
        if (isMenuPage && !isFromLiff && !isLiffPageCheck) {
          console.log('📱 Menu page detected (non-LIFF), letting MenuPageComponent handle authentication');
          setLiffLoading(false);
          return;
        }

        const liffId = process.env.NODE_ENV === 'production' 
          ? process.env.NEXT_PUBLIC_LIFF_ID_PROD 
          : process.env.NEXT_PUBLIC_LIFF_ID_DEV || '2007609360-3Z0L8Ekg';

        if (!liffId) {
          console.warn('⚠️ LIFF ID not configured');
          setLiffLoading(false);
          return;
        }

        if (!window.liff) {
          console.log('⚠️ LIFF SDK not available');
          setLiffLoading(false);
          return;
        }

        await window.liff.init({ liffId });
        console.log('✅ LIFF initialized successfully');

        // ตรวจสอบสถานะการ login
        if (window.liff.isLoggedIn()) {
          console.log('✅ User is logged in to LINE');
          
          // ถ้าอยู่ในหน้า LIFF หรือเข้าจาก LIFF ให้จัดการ auto login
          if (isLiffPageCheck || (isFromLiff && !autoLoginAttempted)) {
            setAutoLoginAttempted(true);
            await handleLiffAutoLogin();
          }
        } else {
          console.log('ℹ️ User not logged in to LINE');
          
          // ถ้าอยู่ในหน้า LIFF หรือเข้าจาก LIFF ให้ redirect ไป LINE signin
          if (isLiffPageCheck || isFromLiff) {
            const restaurantId = searchParams.get('restaurant') || extractRestaurantIdFromPath();
            const lineSigninUrl = restaurantId 
              ? `/auth/line-signin?restaurant=${restaurantId}`
              : '/auth/line-signin';
            
            console.log('🔄 Redirecting to LINE signin:', lineSigninUrl);
            router.replace(lineSigninUrl);
          }
        }

      } catch (error) {
        console.error('❌ LIFF initialization error:', error);
      } finally {
        setLiffLoading(false);
      }
    };

    // ฟังก์ชันตรวจสอบ LINE session
    const checkLineSession = async () => {
      try {
        const response = await fetch('/api/auth/line-session', {
          method: 'GET',
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          return data.success && data.user;
        }
        return false;
      } catch (error) {
        console.error('❌ Error checking LINE session:', error);
        return false;
      }
    };

    const extractRestaurantIdFromPath = () => {
      const path = window.location.pathname;
      const menuMatch = path.match(/\/menu\/([^\/]+)/);
      const cartMatch = path.match(/\/cart\/([^\/]+)/);
      
      return menuMatch?.[1] || cartMatch?.[1] || null;
    };

    const handleLiffAutoLogin = async () => {
      try {
        console.log('🔐 Handling LIFF auto login...');
        
        if (!window.liff) {
          console.error('❌ LIFF SDK not available');
          return;
        }
        
        const accessToken = window.liff.getAccessToken();
        if (!accessToken) {
          console.error('❌ No access token available');
          return;
        }

        console.log('🎯 Access token obtained');

        // ส่ง access token ไปยัง backend
        const loginResponse = await fetch('/api/auth/line-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            accessToken: accessToken
          })
        });

        if (loginResponse.ok) {
          const loginData = await loginResponse.json();
          console.log('✅ LINE login successful:', loginData);

          // ถ้าเป็น user ใหม่ ให้ redirect ไป role selection
          if (loginData.isNewUser) {
            console.log('👤 New user detected, redirecting to role selection');
            router.replace('/auth/role-selection');
            return;
          }

          // ถ้า login สำเร็จ ให้ redirect ไปยังหน้าที่เหมาะสม
          const restaurantId = searchParams.get('restaurant') || extractRestaurantIdFromPath();
          
          if (restaurantId) {
            if (loginData.user.role === 'CUSTOMER') {
              console.log('🍽️ Customer redirect to menu');
              router.replace(`/menu/${restaurantId}`);
            } else if (loginData.user.role === 'RESTAURANT_OWNER') {
              console.log('🏪 Restaurant owner redirect to dashboard');
              router.replace('/restaurant');
            } else {
              console.log('🏠 Default redirect to home');
              router.replace('/');
            }
          } else {
            if (loginData.user.role === 'RESTAURANT_OWNER') {
              router.replace('/restaurant');
            } else {
              router.replace('/');
            }
          }
        } else {
          console.error('❌ LINE login failed');
          const errorData = await loginResponse.json();
          console.error('Error details:', errorData);
        }

      } catch (error) {
        console.error('❌ Auto login error:', error);
      }
    };

    initializeLiff();
  }, [isClient, isFromLiff, isMenuPage, router, searchParams]);

  // แสดง loading spinner ขณะกำลังโหลด LIFF
  if (liffLoading) {
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
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
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
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
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

// Main component ที่ห่อด้วy Suspense
export default function LiffHandler() {
  return (
    <Suspense fallback={<LiffHandlerFallback />}>
      <LiffHandlerContent />
    </Suspense>
  );
} 