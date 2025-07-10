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
        
        // ตรวจสอบ LIFF session ที่เก็บไว้ก่อน
        const { restoreLiffSession } = await import('@/lib/sessionUtils');
        const sessionRestore = await restoreLiffSession();
        
        if (sessionRestore.success && sessionRestore.sessionData) {
          console.log('✅ LIFF session restored from storage');
          setLoadingMessage('กู้คืน session สำเร็จ กำลังเข้าสู่เมนู...');
          
          const restaurantId = searchParams.get('restaurant') || sessionRestore.sessionData.restaurantId;
          
          if (restaurantId) {
            // Immediate redirect for faster loading
            window.location.href = `/menu/${restaurantId}?from=liff-restore`;
          } else {
            window.location.href = '/';
          }
          return;
        }
        
        // ตรวจสอบ backend session ก่อนทำ LIFF login ใหม่
        console.log('🔄 Checking backend session before LIFF login...');
        try {
          const sessionResponse = await fetch('/api/auth/line-session');
          const sessionData = await sessionResponse.json();
          
          if (sessionResponse.ok && sessionData.authenticated && sessionData.user) {
            console.log('✅ Backend session valid, redirecting...');
            setLoadingMessage('พบ session ที่ใช้งานได้ กำลังเข้าสู่เมนู...');
            
            const restaurantId = searchParams.get('restaurant') || sessionData.restaurantId;
            if (restaurantId) {
              window.location.href = `/menu/${restaurantId}?from=session-valid`;
            } else {
              window.location.href = '/';
            }
            return;
          } else if (sessionResponse.status === 401) {
            console.log('❌ Backend session invalid (401), proceeding with fresh LIFF login...');
            
            // ตรวจสอบว่าเป็นกรณี user ถูกลบหรือไม่
            if (sessionData?.needsReAuth && sessionData?.reason === 'user_deleted') {
              console.log('🗑️ User was deleted from database, need fresh registration');
              setLoadingMessage('กำลังลงทะเบียนผู้ใช้ใหม่...');
              
              // Clear LIFF session storage
              try {
                const { clearLiffSession } = await import('@/lib/sessionUtils');
                clearLiffSession();
              } catch (clearError) {
                console.warn('⚠️ Failed to clear LIFF session:', clearError);
              }
            }
            
            // ถ้า session invalid (401) ให้ลบ cookies และทำ login ใหม่
            try {
              // ลบ session cookies
              document.cookie.split(';').forEach(cookie => {
                const eqPos = cookie.indexOf('=');
                const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
                if (name.includes('line-session') || name.includes('next-auth') || name.includes('LIFF_STORE')) {
                  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
                  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
                }
              });
              console.log('🗑️ Cleared stale cookies');
            } catch (cookieError) {
              console.warn('⚠️ Failed to clear cookies:', cookieError);
            }
          }
        } catch (sessionCheckError) {
          console.log('⚠️ Session check failed, continuing with LIFF login:', sessionCheckError);
        }
        
        // ถ้าไม่มี session หรือ session หมดอายุ ให้ทำ LIFF login ปกติ
        console.log('🔄 No valid session found, proceeding with LIFF login...');
        
        // ใช้ liffLoader ที่ปรับปรุงแล้ว
        const { ensureLiffSDKLoaded } = await import('@/lib/liffLoader');
        setLoadingMessage('เชื่อมต่อกับ LINE SDK...');
        
        const loadResult = await ensureLiffSDKLoaded(3);
        if (!loadResult.success) {
          console.error('❌ LIFF SDK loading failed:', loadResult.error);
          setError('sdk_error');
          setIsLoading(false);
          return;
        }
        
        setLoadingMessage('เชื่อมต่อกับ LINE...');
        
        // Initialize LIFF
        const { getValidatedLiffId } = await import('@/lib/liffUtils');
        const { liffId, error: liffError } = getValidatedLiffId();
        
        if (!liffId) {
          console.error('❌ Invalid LIFF configuration:', liffError);
          setError('invalid_config');
          setIsLoading(false);
          return;
        }
        
        // ใช้ smart LIFF initialization
        const { smartInitializeLiff } = await import('@/lib/liffLoader');
        const initResult = await smartInitializeLiff(liffId, 3);
        
        if (!initResult.success) {
          console.error('❌ LIFF initialization failed:', initResult.error);
          
          if (initResult.error?.includes('Invalid LIFF ID')) {
            setError('invalid_liff_id');
          } else if (initResult.error?.includes('Network error')) {
            setError('network_error');
          } else {
            setError('liff_init_failed');
          }
          setIsLoading(false);
          return;
        }
        
        console.log('✅ LIFF initialized successfully');
        setLiffReady(true);
        
        // ตรวจสอบสถานะการล็อกอิน
        if (!window.liff.isLoggedIn()) {
          setLoadingMessage('กำลังเข้าสู่ระบบ LINE...');
          console.log('🔐 Auto login to LINE...');
          
          // Auto login โดยไม่ต้องให้ user กด
          window.liff.login();
          return;
        } else {
          setLoadingMessage('ตรวจสอบสิทธิ์การเข้าใช้...');
          console.log('✅ Already logged in to LINE');
          
          // ดำเนินการ authentication กับ backend
          await handleLineAuthentication();
        }
      } catch (error) {
        console.error('❌ LIFF initialization error:', error);
        
        // จัดการ error แต่ละประเภท
        if (error instanceof Error) {
          if (error.message.includes('timeout')) {
            setError('connection_timeout');
          } else if (error.message.includes('Failed to load LIFF SDK')) {
            setError('sdk_error');
          } else if (error.message.includes('initialization failed')) {
            setError('init_failed');
          } else {
            setError('connection_error');
          }
        } else {
          setError('connection_error');
        }
        
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
      
      // เพิ่มการตรวจสอบ accessToken ก่อนส่ง request
      if (!accessToken) {
        console.error('❌ No access token available from LIFF');
        setError('auth_error');
        setIsLoading(false);
        return;
      }

      if (typeof accessToken !== 'string' || accessToken.trim() === '') {
        console.error('❌ Invalid access token format:', typeof accessToken, accessToken?.length);
        setError('auth_error');
        setIsLoading(false);
        return;
      }
      
      console.log('🎯 Sending LINE token to backend...', { 
        restaurantId,
        hasAccessToken: !!accessToken,
        accessTokenLength: accessToken?.length,
        accessTokenStart: accessToken?.substring(0, 20) + '...'
      });
      
      // ตรวจจับ platform จาก LIFF SDK
      let detectedPlatform = 'BROWSER';
      try {
        if (window.liff && typeof window.liff.getOS === 'function') {
          const liffOS = window.liff.getOS();
          if (liffOS === 'ios') detectedPlatform = 'IOS';
          else if (liffOS === 'android') detectedPlatform = 'ANDROID';
          else detectedPlatform = 'BROWSER';
          console.log('📱 Detected platform from LIFF:', liffOS, '→', detectedPlatform);
        }
      } catch (platformError) {
        console.warn('⚠️ Could not detect platform from LIFF:', platformError);
      }
      
      const requestData = {
        accessToken: accessToken,
        restaurantId: restaurantId,
        platform: detectedPlatform
      };
      
      // เพิ่มการตรวจสอบ request data ก่อนส่ง
      if (!requestData.accessToken) {
        console.error('❌ accessToken is missing in request data');
        setError('auth_error');
        setIsLoading(false);
        return;
      }
      
      console.log('📦 Request data being sent:', {
        hasAccessToken: !!requestData.accessToken,
        accessTokenType: typeof requestData.accessToken,
        restaurantId: requestData.restaurantId,
        platform: requestData.platform,
        requestSize: JSON.stringify(requestData).length
      });

      const response = await fetch('/api/auth/line-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      console.log('📡 Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      let data;
      try {
        data = await response.json();
        console.log('📄 Response data:', data);
      } catch (parseError) {
        console.error('❌ Failed to parse response JSON:', parseError);
        const textResponse = await response.text();
        console.error('📄 Raw response text:', textResponse);
        throw new Error('Server returned invalid JSON response');
      }

      if (response.ok && data.success) {
        console.log('✅ LINE authentication successful:', data.user.name);
        
        // แสดงข้อความที่เหมาะสมเมื่อมีการอัพเดทโปรไฟล์
        if (data.profileUpdated) {
          console.log('📸 Profile updated:', {
            name: data.user.name,
            image: data.user.image
          });
        }
        
        // บันทึก LIFF session เพื่อป้องกันการหลุดเมื่อ refresh
        try {
          const { saveLiffSession } = await import('@/lib/sessionUtils');
          const userProfile = (window as any).liff.getProfile ? await (window as any).liff.getProfile() : data.user;
          saveLiffSession(accessToken, userProfile, restaurantId || undefined);
        } catch (sessionError) {
          console.warn('⚠️ Failed to save LIFF session:', sessionError);
        }
        
        if (data.isNewUser) {
          // ถ้าเป็น user ใหม่จาก iOS/Android ให้ redirect ไปเมนูโดยตรง
          if (detectedPlatform === 'IOS' || detectedPlatform === 'ANDROID') {
            setLoadingMessage('ผู้ใช้ใหม่! กำลังเข้าสู่เมนู...');
            console.log('📱 New mobile user detected, skipping role selection');
            
            if (data.shouldRedirectToRestaurant && data.restaurantId) {
              setTimeout(() => {
                window.location.href = `/menu/${data.restaurantId}?from=mobile-new-user`;
              }, 1000);
              return;
            } else {
              // ถ้าไม่มี restaurant ให้หาร้าน default
              setTimeout(async () => {
                try {
                  const response = await fetch('/api/restaurant/default');
                  if (response.ok) {
                    const defaultRestaurant = await response.json();
                    window.location.href = `/menu/${defaultRestaurant.restaurantId}?from=mobile-new-user`;
                  } else {
                    window.location.href = '/';
                  }
                } catch (error) {
                  console.error('❌ Failed to get default restaurant:', error);
                  window.location.href = '/';
                }
              }, 1000);
              return;
            }
          } else {
            // สำหรับ Browser ให้ไป role selection แบบเดิม
            setLoadingMessage('ผู้ใช้ใหม่! กำลังตั้งค่าบัญชี...');
            console.log('👤 New browser user detected, redirecting to role selection');
            
            setTimeout(() => {
              window.location.href = '/auth/role-selection';
            }, 1500);
            return;
          }
        }

        if (data.shouldRedirectToRestaurant && data.restaurantId) {
          setLoadingMessage(`กำลังเข้าสู่เมนูร้านอาหาร...`);
          console.log('🏪 Redirecting to restaurant menu:', data.restaurantId);
          
          // Fast redirect for better UX
          window.location.href = `/menu/${data.restaurantId}?from=liff-auto-login`;
        } else {
          setLoadingMessage('เข้าสู่ระบบสำเร็จ!');
          window.location.href = data.redirectUrl;
        }
      } else {
        // จัดการ error cases ต่าง ๆ
        if (response.status === 401) {
          console.error('❌ Authentication failed (401), invalid access token');
          // Access token หมดอายุหรือไม่ถูกต้อง ให้ logout และ login ใหม่
          try {
            if (window.liff && window.liff.logout) {
              console.log('🔄 Logging out from LIFF and retrying...');
              window.liff.logout();
              window.liff.login();
              return;
            }
          } catch (liffError) {
            console.warn('⚠️ LIFF logout failed:', liffError);
          }
          setError('auth_error');
        } else if (response.status === 400) {
          console.error('❌ Bad request (400):', data?.error);
          setError('auth_error');
        } else {
          console.error('❌ LINE authentication failed:', {
            status: response.status,
            error: data?.error,
            fullResponse: data
          });
          setError('auth_error');
        }
        setIsLoading(false);
      }
    } catch (error) {
      console.error('❌ Authentication error:', error);
      setError('auth_error');
      setIsLoading(false);
    }
  };

  // Load LIFF SDK with preload optimization - เร็วขึ้นเพราะมี preload ใน layout แล้ว
  const loadLiffSdk = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      // ตรวจสอบว่า LIFF SDK โหลดแล้วหรือไม่
      if ((window as any).liff) {
        console.log('✅ LIFF SDK already available from preload');
        resolve();
        return;
      }

      // เช็คว่า script tag มีอยู่แล้วไหม (จาก layout)
      const existingScript = document.querySelector('script[src*="liff/edge/2/sdk.js"]');
      if (existingScript) {
        console.log('🔄 LIFF SDK script exists, waiting for load...');
        
        // รอให้ script ที่มีอยู่แล้วโหลดเสร็จ
        const checkLoaded = () => {
          if ((window as any).liff) {
            console.log('✅ LIFF SDK loaded from existing script');
            resolve();
          } else {
            setTimeout(checkLoaded, 100);
          }
        };
        
        setTimeout(() => {
          if (!(window as any).liff) {
            console.warn('⚠️ LIFF SDK timeout, loading manually');
            reject(new Error('LIFF SDK load timeout'));
          }
        }, 3000);
        
        checkLoaded();
        return;
      }

      // สร้าง script ใหม่ถ้าไม่มี
      console.log('📥 Loading LIFF SDK manually...');
      const script = document.createElement('script');
      script.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js';
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.onload = () => {
        console.log('✅ LIFF SDK loaded manually');
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

  // Loading State - ทำให้เรียบง่ายเพื่อลด loading หลายอัน
  if (isLoading && !error) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress 
            sx={{ 
              color: '#10B981',
              mb: 2
            }} 
            size={32}
          />
          <Typography 
            variant="body1" 
            sx={{ 
              color: '#111827',
              fontWeight: 500,
              fontSize: '1rem',
              mb: 0.5
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
        </Box>
      </Box>
    );
  }

  // Error State
  if (error) {
    const getErrorInfo = (errorType: string) => {
      switch (errorType) {
        case 'connection_timeout':
          return {
            title: 'การเชื่อมต่อหมดเวลา',
            message: 'ไม่สามารถเชื่อมต่อกับ LINE ได้ภายในเวลาที่กำหนด',
            suggestion: 'กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตและลองใหม่อีกครั้ง'
          };
        case 'init_failed':
          return {
            title: 'การเริ่มต้นระบบล้มเหลว',
            message: 'ไม่สามารถเริ่มต้นระบบ LINE ได้',
            suggestion: 'กรุณาปิดแอปและเปิดใหม่ หรือลองใหม่อีกครั้ง'
          };
        case 'sdk_error':
          return {
            title: 'ปัญหาการโหลดระบบ',
            message: 'ไม่สามารถโหลด LINE SDK ได้',
            suggestion: 'กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตและลองใหม่'
          };
        case 'auth_error':
          return {
            title: 'การยืนยันตัวตนล้มเหลว',
            message: 'ไม่สามารถยืนยันตัวตนกับระบบได้',
            suggestion: 'กรุณาลองออกจากระบบและเข้าใหม่อีกครั้ง'
          };
        case 'no_restaurant':
          return {
            title: 'ไม่พบข้อมูลร้านอาหาร',
            message: 'ไม่สามารถหาข้อมูลร้านอาหารได้',
            suggestion: 'กรุณาติดต่อเจ้าของร้านหรือลองใหม่อีกครั้ง'
          };
        case 'invalid_config':
          return {
            title: 'การตั้งค่า LIFF ไม่ถูกต้อง',
            message: 'ไม่สามารถตั้งค่า LIFF ได้',
            suggestion: 'กรุณาติดต่อเจ้าหน้าที่'
          };
        case 'invalid_liff_id':
          return {
            title: 'ID LIFF ไม่ถูกต้อง',
            message: 'ไม่สามารถตรวจสอบ ID LIFF',
            suggestion: 'กรุณาติดต่อเจ้าหน้าที่'
          };
        case 'network_error':
          return {
            title: 'ข้อผิดพลาดเครือข่าย',
            message: 'ไม่สามารถเชื่อมต่อกับระบบได้',
            suggestion: 'กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตและลองใหม่อีกครั้ง'
          };
        case 'liff_init_failed':
          return {
            title: 'การเริ่มต้น LIFF ล้มเหลว',
            message: 'ไม่สามารถเริ่มต้น LIFF ได้',
            suggestion: 'กรุณาลองใหม่อีกครั้ง'
          };
        default:
          return {
            title: 'เกิดข้อผิดพลาด',
            message: 'ไม่สามารถเชื่อมต่อกับระบบได้',
            suggestion: 'กรุณาลองใหม่อีกครั้ง หรือติดต่อเจ้าหน้าที่'
          };
      }
    };

    const errorInfo = getErrorInfo(error);

    return (
      <Box sx={{ 
        minHeight: '100vh', 
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3
      }}>
        <Card
          sx={{
            maxWidth: 500,
            width: '100%',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            borderRadius: 4,
            boxShadow: '0 8px 32px rgba(31, 38, 135, 0.15)',
            p: 5,
            textAlign: 'center',
          }}
        >
          <Box sx={{ mb: 3 }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'linear-gradient(45deg, #ff6b6b, #ee5a24)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                mb: 2
              }}
            >
              <Typography variant="h3" sx={{ color: 'white' }}>⚠️</Typography>
            </Box>
          </Box>
          
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#2c3e50' }}>
            {errorInfo?.title || 'เกิดข้อผิดพลาด'}
          </Typography>
          
          <Typography variant="body1" sx={{ mb: 2, color: '#34495e' }}>
            {errorInfo?.message || 'ไม่สามารถเชื่อมต่อได้'}
          </Typography>
          
          <Typography variant="body2" sx={{ mb: 4, color: '#7f8c8d' }}>
            {errorInfo?.suggestion || 'กรุณาลองใหม่อีกครั้ง'}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              onClick={() => window.location.reload()}
              sx={{
                background: '#10B981',
                color: 'white',
                px: 4,
                py: 1.5,
                borderRadius: 3,
                textTransform: 'none',
                fontWeight: 'bold',
                
              }}
            >
              ลองใหม่
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

// Loading fallback component - เรียบง่าย
function LiffLandingLoading() {
  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      p: 3
    }}>
      <Box sx={{ textAlign: 'center' }}>
        <CircularProgress size={32} sx={{ mb: 2, color: '#10B981' }} />
        <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '0.875rem' }}>
          กำลังโหลด...
        </Typography>
      </Box>
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