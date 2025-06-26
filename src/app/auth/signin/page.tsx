'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
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
import { Visibility, VisibilityOff, Restaurant, Email, Lock } from '@mui/icons-material'
import Link from 'next/link'
import Image from 'next/image'

export default function SignInPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Sign In Form
  const [signInData, setSignInData] = useState({
    email: '',
    password: ''
  })

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
        const session = await getSession()
        if (session?.user?.role === 'RESTAURANT_OWNER') {
          router.push('/restaurant')
        } else {
          router.push('/')
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
              ระบบจัดการร้านอาหาร
            </Typography>

            <Typography variant="h5" align="center" gutterBottom sx={{ mt: 3, mb: 3 }}>
              เข้าสู่ระบบ
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