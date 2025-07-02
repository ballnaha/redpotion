'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, CircularProgress, Typography } from '@mui/material';

export default function LiffHandler() {
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

        const restaurantId = searchParams.get('restaurant') || extractRestaurantIdFromPath();
        console.log('📱 Sending auto login request with restaurantId:', restaurantId);

        const response = await fetch('/api/auth/line-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            accessToken,
            restaurantId
          })
        });

        const data = await response.json();

        if (response.ok && data.success) {
          console.log('✅ LIFF auto login successful:', data.user.name);
          console.log('🔄 Auto redirecting to:', data.redirectUrl);
          
          // Auto redirect ทันที
          router.replace(data.redirectUrl);
        } else {
          console.error('❌ LIFF auto login failed:', data.error);
          
          // ถ้า auto login ล้มเหลว ให้ไป LINE signin page
          const restaurantId = searchParams.get('restaurant') || extractRestaurantIdFromPath();
          const lineSigninUrl = restaurantId 
            ? `/auth/line-signin?restaurant=${restaurantId}&error=auto_login_failed`
            : '/auth/line-signin?error=auto_login_failed';
          
          router.replace(lineSigninUrl);
        }

      } catch (error) {
        console.error('❌ LIFF auto login error:', error);
        
        // ถ้าเกิด error ให้ไป LINE signin page
        const restaurantId = searchParams.get('restaurant') || extractRestaurantIdFromPath();
        const lineSigninUrl = restaurantId 
          ? `/auth/line-signin?restaurant=${restaurantId}&error=auto_login_error`
          : '/auth/line-signin?error=auto_login_error';
        
        router.replace(lineSigninUrl);
      }
    };

    // ตรวจสอบว่า LIFF SDK โหลดแล้วหรือยัง
    if (window.liff) {
      initializeLiff();
    } else {
      // รอ LIFF SDK โหลด
      const checkLiff = setInterval(() => {
        if (window.liff) {
          clearInterval(checkLiff);
          initializeLiff();
        }
      }, 100);

      // Timeout หลัง 10 วินาที
      setTimeout(() => {
        clearInterval(checkLiff);
        if (!window.liff) {
          console.warn('⚠️ LIFF SDK not loaded within timeout');
          setLiffLoading(false);
        }
      }, 10000);
    }

  }, [isClient, router, searchParams, autoLoginAttempted, isFromLiff, isMenuPage]);

  // ไม่แสดงอะไรเลยในฝั่ง server-side
  if (!isClient) {
    return null;
  }

  // แสดง loading เมื่อกำลัง auto login หรือตรวจสอบ session ในหน้า menu
  if (liffLoading && (isLiffPage || isFromLiff || isMenuPage)) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        background: '#ffffff',
        gap: 2
      }}>
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          {isMenuPage && !isFromLiff ? 'กำลังตรวจสอบสิทธิ์...' : 'กำลัง Login อัตโนมัติ...'}
        </Typography>
      </Box>
    );
  }

  // ไม่แสดง UI component สำหรับหน้าอื่นๆ
  return null;
} 