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
  Tab,
  Tabs,
  InputAdornment,
  IconButton
} from '@mui/material'
import { Visibility, VisibilityOff, Restaurant, Email, Lock } from '@mui/icons-material'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  )
}

export default function SignInPage() {
  const [tab, setTab] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Sign In Form
  const [signInData, setSignInData] = useState({
    email: '',
    password: ''
  })

  // Sign Up Form
  const [signUpData, setSignUpData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    restaurantName: '',
    restaurantAddress: '',
    restaurantPhone: ''
  })

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTab(newValue)
    setError('')
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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (signUpData.password !== signUpData.confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: signUpData.name,
          email: signUpData.email,
          password: signUpData.password,
          restaurantName: signUpData.restaurantName,
          restaurantAddress: signUpData.restaurantAddress,
          restaurantPhone: signUpData.restaurantPhone
        }),
      })

      if (response.ok) {
        // Auto sign in after successful registration
        const result = await signIn('credentials', {
          email: signUpData.email,
          password: signUpData.password,
          redirect: false
        })

        if (result?.ok) {
          router.push('/restaurant')
        }
      } else {
        const data = await response.json()
        setError(data.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก')
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการสมัครสมาชิก')
    }

    setLoading(false)
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, justifyContent: 'center' }}>
              <Restaurant sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
              <Typography variant="h4" component="h1" color="primary.main">
                เดอะ เรด โพชั่น
              </Typography>
            </Box>

            <Typography variant="h6" align="center" gutterBottom>
              ระบบจัดการร้านอาหาร
            </Typography>

            <Tabs value={tab} onChange={handleTabChange} centered>
              <Tab label="เข้าสู่ระบบ" />
              <Tab label="สมัครสมาชิก" />
            </Tabs>

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}

            <TabPanel value={tab} index={0}>
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
            </TabPanel>

            <TabPanel value={tab} index={1}>
              <form onSubmit={handleSignUp}>
                <Typography variant="h6" gutterBottom>
                  ข้อมูลส่วนตัว
                </Typography>
                <TextField
                  fullWidth
                  label="ชื่อ-นามสกุล"
                  value={signUpData.name}
                  onChange={(e) => setSignUpData({ ...signUpData, name: e.target.value })}
                  required
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="อีเมล"
                  type="email"
                  value={signUpData.email}
                  onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                  required
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="รหัสผ่าน"
                  type="password"
                  value={signUpData.password}
                  onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                  required
                  margin="normal"
                  helperText="รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"
                />
                <TextField
                  fullWidth
                  label="ยืนยันรหัสผ่าน"
                  type="password"
                  value={signUpData.confirmPassword}
                  onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
                  required
                  margin="normal"
                />

                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                  ข้อมูลร้านอาหาร
                </Typography>
                <TextField
                  fullWidth
                  label="ชื่อร้าน"
                  value={signUpData.restaurantName}
                  onChange={(e) => setSignUpData({ ...signUpData, restaurantName: e.target.value })}
                  required
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="ที่อยู่ร้าน"
                  value={signUpData.restaurantAddress}
                  onChange={(e) => setSignUpData({ ...signUpData, restaurantAddress: e.target.value })}
                  required
                  margin="normal"
                  multiline
                  rows={3}
                />
                <TextField
                  fullWidth
                  label="เบอร์โทรศัพท์ร้าน"
                  value={signUpData.restaurantPhone}
                  onChange={(e) => setSignUpData({ ...signUpData, restaurantPhone: e.target.value })}
                  required
                  margin="normal"
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2 }}
                  disabled={loading}
                >
                  {loading ? 'กำลังสมัครสมาชิก...' : 'สมัครสมาชิก'}
                </Button>
              </form>
            </TabPanel>
          </CardContent>
        </Card>
      </Box>
    </Container>
  )
} 