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
  CircularProgress,
} from '@mui/material'
import { Visibility, VisibilityOff, Restaurant, Email, Lock } from '@mui/icons-material'
import Link from 'next/link'
import Image from 'next/image'

export default function SignInPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [lineLoading, setLineLoading] = useState(false)
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
      
      // ถ้าไม่มี error ใน URL ให้ redirect ตาม role
      if (!urlError) {
        if (session.user.role === 'RESTAURANT_OWNER') {
          router.replace('/restaurant')
        } else if (session.user.role === 'ADMIN') {
          router.replace('/admin')
        } else {
          router.replace('/')
        }
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
    
    // ถ้าไม่มี error ให้ hide form
    if (!urlError) {
      return null
    }
    // ถ้ามี error ให้แสดง form เพื่อให้ user เห็น error message
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email: signInData.email,
        password: signInData.password,
        redirect: false
      })

      if (result?.error) {
        setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
      } else {
        // ให้ useEffect จัดการ redirect แทน
        // เพื่อป้องกันการ redirect ซ้ำซ้อน
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ')
    }

    setLoading(false)
  }

  const handleLineLogin = async () => {
    setLineLoading(true)
    setError('')
    
    try {
      console.log('🚀 Starting LINE login...')
      
      // ใช้ window.location เพื่อ redirect ไปยัง LINE OAuth URL โดยตรง
      const lineLoginUrl = `/api/auth/signin/line?callbackUrl=${encodeURIComponent('/menu/cmcg20f2i00029hu8p2am75df')}`
      console.log('🔗 Redirecting to:', lineLoginUrl)
      
      window.location.href = lineLoginUrl
      
      // ไม่ต้อง setLineLoading(false) เพราะจะ redirect ออกจากหน้านี้
    } catch (error) {
      console.error('❌ LINE login exception:', error)
      setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย LINE')
      setLineLoading(false)
    }
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
              ระบบจัดการร้านอาหาร
            </Typography>

            <Typography variant="h5" align="center" gutterBottom sx={{ mt: 3, mb: 3 }}>
              เข้าสู่ระบบ
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
                        // Clear error และ redirect ตาม role
                        const urlParams = new URLSearchParams(window.location.search)
                        urlParams.delete('error')
                        const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '')
                        window.history.replaceState({}, '', newUrl)
                        
                        if (session?.user?.role === 'RESTAURANT_OWNER') {
                          router.replace('/restaurant')
                        } else if (session?.user?.role === 'ADMIN') {
                          router.replace('/admin')
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
            </form>

            <Divider sx={{ my: 3 }}>
              <Typography variant="body2" color="text.secondary">
                หรือ
              </Typography>
            </Divider>

            {/* LINE Login Button */}
            <Button
              fullWidth
              variant="contained"
              onClick={handleLineLogin}
              disabled={lineLoading}
              sx={{
                mb: 2,
                backgroundColor: '#06C755',
                color: 'white',
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 500,
                '&:hover': {
                  backgroundColor: '#05B04A'
                },
                '&:disabled': {
                  backgroundColor: '#a0a0a0'
                },
                position: 'relative'
              }}
            >
              {lineLoading ? (
                <>
                  <CircularProgress size={20} sx={{ color: 'white', mr: 1 }} />
                  กำลังเชื่อมต่อ LINE...
                </>
              ) : (
                <>
                  📱 เข้าสู่ระบบด้วย LINE
                </>
              )}
            </Button>

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
              
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  )
} 