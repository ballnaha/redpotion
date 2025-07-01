'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { Box, CircularProgress, Typography, Alert, Card } from '@mui/material';

interface LiffHandlerProps {
  defaultRestaurantId?: string;
  children: React.ReactNode;
}

// Component ที่ใช้ useSearchParams ต้อง wrap ด้วย Suspense
function LiffLogic({ defaultRestaurantId, children }: LiffHandlerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [isLiff, setIsLiff] = useState(false);
  const [liffLoading, setLiffLoading] = useState(true);
  const [liffError, setLiffError] = useState<string | null>(null);
  const [hasRedirected, setHasRedirected] = useState(false);
  const [actualDefaultRestaurantId, setActualDefaultRestaurantId] = useState<string | null>(null);

  // Fetch default restaurant ID
  useEffect(() => {
    const fetchDefaultRestaurant = async () => {
      if (defaultRestaurantId) {
        setActualDefaultRestaurantId(defaultRestaurantId);
        return;
      }

      try {
        const response = await fetch('/api/restaurant/default');
        if (response.ok) {
          const data = await response.json();
          setActualDefaultRestaurantId(data.restaurantId);
        } else {
          console.error('Failed to fetch default restaurant');
          setLiffError('ไม่พบร้านอาหารที่ใช้งานได้');
        }
      } catch (error) {
        console.error('Error fetching default restaurant:', error);
        setLiffError('เกิดข้อผิดพลาดในการดึงข้อมูลร้าน');
      }
    };

    fetchDefaultRestaurant();
  }, [defaultRestaurantId]);

  // ตรวจสอบว่าเข้ามาจาก LIFF หรือไม่
  useEffect(() => {
    const checkLiff = async () => {
      try {
        // ป้องกัน multiple redirects
        if (hasRedirected || !actualDefaultRestaurantId) {
          console.log('🚫 Already redirected or no restaurant ID, skipping...');
          return;
        }

        // ตรวจสอบว่าอยู่ในหน้าเมนูเป้าหมายแล้วหรือไม่
        const currentPath = window.location.pathname;
        if (currentPath.includes(`/menu/${actualDefaultRestaurantId}`)) {
          console.log('✅ Already on target menu page, stopping LIFF logic');
          setLiffLoading(false);
          return;
        }

        // ตรวจสอบ query parameter หรือ user agent
        const isFromLiff = searchParams.get('liff') === 'true' || 
                          navigator.userAgent.includes('Line') ||
                          window.location.search.includes('liff') ||
                          window.location.search.includes('openExternalBrowser') ||
                          // ตรวจสอบว่าเข้ามาจาก LINE app
                          /Line/.test(navigator.userAgent);
        
        if (isFromLiff && typeof window !== 'undefined') {
          console.log('🔄 LIFF detected, status:', status);
          setIsLiff(true);
          
          // ถ้า authenticated แล้ว ให้ redirect ทันที
          if (status === 'authenticated' && session) {
            console.log('✅ Already authenticated, redirecting to menu...');
            setHasRedirected(true);
            // ใช้ window.location.replace เพื่อป้องกัน loop
            const targetUrl = `/menu/${actualDefaultRestaurantId}`;
            window.location.replace(targetUrl);
            return;
          }
          
          // ถ้าไม่มี LIFF SDK ให้ใช้วิธี auto login ธรรมดา
          if (!window.liff) {
            console.log('🔄 No LIFF SDK, using standard LINE login...');
            if (status === 'unauthenticated') {
              console.log('🔐 Starting LINE login...');
              setHasRedirected(true);
              const targetPath = `/menu/${actualDefaultRestaurantId}`;
              await signIn('line', { 
                callbackUrl: targetPath,
                redirect: true 
              });
              return;
            }
            return;
          }
          
          console.log('🚀 LIFF SDK detected, initializing...');
          
          // Initialize LIFF
          await window.liff.init({ 
            liffId: process.env.NEXT_PUBLIC_LIFF_ID || '2007609360-3Z0L8Ekg'
          });
          
          console.log('✅ LIFF initialized successfully');
          
          // ตรวจสอบสถานะ login ใน LIFF
          if (!window.liff.isLoggedIn()) {
            console.log('🔐 User not logged in to LINE, redirecting to LINE login...');
            setHasRedirected(true);
            window.liff.login();
            return;
          }
          
          console.log('✅ User already logged in to LINE');
          
          // ถ้า login LINE แล้วแต่ยังไม่ login NextAuth
          if (status === 'unauthenticated') {
            console.log('🔄 Auto signing in with LINE...');
            setHasRedirected(true);
            // Auto sign in with LINE
            const targetPath = `/menu/${actualDefaultRestaurantId}`;
            await signIn('line', { 
              callbackUrl: targetPath,
              redirect: true 
            });
            return;
          }
        } else {
          // ไม่ใช่ LIFF ให้แสดงหน้าปกติ
          setLiffLoading(false);
        }
      } catch (error) {
        console.error('❌ LIFF initialization error:', error);
        setLiffError('ไม่สามารถเชื่อมต่อกับ LINE ได้');
        setLiffLoading(false);
      }
    };

    if (typeof window !== 'undefined' && status !== 'loading') {
      checkLiff();
    }
  }, [searchParams, status, session, router, actualDefaultRestaurantId, hasRedirected]);

  // ถ้าเป็น LIFF และกำลังประมวลผล
  if (isLiff && liffLoading) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background decoration */}
        <Box
          sx={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(6, 199, 85, 0.1) 0%, rgba(5, 176, 74, 0.05) 100%)',
            filter: 'blur(40px)',
            animation: 'liquidFloat 6s ease-in-out infinite'
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -100,
            left: -100,
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(6, 199, 85, 0.1) 0%, rgba(5, 176, 74, 0.05) 100%)',
            filter: 'blur(60px)',
            animation: 'liquidFloat 8s ease-in-out infinite reverse'
          }}
        />

        <Card
          sx={{
            maxWidth: 400,
            width: '100%',
            background: 'rgba(255, 255, 255, 0.25)',
            backdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            borderRadius: 4,
            boxShadow: '0 8px 32px rgba(31, 38, 135, 0.15)',
            p: 5,
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            animation: 'fadeInUp 0.6s ease-out both'
          }}
        >
          {/* Shimmer effect */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
              animation: 'shimmer 2s infinite'
            }}
          />

          {/* Loading Icon */}
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(6, 199, 85, 0.2) 0%, rgba(5, 176, 74, 0.1) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              border: '2px solid rgba(6, 199, 85, 0.2)',
              animation: 'liquidFloat 3s ease-in-out infinite'
            }}
          >
            <CircularProgress 
              size={40} 
              sx={{ 
                color: '#06C755',
                filter: 'drop-shadow(0 2px 8px rgba(6, 199, 85, 0.3))'
              }} 
            />
          </Box>

          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 700,
              mb: 2,
              color: 'rgba(0, 0, 0, 0.9)',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              '@media (max-width: 600px)': {
                fontSize: '1.25rem'
              }
            }}
          >
            เชื่อมต่อกับ LINE
          </Typography>

          <Typography 
            sx={{ 
              color: 'rgba(0, 0, 0, 0.7)',
              lineHeight: 1.6,
              fontSize: '1rem',
              '@media (max-width: 600px)': {
                fontSize: '0.9rem'
              }
            }}
          >
            กำลังตรวจสอบการเข้าสู่ระบบ...
          </Typography>
        </Card>
      </Box>
    );
  }

  // ถ้าเป็น LIFF และเกิด error
  if (isLiff && liffError) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background decoration */}
        <Box
          sx={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)',
            filter: 'blur(40px)',
            animation: 'liquidFloat 6s ease-in-out infinite'
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -100,
            left: -100,
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)',
            filter: 'blur(60px)',
            animation: 'liquidFloat 8s ease-in-out infinite reverse'
          }}
        />

        <Card
          sx={{
            maxWidth: 400,
            width: '100%',
            background: 'rgba(255, 255, 255, 0.25)',
            backdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            borderRadius: 4,
            boxShadow: '0 8px 32px rgba(31, 38, 135, 0.15)',
            p: 5,
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            animation: 'fadeInUp 0.6s ease-out both'
          }}
        >
          {/* Shimmer effect */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
              animation: 'shimmer 2s infinite'
            }}
          />

          {/* Error Icon */}
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.1) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              border: '2px solid rgba(239, 68, 68, 0.2)',
              animation: 'liquidFloat 3s ease-in-out infinite'
            }}
          >
            <Typography
              sx={{
                fontSize: '2rem',
                color: '#EF4444',
                filter: 'drop-shadow(0 2px 8px rgba(239, 68, 68, 0.3))'
              }}
            >
              ⚠️
            </Typography>
          </Box>

          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 700,
              mb: 2,
              color: 'rgba(0, 0, 0, 0.9)',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              '@media (max-width: 600px)': {
                fontSize: '1.25rem'
              }
            }}
          >
            เกิดข้อผิดพลาด
          </Typography>

          <Typography 
            sx={{ 
              color: 'rgba(0, 0, 0, 0.7)',
              mb: 3,
              lineHeight: 1.6,
              fontSize: '1rem',
              '@media (max-width: 600px)': {
                fontSize: '0.9rem'
              }
            }}
          >
            {liffError}
          </Typography>
          
          <Typography 
            sx={{ 
              color: 'rgba(0, 0, 0, 0.5)',
              fontSize: '0.85rem',
              fontStyle: 'italic'
            }}
          >
            โปรดลองใหม่อีกครั้งหรือติดต่อผู้ดูแลระบบ
          </Typography>
        </Card>
      </Box>
    );
  }

  // ถ้าเป็น LIFF และกำลัง redirect หรือ sign in
  if (isLiff && (status === 'loading' || status === 'unauthenticated')) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background decoration */}
        <Box
          sx={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(6, 199, 85, 0.1) 0%, rgba(5, 176, 74, 0.05) 100%)',
            filter: 'blur(40px)',
            animation: 'liquidFloat 6s ease-in-out infinite'
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -100,
            left: -100,
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(6, 199, 85, 0.1) 0%, rgba(5, 176, 74, 0.05) 100%)',
            filter: 'blur(60px)',
            animation: 'liquidFloat 8s ease-in-out infinite reverse'
          }}
        />

        <Card
          sx={{
            maxWidth: 400,
            width: '100%',
            background: 'rgba(255, 255, 255, 0.25)',
            backdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            borderRadius: 4,
            boxShadow: '0 8px 32px rgba(31, 38, 135, 0.15)',
            p: 5,
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            animation: 'fadeInUp 0.6s ease-out both'
          }}
        >
          {/* Shimmer effect */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
              animation: 'shimmer 2s infinite'
            }}
          />

          {/* Login Icon */}
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(6, 199, 85, 0.2) 0%, rgba(5, 176, 74, 0.1) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              border: '2px solid rgba(6, 199, 85, 0.2)',
              animation: 'liquidFloat 3s ease-in-out infinite'
            }}
          >
            <CircularProgress 
              size={40} 
              sx={{ 
                color: '#06C755',
                filter: 'drop-shadow(0 2px 8px rgba(6, 199, 85, 0.3))'
              }} 
            />
          </Box>

          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 700,
              mb: 2,
              color: 'rgba(0, 0, 0, 0.9)',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              '@media (max-width: 600px)': {
                fontSize: '1.25rem'
              }
            }}
          >
            เข้าสู่ระบบ
          </Typography>

          <Typography 
            sx={{ 
              color: 'rgba(0, 0, 0, 0.7)',
              lineHeight: 1.6,
              fontSize: '1rem',
              '@media (max-width: 600px)': {
                fontSize: '0.9rem'
              }
            }}
          >
            กำลังเข้าสู่ระบบด้วย LINE...
          </Typography>
        </Card>
      </Box>
    );
  }

  // ถ้าไม่ใช่ LIFF หรือ process เสร็จแล้ว ให้แสดง children ปกติ
  return <>{children}</>;
}

// Loading fallback สำหรับ Suspense
function LiffFallback() {
  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      p: 3
    }}>
      <CircularProgress size={40} sx={{ color: '#06C755' }} />
    </Box>
  );
}

// Main component ที่ wrap ด้วย Suspense
export default function LiffHandler({ defaultRestaurantId, children }: LiffHandlerProps) {
  return (
    <Suspense fallback={<LiffFallback />}>
      <LiffLogic defaultRestaurantId={defaultRestaurantId}>
        {children}
      </LiffLogic>
    </Suspense>
  );
} 