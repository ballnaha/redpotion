'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, CircularProgress, Typography, Card, Alert, Button } from '@mui/material';

// Component ที่ใช้ useSearchParams ต้องอยู่ใน Suspense boundary
function LiffLandingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('เตรียมความพร้อม...');
  const [liffReady, setLiffReady] = useState(false);

  // Auto LINE Login Effect
  useEffect(() => {
    const initializeLiffAndLogin = async () => {
      try {
        setLoadingMessage('กำลังโหลด LINE SDK...');
        
        // โหลด LIFF SDK
        await loadLiffSdk();
        
        setLoadingMessage('เชื่อมต่อกับ LINE...');
        
        // Initialize LIFF
        const liffId = process.env.NEXT_PUBLIC_LIFF_ID || '2007609360-3Z0L8Ekg';
        
        if ((window as any).liff) {
          try {
            await (window as any).liff.init({ liffId });
            console.log('✅ LIFF initialized successfully');
            setLiffReady(true);
            
            // ตรวจสอบสถานะการล็อกอิน
            if (!(window as any).liff.isLoggedIn()) {
              setLoadingMessage('กำลังเข้าสู่ระบบ LINE...');
              console.log('🔐 Auto login to LINE...');
              
              // Auto login โดยไม่ต้องให้ user กด
              (window as any).liff.login();
              return;
            } else {
              setLoadingMessage('ตรวจสอบสิทธิ์การเข้าใช้...');
              console.log('✅ Already logged in to LINE');
              
              // ดำเนินการ authentication กับ backend
              await handleLineAuthentication();
            }
          } catch (initError) {
            console.error('❌ LIFF initialization failed:', initError);
            if (initError instanceof Error && (
                initError.message.includes('already initialized') || 
                initError.message.includes('LIFF has already been initialized')
              )) {
              console.log('✅ LIFF already initialized');
              setLiffReady(true);
              
              if ((window as any).liff.isLoggedIn()) {
                await handleLineAuthentication();
              } else {
                setLoadingMessage('กำลังเข้าสู่ระบบ LINE...');
                (window as any).liff.login();
              }
            } else {
              throw initError;
            }
          }
        }
      } catch (error) {
        console.error('❌ LIFF initialization error:', error);
        setError('connection_error');
        setIsLoading(false);
      }
    };

    initializeLiffAndLogin();
  }, []);

  // Handle LINE Authentication
  const handleLineAuthentication = async () => {
    try {
      setLoadingMessage('ยืนยันตัวตน...');
      
      const accessToken = (window as any).liff.getAccessToken();
      const restaurantId = searchParams.get('restaurant');
      
      console.log('🎯 Sending LINE token to backend...', { restaurantId });
      
      const response = await fetch('/api/auth/line-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken: accessToken,
          restaurantId: restaurantId
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log('✅ LINE authentication successful:', data.user.name);
        
        if (data.isNewUser) {
          setLoadingMessage('ผู้ใช้ใหม่! กำลังตั้งค่าบัญชี...');
          console.log('👤 New user detected, redirecting to role selection');
          
          // Delay เล็กน้อยเพื่อให้ user เห็นข้อความ
          setTimeout(() => {
            window.location.href = '/auth/role-selection';
          }, 1500);
          return;
        }

        if (data.shouldRedirectToRestaurant && data.restaurantId) {
          setLoadingMessage(`กำลังเข้าสู่เมนูร้านอาหาร...`);
          console.log('🏪 Redirecting to restaurant menu:', data.restaurantId);
          
          // Smooth redirect with delay
          setTimeout(() => {
            window.location.href = `/menu/${data.restaurantId}?from=liff-auto-login`;
          }, 1000);
        } else {
          setLoadingMessage('เข้าสู่ระบบสำเร็จ!');
          setTimeout(() => {
            window.location.href = data.redirectUrl;
          }, 1000);
        }
      } else {
        console.error('❌ LINE authentication failed:', data.error);
        setError('auth_error');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('❌ Authentication error:', error);
      setError('auth_error');
      setIsLoading(false);
    }
  };

  // Load LIFF SDK
  const loadLiffSdk = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if ((window as any).liff) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js';
      script.async = true;
      script.onload = () => {
        console.log('✅ LIFF SDK loaded');
        resolve();
      };
      script.onerror = () => {
        console.error('❌ Failed to load LIFF SDK');
        reject(new Error('Failed to load LIFF SDK'));
      };
      document.head.appendChild(script);
    });
  };

  // Fallback redirect สำหรับกรณีที่ไม่อยู่ใน LINE environment
  useEffect(() => {
    const handleFallbackRedirect = async () => {
      // รอให้ LIFF พยายาม initialize ก่อน
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      if (!liffReady && isLoading) {
        console.log('⚠️ Not in LINE environment or LIFF failed, using fallback');
        
        const restaurantId = searchParams.get('restaurant');
        
        // ตรวจสอบ session ปกติ
        try {
          const sessionResponse = await fetch('/api/auth/line-session');
          const sessionData = await sessionResponse.json();
          
          if (sessionData.authenticated && sessionData.user) {
            console.log('✅ User already authenticated via session');
            
            if (restaurantId) {
              window.location.href = `/menu/${restaurantId}?liff=true&from=liff-fallback`;
            } else {
              const response = await fetch('/api/restaurant/default');
              if (response.ok) {
                const defaultRestaurant = await response.json();
                window.location.href = `/menu/${defaultRestaurant.restaurantId}?liff=true&from=liff-fallback`;
              } else {
                setError('no_restaurant');
                setIsLoading(false);
              }
            }
          } else {
            console.log('❌ No session, redirecting to signin');
            const signinUrl = restaurantId 
              ? `/auth/line-signin?restaurant=${restaurantId}&required=true`
              : '/auth/line-signin?required=true';
            window.location.href = signinUrl;
          }
        } catch (sessionError) {
          console.error('❌ Session check failed:', sessionError);
          const restaurantId = searchParams.get('restaurant');
          const signinUrl = restaurantId 
            ? `/auth/line-signin?restaurant=${restaurantId}&required=true`
            : '/auth/line-signin?required=true';
          window.location.href = signinUrl;
        }
      }
    };

    handleFallbackRedirect();
  }, [liffReady, isLoading, searchParams]);

  // Loading State
  if (isLoading && !error) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Animated Background Elements */}
        <Box
          sx={{
            position: 'absolute',
            top: '10%',
            right: '10%',
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.08)',
            animation: 'float 3s ease-in-out infinite'
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: '20%',
            left: '15%',
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.05)',
            animation: 'float 4s ease-in-out infinite reverse'
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '5%',
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.03)',
            animation: 'float 5s ease-in-out infinite'
          }}
        />

        <Card
          sx={{
            maxWidth: 400,
            width: '100%',
            background: 'rgba(255, 255, 255, 0.25)',
            backdropFilter: 'blur(20px) saturate(180%)',
            borderRadius: 4,
            boxShadow: '0 8px 32px rgba(31, 38, 135, 0.08)',
            p: 4,
            textAlign: 'center',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
              borderRadius: 4,
              zIndex: -1
            }
          }}
        >

          {/* Loading Message */}
          <Typography 
            variant="body1" 
            sx={{ 
              color: '#111827',
              fontWeight: 600,
              mb: 1,
              minHeight: '24px'
            }}
          >
            {loadingMessage}
          </Typography>

          <Typography 
            variant="body2" 
            sx={{ 
              color: '#6B7280',
              fontSize: '0.875rem'
            }}
          >
            กรุณารอสักครู่...
          </Typography>

          {/* Progress Indicator */}
          <Box sx={{ mt: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
              {[1, 2, 3].map((dot, index) => (
                <Box
                  key={dot}
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#10B981',
                    opacity: 0.3,
                    animation: `dotPulse 1.5s ease-in-out infinite ${index * 0.2}s`
                  }}
                />
              ))}
            </Box>
          </Box>
        </Card>

        {/* CSS Animations */}
        <style jsx global>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
          
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes dotPulse {
            0%, 100% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.2); }
          }
        `}</style>
      </Box>
    );
  }

  // แสดง error state ตามสถานการณ์
  if (error) {
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
            background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.1) 0%, rgba(255, 152, 0, 0.05) 100%)',
            filter: 'blur(40px)',
            animation: 'liquidFloat 6s ease-in-out infinite'
          }}
        />

        <Card
          sx={{
            maxWidth: 500,
            width: '100%',
            background: 'rgba(255, 255, 255, 0.25)',
            backdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            borderRadius: 4,
            boxShadow: '0 8px 32px rgba(31, 38, 135, 0.15)',
            p: 4,
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {error === 'pending' && (
            <Alert 
              severity="info" 
              sx={{ 
                mb: 3, 
                background: 'rgba(33, 150, 243, 0.1)',
                border: '1px solid rgba(33, 150, 243, 0.2)',
                '& .MuiAlert-icon': { color: '#2196f3' }
              }}
            >
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                🎉 ขอบคุณที่สมัครร่วมกับเรา!
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                ร้านอาหารของคุณอยู่ในระหว่างการตรวจสอบ<br/>
                <strong>กำลังรอการอนุมัติจาก admin</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                📋 ระยะเวลาดำเนินการ: ภายใน 1-2 วันทำการ<br/>
                📧 เราจะแจ้งผลผ่านอีเมลเมื่อการตรวจสอบเสร็จสิ้น<br/>
                🔍 กำลังตรวจสอบ: เอกสาร, ข้อมูลร้าน, และความถูกต้องของข้อมูล
              </Typography>
            </Alert>
          )}

          {error === 'no_restaurant' && (
            <Alert 
              severity="warning" 
              sx={{ 
                mb: 3,
                background: 'rgba(255, 152, 0, 0.1)',
                border: '1px solid rgba(255, 152, 0, 0.2)',
                '& .MuiAlert-icon': { color: '#ff9800' }
              }}
            >
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                🏪 ยังไม่มีร้านอาหารในระบบ
              </Typography>
              <Typography variant="body1">
                ขณะนี้ยังไม่มีร้านอาหารที่เปิดให้บริการ<br/>
                กรุณาลองใหม่อีกครั้งในภายหลัง
              </Typography>
            </Alert>
          )}

          {error === 'connection_error' && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3,
                background: 'rgba(244, 67, 54, 0.1)',
                border: '1px solid rgba(244, 67, 54, 0.2)',
                '& .MuiAlert-icon': { color: '#f44336' }
              }}
            >
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                ⚠️ เกิดข้อผิดพลาด
              </Typography>
              <Typography variant="body1">
                ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้<br/>
                กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต
              </Typography>
            </Alert>
          )}

          <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button 
              variant="contained" 
              onClick={() => window.location.reload()}
              sx={{ 
                background: 'linear-gradient(135deg, #06C755 0%, #05B04A 100%)',
                boxShadow: '0 4px 16px rgba(6, 199, 85, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #05B04A 0%, #049A3F 100%)',
                }
              }}
            >
              ลองใหม่อีกครั้ง
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => router.push('/')}
              sx={{ 
                borderColor: 'rgba(6, 199, 85, 0.5)',
                color: '#06C755',
                '&:hover': {
                  borderColor: '#06C755',
                  background: 'rgba(6, 199, 85, 0.1)'
                }
              }}
            >
              ไปหน้าแรก
            </Button>
          </Box>
        </Card>
      </Box>
    );
  }

  // แสดง loading state
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
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(52, 211, 153, 0.05) 100%)',
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
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(129, 140, 248, 0.05) 100%)',
          filter: 'blur(60px)',
          animation: 'liquidFloat 8s ease-in-out infinite reverse'
        }}
      />

      <Card
        sx={{
          maxWidth: 500,
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

        {/* Loading Animation */}
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(52, 211, 153, 0.1) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            border: '2px solid rgba(16, 185, 129, 0.2)',
            animation: 'liquidFloat 3s ease-in-out infinite'
          }}
        >
          <CircularProgress 
            size={40} 
            sx={{ 
              color: '#10B981',
              filter: 'drop-shadow(0 2px 8px rgba(16, 185, 129, 0.3))'
            }} 
          />
        </Box>

        {/* Loading Text */}
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 700,
            mb: 2,
            color: 'rgba(0, 0, 0, 0.9)',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            '@media (max-width: 600px)': {
              fontSize: '1.5rem'
            }
          }}
        >
          กำลังเชื่อมต่อ...
        </Typography>

        {/* Loading Message */}
        <Typography 
          sx={{ 
            color: 'rgba(0, 0, 0, 0.7)',
            mb: 2,
            lineHeight: 1.6,
            fontSize: '1.1rem',
            '@media (max-width: 600px)': {
              fontSize: '1rem'
            }
          }}
        >
          กำลังนำท่านไปยังร้านอาหาร<br />
          กรุณารอสักครู่...
        </Typography>

        {/* Help Text */}
        <Typography 
          sx={{ 
            color: 'rgba(0, 0, 0, 0.5)',
            fontSize: '0.9rem',
            fontStyle: 'italic'
          }}
        >
          หากใช้เวลานานกว่าปกติ กรุณาลองรีเฟรชหน้านี้
        </Typography>
      </Card>
    </Box>
  );
}

// Loading fallback component
function LiffLandingLoading() {
  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      p: 3
    }}>
      <Card
        sx={{
          maxWidth: 500,
          width: '100%',
          background: 'rgba(255, 255, 255, 0.25)',
          backdropFilter: 'blur(20px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          borderRadius: 4,
          boxShadow: '0 8px 32px rgba(31, 38, 135, 0.15)',
          p: 5,
          textAlign: 'center',
        }}
      >
        <CircularProgress size={40} sx={{ mb: 2, color: '#10B981' }} />
        <Typography variant="body2" color="text.secondary">
          กำลังโหลด...
        </Typography>
      </Card>
    </Box>
  );
}

// Main component ที่ห่อด้วย Suspense
export default function LiffLandingPage() {
  return (
    <Suspense fallback={<LiffLandingLoading />}>
      <LiffLandingContent />
    </Suspense>
  );
} 