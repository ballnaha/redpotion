'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button,
  Alert,
  Container,
  CircularProgress
} from '@mui/material'
import Image from 'next/image'

interface LineUser {
  id: string
  name: string
  email: string
  role: string
  image?: string
  lineUserId: string
}

// Component ที่ใช้ useSearchParams ต้องอยู่ใน Suspense boundary
function LineSignInContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checkingSession, setCheckingSession] = useState(true)
  const [lineUser, setLineUser] = useState<LineUser | null>(null)
  const [loadingMessage, setLoadingMessage] = useState('ตรวจสอบสถานะการเข้าสู่ระบบ...')
  const [autoLoginAttempted, setAutoLoginAttempted] = useState(false)

  const restaurantId = searchParams.get('restaurant')
  const isRequired = searchParams.get('required') === 'true'
  const errorType = searchParams.get('error')

  // Load LIFF SDK
  useEffect(() => {
    const loadLiffSdk = () => {
      // ตรวจสอบว่ามี LIFF SDK หรือยัง
      if (window.liff) {
        console.log('✅ LIFF SDK already loaded');
        return;
      }

      // โหลด LIFF SDK
      const script = document.createElement('script');
      script.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js';
      script.async = true;
      script.onload = () => {
        console.log('✅ LIFF SDK loaded successfully');
      };
      script.onerror = () => {
        console.error('❌ Failed to load LIFF SDK');
      };
      document.head.appendChild(script);
    };

    loadLiffSdk();
  }, []);

  // ตรวจสอบ LINE session
  useEffect(() => {
    checkLineSession()
  }, [])

  // Auto login effect สำหรับ LIFF environment
  useEffect(() => {
    const attemptAutoLogin = async () => {
      if (autoLoginAttempted || checkingSession) return;
      
      // รอให้ LIFF SDK โหลดก่อน
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (typeof window !== 'undefined' && (window as any).liff && !lineUser) {
        try {
          setLoadingMessage('ตรวจสอบ LIFF environment...');
          
          const liffId = process.env.NEXT_PUBLIC_LIFF_ID || '2007609360-3Z0L8Ekg';
          
          // ลองเรียก init
          try {
            await (window as any).liff.init({ liffId });
          } catch (initError) {
            if (!(initError instanceof Error && initError.message.includes('already initialized'))) {
              throw initError;
            }
          }
          
          if ((window as any).liff.isLoggedIn()) {
            setLoadingMessage('พบ LINE session, กำลังเข้าสู่ระบบ...');
            setAutoLoginAttempted(true);
            await handleLineSignIn();
          } else {
            setLoadingMessage('กำลังเตรียม LINE login...');
            setAutoLoginAttempted(true);
          }
        } catch (error) {
          console.log('⚠️ Auto login failed:', error);
          setAutoLoginAttempted(true);
        }
      } else {
        setAutoLoginAttempted(true);
      }
    };

    attemptAutoLogin();
  }, [checkingSession, lineUser, autoLoginAttempted]);

  const checkLineSession = async () => {
    try {
      console.log('🔍 Checking LINE session in line-signin page');
      const response = await fetch('/api/auth/line-session')
      if (response.ok) {
        const data = await response.json()
        if (data.authenticated && data.user) {
          console.log('✅ LINE user already authenticated:', data.user.name)
          setLineUser(data.user)
          // เพิ่ม delay และแสดง success state ก่อน redirect
          setTimeout(async () => {
            // Redirect ตาม context
            if (restaurantId) {
              console.log('🏪 Already authenticated, redirecting to restaurant menu:', restaurantId)
              window.location.href = `/menu/${restaurantId}?from=line-signin`
            } else {
              console.log('🏠 Redirecting to home')
              window.location.href = '/'
            }
          }, 1500); // เพิ่ม delay เป็น 1.5 วินาที
          return
        }
      } else if (response.status === 401) {
        // ถ้า session backend ไม่มี (401) ให้เช็ค LIFF login
        if (typeof window !== 'undefined' && (window as any).liff && (window as any).liff.isLoggedIn && (window as any).liff.isLoggedIn()) {
          console.log('🔄 No backend session but LIFF is logged in, auto re-login backend...');
          await handleLineSignIn();
          return;
        }
      }
      console.log('ℹ️ No existing LINE session, staying on signin page');
    } catch (error) {
      console.log('ℹ️ No existing LINE session (error):', error)
    }
    setCheckingSession(false)
  }

  const handleLineSignIn = async () => {
    setLoading(true)
    setError('')

    try {
      console.log('📱 Starting LINE login via LIFF...')
      
      // ฟังก์ชันรอให้ LIFF SDK โหลดเสร็จ - ปรับปรุงให้เสถียรขึ้น
      const waitForLiff = () => {
        return new Promise<void>((resolve, reject) => {
          if (typeof window !== 'undefined' && window.liff) {
            console.log('✅ LIFF SDK already available')
            resolve();
            return;
          }

          let attempts = 0;
          const maxAttempts = 100; // เพิ่มเป็น 10 วินาที
          const checkInterval = setInterval(() => {
            attempts++;
            console.log(`🔄 Checking LIFF SDK... attempt ${attempts}/${maxAttempts}`)
            
            if (typeof window !== 'undefined' && window.liff) {
              console.log('✅ LIFF SDK loaded successfully')
              clearInterval(checkInterval);
              resolve();
            } else if (attempts >= maxAttempts) {
              console.error('❌ LIFF SDK timeout after', maxAttempts * 100, 'ms')
              clearInterval(checkInterval);
              reject(new Error('LIFF SDK not loaded within timeout'));
            }
          }, 100);
        });
      };

      await waitForLiff();
      
      // ตรวจสอบว่าอยู่ใน LIFF environment หรือไม่
      if (typeof window !== 'undefined' && window.liff) {
        console.log('🔄 Initializing LIFF...')
        
        const liffId = process.env.NEXT_PUBLIC_LIFF_ID || '2007609360-3Z0L8Ekg';

        if (!liffId) {
          throw new Error('LIFF ID ไม่ได้ตั้งค่า กรุณาติดต่อผู้ดูแลระบบ')
        }

        // ฟังก์ชัน initialize LIFF ที่ปรับปรุงแล้ว
        const initializeLiff = async () => {
          try {
            await window.liff.init({ liffId })
            console.log('✅ LIFF initialized successfully')
            return true
          } catch (initError) {
            console.log('⚠️ LIFF init error:', initError)
            
            // ตรวจสอบว่าเป็น already initialized error หรือไม่
            if (initError instanceof Error && (
                initError.message.includes('already initialized') || 
                initError.message.includes('LIFF has already been initialized')
              )) {
              console.log('✅ LIFF already initialized, continuing...')
              return true
            }
            
            // ถ้าเป็น error อื่นๆ ให้ลองใหม่
            throw initError
          }
        }

        // ลองเรียก init พร้อม retry mechanism
        let initSuccess = false
        for (let i = 0; i < 3; i++) {
          try {
            await initializeLiff()
            initSuccess = true
            break
          } catch (initError) {
            console.log(`❌ LIFF init attempt ${i + 1} failed:`, initError)
            if (i === 2) throw initError // ถ้าครั้งสุดท้ายแล้วให้ throw error
            await new Promise(resolve => setTimeout(resolve, 1000)) // รอ 1 วินาทีก่อนลองใหม่
          }
        }

        if (!initSuccess) {
          throw new Error('ไม่สามารถเชื่อมต่อกับ LINE ได้')
        }

        // รอให้ LIFF ready
        await new Promise(resolve => setTimeout(resolve, 500));

        // ตรวจสอบสถานะ login
        let isLoggedIn = false;
        try {
          isLoggedIn = window.liff.isLoggedIn();
          console.log('🔍 LINE login status:', isLoggedIn)
        } catch (loginCheckError) {
          console.error('❌ Error checking login status:', loginCheckError);
          throw new Error('ไม่สามารถตรวจสอบสถานะการเข้าสู่ระบบได้')
        }

        if (!isLoggedIn) {
          console.log('🔐 User not logged in to LINE, redirecting to login...')
          try {
            window.liff.login()
          } catch (loginError) {
            console.error('❌ Error during LINE login:', loginError);
            throw new Error('ไม่สามารถเข้าสู่ระบบ LINE ได้')
          }
          return
        }

        console.log('✅ User logged in to LINE, getting access token...')
        let accessToken;
        try {
          accessToken = window.liff.getAccessToken()
          console.log('🎯 Access token obtained:', accessToken ? 'YES' : 'NO')
        } catch (tokenError) {
          console.error('❌ Error getting access token:', tokenError);
          throw new Error('ไม่สามารถดึงข้อมูลการยืนยันตัวตนได้')
        }

        if (!accessToken) {
          throw new Error('ไม่สามารถดึงข้อมูลการยืนยันตัวตนจาก LINE ได้')
        }

        console.log('🎯 Sending access token to backend...')

        // ส่งไปยัง backend
        const response = await fetch('/api/auth/line-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            accessToken: accessToken,
            restaurantId: restaurantId // ส่ง restaurantId ไปด้วย
          })
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error('❌ Backend response error:', response.status, errorText)
          throw new Error(`เซิร์ฟเวอร์ตอบกลับข้อผิดพลาด: ${response.status}`)
        }

        const data = await response.json()

        if (data.success) {
          console.log('✅ LINE login successful:', data.user.name)
          
          // ถ้าเป็น user ใหม่ ให้ redirect ไป role selection
          if (data.isNewUser) {
            console.log('👤 New user detected, redirecting to role selection')
            router.replace('/auth/role-selection')
            return
          }

          // ใช้ข้อมูลจาก API response เพื่อตัดสินใจ redirect
          if (data.shouldRedirectToRestaurant && data.restaurantId) {
            console.log('🏪 Redirecting to restaurant menu:', data.restaurantId)
            window.location.href = `/menu/${data.restaurantId}?from=line-signin`
          } else {
            console.log('🔄 Redirecting according to API response:', data.redirectUrl)
            window.location.href = data.redirectUrl
          }
        } else {
          console.error('❌ LINE login failed:', data.error)
          throw new Error(data.error || 'การเข้าสู่ระบบด้วย LINE ล้มเหลว')
        }
      } else {
        // ถ้าไม่อยู่ใน LINE environment
        console.log('⚠️ Not in LINE environment')
        throw new Error('กรุณาเปิดลิงก์นี้ในแอป LINE')
      }

    } catch (error) {
      console.error('❌ LINE signin error:', error)
      let errorMessage = 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'
      
      if (error instanceof Error) {
        if (error.message.includes('LIFF SDK not loaded')) {
          errorMessage = 'ไม่สามารถโหลด LINE SDK ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต'
        } else if (error.message.includes('timeout')) {
          errorMessage = 'การเชื่อมต่อหมดเวลา กรุณาลองใหม่อีกครั้ง'
        } else if (error.message.includes('LIFF ID')) {
          errorMessage = error.message
        } else if (error.message.includes('เซิร์ฟเวอร์')) {
          errorMessage = error.message
        } else {
          errorMessage = `เกิดข้อผิดพลาด: ${error.message}`
        }
      }
      
      setError(errorMessage)
    }

    setLoading(false)
  }

  // กำลังตรวจสอบ session
  if (checkingSession) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          py: 4 
        }}>
          <Card>
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <Box sx={{ mb: 3 }}>
                <Image src="/images/logo_trim.png" alt="logo" width={150} height={100} />
              </Box>
              
              <CircularProgress sx={{ mb: 2, color: '#06C755' }} />
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {loadingMessage}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                กรุณารอสักครู่...
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Container>
    )
  }

  // แสดงข้อมูล user ที่ล็อกอินแล้ว
  if (lineUser) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          py: 4 
        }}>
          <Card>
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <Box sx={{ mb: 3 }}>
                <Image src="/images/logo_trim.png" alt="logo" width={150} height={100} />
              </Box>
              
              <Alert severity="success" sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  เข้าสู่ระบบสำเร็จ!
                </Typography>
                <Typography>
                  ยินดีต้อนรับ {lineUser.name}
                </Typography>
              </Alert>
              
              <Typography variant="body2" color="text.secondary">
                กำลังนำท่านไปยังหน้าเมนู...
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Container>
    )
  }

  const getErrorMessage = (errorType: string | null) => {
    switch (errorType) {
      case 'auto_login_failed':
        return 'การเข้าสู่ระบบอัตโนมัติล้มเหลว กรุณาลองเข้าสู่ระบบใหม่'
      case 'auto_login_error':
        return 'เกิดข้อผิดพลาดในการเข้าสู่ระบบอัตโนมัติ กรุณาลองใหม่อีกครั้ง'
      case 'session_required':
        return 'จำเป็นต้องเข้าสู่ระบบด้วย LINE เพื่อดูเมนู'
      default:
        return null
    }
  }

  const errorMessage = getErrorMessage(errorType)

  return (
    <Container maxWidth="sm">
      <Box sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        py: 4 
      }}>
        <Card>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            {/* Logo */}
            <Box sx={{ mb: 3 }}>
              <Image src="/images/logo_trim.png" alt="logo" width={150} height={100} />
            </Box>

            {/* Title */}
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#06C755' }}>
              {isRequired ? 'จำเป็นต้องเข้าสู่ระบบ' : 'เข้าสู่ระบบด้วย LINE'}
            </Typography>

            {/* Required message */}
            {isRequired && (
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  กรุณาเข้าสู่ระบบด้วย LINE เพื่อดูเมนูและสั่งอาหาร
                </Typography>
              </Alert>
            )}

            {/* Error from URL parameters */}
            {errorMessage && (
              <Alert severity="warning" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  {errorMessage}
                </Typography>
              </Alert>
            )}

            {/* Error from component state */}
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  {error}
                </Typography>
              </Alert>
            )}

            {/* Description */}
            <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary' }}>
              {restaurantId 
                ? 'เข้าสู่ระบบเพื่อดูเมนูและสั่งอาหาร' 
                : 'เข้าสู่ระบบเพื่อใช้งานแอปพลิเคชัน'
              }
            </Typography>

            {/* Login Button */}
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={handleLineSignIn}
              disabled={loading}
              sx={{
                backgroundColor: '#06C755',
                color: 'white',
                py: 2,
                fontSize: '1.1rem',
                fontWeight: 'bold',
                '&:hover': {
                  backgroundColor: '#05B94C',
                },
                '&:disabled': {
                  backgroundColor: '#cccccc',
                }
              }}
            >
              {loading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={20} color="inherit" />
                  กำลังเข้าสู่ระบบ...
                </Box>
              ) : (
                'เข้าสู่ระบบด้วย LINE'
              )}
            </Button>

            {/* Help text */}
            <Typography variant="body2" sx={{ mt: 3, color: 'text.secondary' }}>
              หากมีปัญหาในการเข้าสู่ระบบ กรุณาตรวจสอบว่าเปิดลิงก์ในแอป LINE
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Container>
  )
}

// Loading fallback component
function LineSignInLoading() {
  return (
    <Container maxWidth="sm">
      <Box sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        py: 4 
      }}>
        <Card>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Box sx={{ mb: 3 }}>
              <Image src="/images/logo_trim.png" alt="logo" width={150} height={100} />
            </Box>
            
            <CircularProgress size={40} sx={{ mb: 2, color: '#06C755' }} />
            <Typography variant="body2" color="text.secondary">
              กำลังโหลด...
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Container>
  )
}

// Main component ที่ห่อด้วย Suspense
export default function LineSignInPage() {
  return (
    <Suspense fallback={<LineSignInLoading />}>
      <LineSignInContent />
    </Suspense>
  )
} 