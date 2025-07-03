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
              console.log('🏪 Already authenticated, redirecting to restaurant menu in LIFF:', restaurantId)
              
              // ดึงข้อมูล LIFF ID ของร้านอาหาร
              try {
                const restaurantResponse = await fetch(`/api/restaurant/${restaurantId}/liff`)
                const restaurantData = await restaurantResponse.json()
                
                if (restaurantData.liffId) {
                  // สร้าง LIFF URL สำหรับเมนูร้านอาหาร (ไม่ต้องใส่ /menu/ ใน path เพราะ LIFF จะไป root)
                  const liffUrl = `https://liff.line.me/${restaurantData.liffId}?restaurant=${restaurantId}`
                  console.log('🔗 Opening LIFF URL with restaurant LIFF ID:', liffUrl)
                  window.location.href = liffUrl
                } else {
                  console.warn('⚠️ Restaurant LIFF ID not found, using default redirect')
                  window.location.href = `/menu/${restaurantId}`
                }
              } catch (liffError) {
                console.error('❌ Failed to get restaurant LIFF ID:', liffError)
                // Fallback ไปหน้าเมนูปกติ
                window.location.href = `/menu/${restaurantId}`
              }
            } else {
              console.log('🏠 Redirecting to home')
              window.location.href = '/'
            }
          }, 1500); // เพิ่ม delay เป็น 1.5 วินาที
          return
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
      
      // รอให้ LIFF SDK โหลดเสร็จ
      const waitForLiff = () => {
        return new Promise<void>((resolve, reject) => {
          if (typeof window !== 'undefined' && window.liff) {
            resolve();
            return;
          }

          let attempts = 0;
          const maxAttempts = 50; // รอสูงสุด 5 วินาที
          const checkInterval = setInterval(() => {
            attempts++;
            if (typeof window !== 'undefined' && window.liff) {
              clearInterval(checkInterval);
              resolve();
            } else if (attempts >= maxAttempts) {
              clearInterval(checkInterval);
              reject(new Error('LIFF SDK not loaded within timeout'));
            }
          }, 100);
        });
      };

      await waitForLiff();
      
      // Debug: แสดงข้อมูล LIFF object
      console.log('🔍 LIFF object available methods:', window.liff ? Object.getOwnPropertyNames(window.liff) : 'No LIFF');
      
      // ตรวจสอบว่าอยู่ใน LIFF environment หรือไม่
      if (typeof window !== 'undefined' && window.liff) {
        // Initialize LIFF แบบบังคับทุกครั้ง เพื่อให้แน่ใจ
        console.log('🔄 Initializing LIFF...')
        
        const liffId = process.env.NODE_ENV === 'development' 
          ? process.env.NEXT_PUBLIC_LIFF_ID 
          : process.env.NEXT_PUBLIC_LIFF_ID || '2007609360-3Z0L8Ekg';

        if (!liffId) {
          setError('LIFF ID ไม่ได้ตั้งค่า กรุณาติดต่อผู้ดูแลระบบ')
          setLoading(false)
          return
        }

        try {
          // ลองเรียก init โดยไม่สนใจว่า initialize แล้วหรือยัง
          await window.liff.init({ liffId })
          console.log('✅ LIFF initialized successfully')
          
          // รอเล็กน้อยให้ LIFF ready
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (initError) {
          console.error('❌ LIFF initialization failed:', initError)
          // ถ้า error เป็น already initialized ให้ผ่านไป
          if (initError instanceof Error && (
              initError.message.includes('already initialized') || 
              initError.message.includes('LIFF has already been initialized')
            )) {
            console.log('✅ LIFF already initialized, continuing...')
          } else {
            setError(`ไม่สามารถเชื่อมต่อกับ LINE ได้: ${initError instanceof Error ? initError.message : 'Unknown error'}`)
            setLoading(false)
            return
          }
        }

        // ตรวจสอบสถานะ login ด้วย try-catch
        let isLoggedIn = false;
        try {
          isLoggedIn = window.liff.isLoggedIn();
        } catch (loginCheckError) {
          console.error('❌ Error checking login status:', loginCheckError);
          setError('ไม่สามารถตรวจสอบสถานะการเข้าสู่ระบบได้')
          setLoading(false)
          return
        }

        if (!isLoggedIn) {
          console.log('🔐 User not logged in to LINE, redirecting to login...')
          try {
            window.liff.login()
          } catch (loginError) {
            console.error('❌ Error during LINE login:', loginError);
            setError('ไม่สามารถเข้าสู่ระบบ LINE ได้')
            setLoading(false)
          }
          return
        }

        console.log('✅ User logged in to LINE, getting access token...')
        let accessToken;
        try {
          accessToken = window.liff.getAccessToken()
        } catch (tokenError) {
          console.error('❌ Error getting access token:', tokenError);
          setError('ไม่สามารถดึงข้อมูลการยืนยันตัวตนได้')
          setLoading(false)
          return
        }

        if (!accessToken) {
          setError('ไม่สามารถดึงข้อมูลการยืนยันตัวตนจาก LINE ได้')
          setLoading(false)
          return
        }

        console.log('🎯 Access token obtained, sending to backend...')

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

        const data = await response.json()

        if (response.ok && data.success) {
          console.log('✅ LINE login successful:', data.user.name)
          
          // ถ้าเป็น user ใหม่ ให้ redirect ไป role selection
          if (data.isNewUser) {
            console.log('👤 New user detected, redirecting to role selection')
            router.replace('/auth/role-selection')
            return
          }

          // ใช้ข้อมูลจาก API response เพื่อตัดสินใจ redirect
          if (data.shouldRedirectToRestaurant && data.restaurantId) {
            console.log('🏪 Redirecting to restaurant menu in LIFF:', data.restaurantId)
            
            // ดึงข้อมูล LIFF ID ของร้านอาหาร
            try {
              const restaurantResponse = await fetch(`/api/restaurant/${data.restaurantId}/liff`)
              const restaurantData = await restaurantResponse.json()
              
              if (restaurantData.liffId) {
                // สร้าง LIFF URL สำหรับเมนูร้านอาหาร
                const liffUrl = `https://liff.line.me/${restaurantData.liffId}?restaurant=${data.restaurantId}`
                console.log('🔗 Opening LIFF URL with restaurant LIFF ID:', liffUrl)
                
                // เปิด URL ใน LINE app
                if (typeof window !== 'undefined' && window.liff) {
                  try {
                    window.liff.openWindow({
                      url: liffUrl,
                      external: false
                    })
                  } catch (openError) {
                    console.warn('⚠️ LIFF openWindow failed, using direct redirect:', openError)
                    window.location.href = liffUrl
                  }
                } else {
                  window.location.href = liffUrl
                }
              } else {
                console.warn('⚠️ Restaurant LIFF ID not found, using default redirect')
                router.replace(data.redirectUrl)
              }
            } catch (liffError) {
              console.error('❌ Failed to get restaurant LIFF ID:', liffError)
              // Fallback ตาม API response
              router.replace(data.redirectUrl)
            }
          } else {
            console.log('🔄 Redirecting according to API response:', data.redirectUrl)
            router.replace(data.redirectUrl)
          }
        } else {
          console.error('❌ LINE login failed:', data.error)
          setError(data.error || 'การเข้าสู่ระบบด้วย LINE ล้มเหลว')
        }
      } else {
        // ถ้าไม่อยู่ใน LINE environment
        console.log('⚠️ Not in LINE environment, showing manual instructions')
        setError('กรุณาเปิดลิงก์นี้ในแอป LINE')
      }

    } catch (error) {
      console.error('❌ LINE signin error:', error)
      if (error instanceof Error) {
        if (error.message.includes('LIFF SDK not loaded')) {
          setError('ไม่สามารถโหลด LINE SDK ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต')
        } else {
          setError(`เกิดข้อผิดพลาด: ${error.message}`)
        }
      } else {
        setError('เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ')
      }
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
              <Typography variant="body2" color="text.secondary">
                กำลังตรวจสอบสถานะการเข้าสู่ระบบ...
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