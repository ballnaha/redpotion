'use client'

import { useState, useEffect } from 'react'
import { signIn, getSession, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Container,
  InputAdornment,
  IconButton,
  Divider,
  Skeleton,
} from '@mui/material'
import { Visibility, VisibilityOff, Restaurant, Email, Lock } from '@mui/icons-material'
import Link from 'next/link'
import Image from 'next/image'

export default function SignInPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const { data: session, status } = useSession()

  // Sign In Form
  const [signInData, setSignInData] = useState({
    email: '',
    password: ''
  })

  // Handle URL error parameters
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const urlError = urlParams.get('error')
      
      if (urlError) {
        let errorMessage = ''
        switch (urlError) {
          case 'OAuthCallback':
            errorMessage = 'เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย LINE (OAuth Callback Error)'
            break
          case 'OAuthCreateAccount':
            errorMessage = 'ไม่สามารถสร้างบัญชีผู้ใช้ LINE ได้ กรุณาลองใหม่อีกครั้ง'
            break
          case 'line':
            errorMessage = 'เกิดข้อผิดพลาดในการเชื่อมต่อกับ LINE'
            break
          default:
            errorMessage = `เกิดข้อผิดพลาดในการเข้าสู่ระบบ: ${urlError}`
        }
        setError(errorMessage)
      }
    }
  }, [])

  // Handle redirect for already authenticated users (only if no error in URL)
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      // ตรวจสอบว่ามี error parameter ใน URL หรือไม่
      const urlParams = new URLSearchParams(window.location.search)
      const urlError = urlParams.get('error')
      const callbackUrl = urlParams.get('callbackUrl')
      
      // ถ้าไม่มี error ใน URL ให้ redirect
      if (!urlError) {
        console.log('🔄 User already authenticated, redirecting...', {
          role: session.user.role,
          callbackUrl: callbackUrl
        })
        
        // เพิ่ม delay เล็กน้อยเพื่อให้ UI แสดงข้อความ loading
        const timer = setTimeout(async () => {
          // ตรวจสอบว่ามีร้านอาหารก่อนจะ redirect
          if (callbackUrl && session.user.role === 'RESTAURANT_OWNER') {
            const decodedUrl = decodeURIComponent(callbackUrl)
            
            // ถ้า callback ไปหน้า restaurant ให้ตรวจสอบว่ามีร้านอาหารหรือไม่
            if (decodedUrl.includes('/restaurant')) {
              try {
                const response = await fetch('/api/restaurant/default')
                if (!response.ok) {
                  console.log('⚠️ No restaurants available, redirecting to home instead')
                  window.location.href = '/'
                  return
                }
              } catch (error) {
                console.log('⚠️ Error checking restaurants, redirecting to home')
                window.location.href = '/'
                return
              }
            }
            
            console.log('🔄 Redirecting to callbackUrl:', decodedUrl)
            window.location.href = decodedUrl
            return
          }
          
          // ไม่เช่นนั้นให้ redirect ตาม role ปกติ
          if (session.user.role === 'RESTAURANT_OWNER') {
            // ตรวจสอบว่ามีร้านอาหารก่อน
            try {
              const response = await fetch('/api/restaurant/default')
              if (response.ok) {
                window.location.href = '/restaurant'
              } else {
                console.log('⚠️ No restaurants available for restaurant owner, redirecting to home')
                window.location.href = '/'
              }
            } catch (error) {
              console.log('⚠️ Error checking restaurants, redirecting to home')
              window.location.href = '/'
            }
          } else if (session.user.role === 'ADMIN') {
            window.location.href = '/admin'
          } else if (session.user.role === 'USER') {
            window.location.href = '/auth/role-selection'
          } else {
            window.location.href = '/'
          }
        }, 1500)
        
        return () => clearTimeout(timer)
      }
      // ถ้ามี error ให้อยู่ในหน้า signin เพื่อแสดง error message
    }
  }, [status, session, router])

  // Show loading skeleton while checking authentication
  if (status === 'loading') {
    return (
      <Container maxWidth="sm">
        <Box sx={{ mt: 8, mb: 4 }}>
          <Card>
            <CardContent sx={{ p: 4 }}>
              <Skeleton variant="rectangular" width="100%" height={100} sx={{ mb: 3 }} />
              <Skeleton variant="text" width="60%" height={40} sx={{ mb: 2 }} />
              <Skeleton variant="text" width="40%" height={60} sx={{ mb: 3 }} />
              <Skeleton variant="rectangular" width="100%" height={56} sx={{ mb: 2 }} />
              <Skeleton variant="rectangular" width="100%" height={56} sx={{ mb: 3 }} />
              <Skeleton variant="rectangular" width="100%" height={48} />
            </CardContent>
          </Card>
        </Box>
      </Container>
    )
  }

  // Don't render signin form if already authenticated (unless there's an error)
  if (status === 'authenticated') {
    const urlParams = new URLSearchParams(window.location.search)
    const urlError = urlParams.get('error')
    
    // ถ้าไม่มี error ให้แสดง loading และ redirect
    if (!urlError) {
      return (
        <Container maxWidth="sm">
          <Box sx={{ mt: 8, mb: 4, textAlign: 'center' }}>
            <Card>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, justifyContent: 'center' }}>
                  <Image src="/images/logo_trim.png" alt="logo" width={150} height={100} />
                </Box>
                <Typography variant="h6" gutterBottom>
                  คุณเข้าสู่ระบบแล้ว
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  กำลังตรวจสอบข้อมูลและนำทางไปยังหน้าที่เหมาะสม...
                </Typography>
                <Box sx={{ mt: 3 }}>
                  <Skeleton variant="rectangular" width="100%" height={4} />
                </Box>
                
                {/* Manual override buttons */}
                <Box sx={{ mt: 3, display: 'flex', gap: 1, justifyContent: 'center' }}>
                  <Button 
                    size="small" 
                    variant="outlined" 
                    href="/"
                    sx={{ fontSize: '0.75rem' }}
                  >
                    หน้าหลัก
                  </Button>
                  {session?.user?.role === 'RESTAURANT_OWNER' && (
                    <Button 
                      size="small" 
                      variant="outlined" 
                      href="/restaurant"
                      sx={{ fontSize: '0.75rem' }}
                    >
                      จัดการร้าน
                    </Button>
                  )}
                  {session?.user?.role === 'ADMIN' && (
                    <Button 
                      size="small" 
                      variant="outlined" 
                      href="/admin"
                      sx={{ fontSize: '0.75rem' }}
                    >
                      Admin
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Container>
      )
    }
    // ถ้ามี error ให้แสดง form เพื่อให้ user เห็น error message
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // ตรวจสอบ callbackUrl จาก URL parameters
      const urlParams = new URLSearchParams(window.location.search)
      const callbackUrl = urlParams.get('callbackUrl')
      
      const result = await signIn('credentials', {
        email: signInData.email,
        password: signInData.password,
        callbackUrl: callbackUrl ? decodeURIComponent(callbackUrl) : undefined,
        redirect: false
      })

      if (result?.error) {
        setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
      } else if (result?.ok) {
        // ถ้าสำเร็จให้ redirect ตาม callbackUrl หรือ default
        if (callbackUrl) {
          console.log('🔄 Login success, redirecting to callbackUrl:', decodeURIComponent(callbackUrl))
          router.replace(decodeURIComponent(callbackUrl))
        } else {
          // ให้ useEffect จัดการ redirect ตาม role
          console.log('🔄 Login success, letting useEffect handle redirect')
        }
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ')
    }

    setLoading(false)
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
              เข้าสู่ระบบ
            </Typography>

            <Typography variant="body2" align="center" gutterBottom sx={{ mb: 3, color: 'text.secondary' }}>
              สำหรับเจ้าของร้านอาหารและผู้ดูแลระบบ
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
                {error}
                {status === 'authenticated' && (
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        // Clear error และ redirect ตาม callbackUrl หรือ role
                        const urlParams = new URLSearchParams(window.location.search)
                        const callbackUrl = urlParams.get('callbackUrl')
                        urlParams.delete('error')
                        const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '')
                        window.history.replaceState({}, '', newUrl)
                        
                        // ถ้ามี callbackUrl และเป็น restaurant owner ให้ไปที่นั่น
                        if (callbackUrl && session?.user?.role === 'RESTAURANT_OWNER') {
                          router.replace(decodeURIComponent(callbackUrl))
                        } else if (session?.user?.role === 'RESTAURANT_OWNER') {
                          router.replace('/restaurant')
                        } else if (session?.user?.role === 'ADMIN') {
                          router.replace('/admin')
                        } else if (session?.user?.role === 'USER') {
                          router.replace('/auth/role-selection')
                        } else {
                          router.replace('/')
                        }
                      }}
                    >
                      ไปยังหน้าหลัก
                    </Button>
                  </Box>
                )}
              </Alert>
            )}

            <form onSubmit={handleSignIn}>
              <TextField
                fullWidth
                label="อีเมล"
                type="email"
                value={signInData.email}
                onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                required
                margin="normal"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                fullWidth
                label="รหัสผ่าน"
                type={showPassword ? 'text' : 'password'}
                value={signInData.password}
                onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                required
                margin="normal"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
              >
                {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
              </Button>

              <Button
                fullWidth
                variant="text"
                href="/"
                sx={{ mb: 2 }}
              >
                กลับหน้าหลัก
              </Button>
            </form>



            <Divider sx={{ my: 2 }}>
              <Typography variant="body2" color="text.secondary">
                สำหรับเจ้าของร้าน
              </Typography>
            </Divider>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body1" gutterBottom>
                ยังไม่มีบัญชี?
              </Typography>
              <Link href="/auth/register/restaurant" style={{ textDecoration: 'none' }}>
                <Button 
                  variant="outlined"
                  fullWidth
                  sx={{ mt: 1, fontWeight: '400' }}
                >
                  สมัครเป็นพาร์ทเนอร์ร้านอาหาร
                </Button>
              </Link>

              {/* Demo Account Info */}
              <Box sx={{ mt: 3, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="caption" display="block" gutterBottom sx={{ fontWeight: 'bold' }}>
                  บัญชีทดสอบ:
                </Typography>
                <Typography variant="caption" display="block" sx={{ color: 'text.secondary' }}>
                  Email: owner@redpotion.com
                </Typography>
                <Typography variant="caption" display="block" sx={{ color: 'text.secondary' }}>
                  Password: password123
                </Typography>
              </Box>
              
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  )
} 