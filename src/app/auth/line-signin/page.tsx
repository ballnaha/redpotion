'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button,
  Alert,
  Container
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

export default function LineSignInPage() {
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
          
          // เพิ่ม delay เล็กน้อยเพื่อให้ user เห็น success state
          setTimeout(() => {
            // Redirect ตาม context
            if (restaurantId) {
              console.log('🏪 Redirecting to restaurant menu:', restaurantId)
              router.replace(`/menu/${restaurantId}`)
            } else {
              console.log('🏠 Redirecting to home')
              router.replace('/')
            }
          }, 1000);
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
        
        const liffId = process.env.NODE_ENV === 'production' 
          ? process.env.NEXT_PUBLIC_LIFF_ID_PROD 
          : process.env.NEXT_PUBLIC_LIFF_ID_DEV || '2007609360-3Z0L8Ekg';

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
          setError('ไม่สามารถรับ Access Token จาก LINE ได้')
          setLoading(false)
          return
        }
        
        if (!accessToken) {
          setError('ไม่สามารถรับ Access Token จาก LINE ได้')
          setLoading(false)
          return
        }

        console.log('🔐 Sending access token to server...')
        const loginResponse = await fetch('/api/auth/line-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            accessToken,
            restaurantId
          })
        })

        const loginData = await loginResponse.json()

        if (loginResponse.ok && loginData.success) {
          console.log('✅ LINE login successful:', loginData.user.name)
          setLineUser(loginData.user)
          
          // Redirect ตาม redirectUrl จาก server
          setTimeout(() => {
            router.replace(loginData.redirectUrl)
          }, 1000)
        } else {
          console.error('❌ LINE login failed:', loginData.error)
          setError(loginData.error || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ')
        }
      } else {
        console.log('⚠️ Not in LIFF environment or LIFF SDK not available')
        
        // ตรวจสอบว่ามี LIFF SDK หรือไม่
        if (!window.liff) {
          setError('กรุณาเปิดหน้านี้ผ่าน LINE App หรือ LIFF URL')
          setLoading(false)
          return
        }
        
        // ถ้าไม่ได้อยู่ใน LIFF ให้ redirect ไป LIFF URL
        const liffId = process.env.NODE_ENV === 'production' 
          ? process.env.NEXT_PUBLIC_LIFF_ID_PROD 
          : process.env.NEXT_PUBLIC_LIFF_ID_DEV || '2007609360-3Z0L8Ekg'
        
        if (!liffId) {
          setError('LIFF ID ไม่ได้ตั้งค่า กรุณาติดต่อผู้ดูแลระบบ')
          setLoading(false)
          return
        }
        
        const liffUrl = `https://liff.line.me/${liffId}`
        const targetUrl = restaurantId 
          ? `${liffUrl}?restaurant=${restaurantId}`
          : liffUrl
          
        console.log('🔄 Redirecting to LIFF URL:', targetUrl)
        window.location.href = targetUrl
      }

    } catch (error) {
      console.error('❌ LINE login exception:', error)
      
      if (error instanceof Error && error.message.includes('LIFF SDK not loaded')) {
        setError('ไม่สามารถโหลด LINE SDK ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตและลองใหม่อีกครั้ง')
      } else {
        setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย LINE')
      }
    }

    setLoading(false)
  }

  // แสดง loading ขณะตรวจสอบ session
  if (checkingSession) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ mt: 8, mb: 4, textAlign: 'center' }}>
          <Card>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" gutterBottom>
                กำลังตรวจสอบสถานะ...
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Container>
    )
  }

  // แสดง success message ถ้า login แล้ว
  if (lineUser) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ mt: 8, mb: 4, textAlign: 'center' }}>
          <Card>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, justifyContent: 'center' }}>
                <Image src="/images/logo_trim.png" alt="logo" width={150} height={100} />
              </Box>
              <Typography variant="h6" gutterBottom>
                เข้าสู่ระบบด้วย LINE สำเร็จ
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                สวัสดี {lineUser.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                กำลังเปลี่ยนหน้า...
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, justifyContent: 'center' }}>
              <Image src="/images/logo_trim.png" alt="logo" width={150} height={100} />
            </Box>

            <Typography variant="h6" align="center" gutterBottom sx={{ fontWeight: '400', color: 'primary.main' }}>
              เดอะ เรด โพชั่น
            </Typography>

            <Typography variant="h5" align="center" gutterBottom sx={{ mt: 3, mb: 3 }}>
              {isRequired ? 'จำเป็นต้องเข้าสู่ระบบด้วย LINE' : 'เข้าสู่ระบบด้วย LINE'}
            </Typography>

            {isRequired && (
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  การเข้าถึงเมนูอาหารต้องใช้การเข้าสู่ระบบด้วย LINE เท่านั้น
                </Typography>
              </Alert>
            )}

            {errorType && (
              <Alert severity="warning" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  {errorType === 'session_check_failed' && 'ไม่สามารถตรวจสอบสถานะการเข้าสู่ระบบได้'}
                  {errorType === 'auto_login_failed' && 'การเข้าสู่ระบบอัตโนมัติล้มเหลว'}
                  {errorType === 'auto_login_error' && 'เกิดข้อผิดพลาดในการเข้าสู่ระบบอัตโนมัติ'}
                </Typography>
              </Alert>
            )}

            <Typography variant="body2" align="center" gutterBottom sx={{ mb: 3, color: 'text.secondary' }}>
              {isRequired 
                ? 'กรุณาเข้าสู่ระบบด้วย LINE เพื่อดูเมนูและสั่งอาหาร' 
                : (restaurantId ? 'เพื่อดูเมนูและสั่งอาหาร' : 'สำหรับลูกค้าและผู้ใช้งานทั่วไป')}
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
                {error}
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setError('')}
                  >
                    ลองอีกครั้ง
                  </Button>
                </Box>
              </Alert>
            )}

            <Button
              fullWidth
              variant="contained"
              onClick={handleLineSignIn}
              disabled={loading}
              sx={{ 
                mt: 3, 
                mb: 2,
                backgroundColor: '#00C300',
                '&:hover': {
                  backgroundColor: '#00A300'
                },
                '&:disabled': {
                  backgroundColor: '#cccccc'
                }
              }}
            >
              {loading ? 'กำลังเตรียม LINE...' : 'เข้าสู่ระบบด้วย LINE'}
            </Button>

            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                เป็นเจ้าของร้านอาหาร?
              </Typography>
              <Button 
                variant="outlined"
                fullWidth
                href="/auth/signin"
                sx={{ fontWeight: '400' }}
              >
                เข้าสู่ระบบสำหรับร้านอาหาร
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  )
} 