'use client'

import { useState, useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
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
} from '@mui/material'
import { Visibility, VisibilityOff, Email, Lock } from '@mui/icons-material'
import Image from 'next/image'

export default function SignInPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [signInData, setSignInData] = useState({
    email: '',
    password: ''
  })

  const router = useRouter()
  const { data: session, status } = useSession()

  // Handle URL error parameters
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const urlError = urlParams.get('error')
      
      if (urlError) {
        setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ')
      }
    }
  }, [])

  // Auto redirect สำหรับ authenticated users
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      console.log('👤 User already authenticated:', session.user.role)
      
      const urlParams = new URLSearchParams(window.location.search)
      const callbackUrl = urlParams.get('callbackUrl')
      
      if (callbackUrl) {
        const decodedUrl = decodeURIComponent(callbackUrl)
        console.log('🔄 Redirecting to callbackUrl:', decodedUrl)
        
        // แปลง production URL เป็น local path
        if (decodedUrl.includes('red.theredpotion.com')) {
          const url = new URL(decodedUrl)
          const localPath = url.pathname
          console.log('🔄 Converting to local path:', localPath)
          router.replace(localPath)
        } else {
          router.replace(decodedUrl)
        }
      } else {
        // Redirect ตาม role
        if (session.user.role === 'RESTAURANT_OWNER') {
          console.log('🏪 Redirecting restaurant owner to /restaurant')
          router.replace('/restaurant')
        } else if (session.user.role === 'ADMIN') {
          console.log('👑 Redirecting admin to /admin')
          router.replace('/admin')
        } else {
          console.log('🏠 Redirecting to home')
          router.replace('/')
        }
      }
    }
  }, [status, session, router])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      console.log('🔐 NextAuth signin started for:', signInData.email)

      const result = await signIn('credentials', {
        email: signInData.email,
        password: signInData.password,
        redirect: false
      })

      console.log('📋 NextAuth result:', result)

      if (result?.error) {
        console.error('❌ NextAuth error:', result.error)
        setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
        setLoading(false)
        return
      }

      if (result?.ok) {
        console.log('✅ NextAuth login successful!')
        // useEffect จะจัดการ redirect
      }

    } catch (error) {
      console.error('❌ NextAuth exception:', error)
      setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ')
      setLoading(false)
    }
  }

  // แสดง loading ขณะตรวจสอบ session
  if (status === 'loading') {
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

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                เป็นลูกค้า?
              </Typography>
              <Button 
                variant="outlined"
                fullWidth
                href="/auth/line-signin"
                sx={{ mb: 2, fontWeight: '400' }}
              >
                เข้าสู่ระบบด้วย LINE
              </Button>
              
              <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
                ยังไม่มีบัญชี?
              </Typography>
              <Button 
                variant="outlined"
                fullWidth
                href="/auth/register/restaurant"
                sx={{ fontWeight: '400' }}
              >
                สมัครเป็นพาร์ทเนอร์ร้านอาหาร
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  )
}
