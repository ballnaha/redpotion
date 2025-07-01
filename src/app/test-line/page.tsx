'use client'

import { useState, useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Container,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Divider,
} from '@mui/material'
import { PlayArrow, Science, CheckCircle, Error as ErrorIcon } from '@mui/icons-material'

export default function TestLinePage() {
  const [testResults, setTestResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [clientInfo, setClientInfo] = useState({
    currentUrl: 'Loading...',
    userAgent: 'Loading...',
    mounted: false
  })
  const { data: session, status } = useSession()

  useEffect(() => {
    // ป้องกัน hydration mismatch โดยการตั้งค่าข้อมูล client-side หลังจาก mount
    setClientInfo({
      currentUrl: window.location.href,
      userAgent: window.navigator.userAgent,
      mounted: true
    })
  }, [])

  const runTest = async (testName: string, testFunction: () => Promise<any>) => {
    setLoading(true)
    try {
      const result = await testFunction()
      setTestResults(prev => [...prev, {
        name: testName,
        status: 'success',
        data: result,
        timestamp: new Date().toLocaleTimeString()
      }])
    } catch (error) {
      setTestResults(prev => [...prev, {
        name: testName,
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toLocaleTimeString()
      }])
    }
    setLoading(false)
  }

  const testProviders = async () => {
    const response = await fetch('/api/auth/providers')
    const data = await response.json()
    return data
  }

  const testLineConfig = async () => {
    const config = {
      environment: process.env.NODE_ENV || 'Not found',
      liffId: process.env.NEXT_PUBLIC_LIFF_ID || 'Not found',
      hasClientId: !!process.env.NEXT_PUBLIC_LINE_CLIENT_ID,
      nextAuthUrl: typeof window !== 'undefined' ? window.location.origin : 'Server-side',
      expectedCallbackUrl: `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/api/auth/callback/line`,
      testLoginUrl: `/api/auth/signin/line?callbackUrl=${encodeURIComponent('/menu/cmcg20f2i00029hu8p2am75df')}`,
      timestamp: new Date().toISOString()
    }
    return config
  }

  const testSessionInfo = async () => {
    return {
      status,
      hasSession: !!session,
      user: session?.user || null,
      timestamp: new Date().toISOString()
    }
  }

  const testLineLogin = async () => {
    console.log('🚀 Testing LINE login...')
    
    // ทดสอบ direct redirect
    const lineLoginUrl = `/api/auth/signin/line?callbackUrl=${encodeURIComponent('/menu/cmcg20f2i00029hu8p2am75df')}`
    console.log('🔗 Generated LINE login URL:', lineLoginUrl)
    
    // แสดงผลลัพธ์การสร้าง URL แทนการ redirect จริง
    return {
      method: 'Direct redirect',
      url: lineLoginUrl,
      description: 'กดปุ่มนี้จะ redirect ไปหน้า LINE login โดยตรง',
      note: 'ในการทดสอบจริงจะใช้ window.location.href = lineLoginUrl'
    }
  }

  const clearResults = () => {
    setTestResults([])
  }

  const getIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle sx={{ color: 'success.main' }} />
      case 'error':
        return <ErrorIcon sx={{ color: 'error.main' }} />
      default:
        return <Science />
    }
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          🧪 LINE Login Test Suite
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          หน้านี้ใช้สำหรับทดสอบและ debug ปัญหา LINE Login
        </Typography>

        {/* Current Session Info */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              ข้อมูลเซสชันปัจจุบัน
            </Typography>
            <Typography variant="body2">
              Status: <strong>{status}</strong>
            </Typography>
            {session?.user && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2">
                  User: {session.user.name} ({session.user.email})
                </Typography>
                <Typography variant="body2">
                  Role: {session.user.role}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Test Controls */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              การทดสอบ
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
              <Button
                variant="contained"
                startIcon={<PlayArrow />}
                onClick={() => runTest('NextAuth Providers', testProviders)}
                disabled={loading}
              >
                ทดสอบ Providers
              </Button>

              <Button
                variant="contained"
                startIcon={<PlayArrow />}
                onClick={() => runTest('LINE Configuration', testLineConfig)}
                disabled={loading}
              >
                ทดสอบ LINE Config
              </Button>

              <Button
                variant="contained"
                startIcon={<PlayArrow />}
                onClick={() => runTest('Session Information', testSessionInfo)}
                disabled={loading}
              >
                ทดสอบ Session
              </Button>

              <Button
                variant="contained"
                color="warning"
                startIcon={<PlayArrow />}
                onClick={() => runTest('LINE Login Flow', testLineLogin)}
                disabled={loading}
              >
                ทดสอบ LINE Login (URL)
              </Button>

              <Button
                variant="contained"
                color="success"
                onClick={() => {
                  if (clientInfo.mounted) {
                    const lineLoginUrl = `/api/auth/signin/line?callbackUrl=${encodeURIComponent('/menu/cmcg20f2i00029hu8p2am75df')}`
                    console.log('🚀 Direct LINE login redirect to:', lineLoginUrl)
                    window.location.href = lineLoginUrl
                  }
                }}
                disabled={loading || !clientInfo.mounted}
              >
                🚀 ทดสอบ LINE Login จริง
              </Button>
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={clearResults}
                disabled={loading}
              >
                ล้างผลลัพธ์
              </Button>

              {loading && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={20} />
                  <Typography variant="body2">กำลังทดสอบ...</Typography>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>

        {/* Test Results */}
        {testResults.length > 0 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                ผลการทดสอบ
              </Typography>
              
              <List>
                {testResults.map((result, index) => (
                  <div key={index}>
                    <ListItem alignItems="flex-start" sx={{ flexDirection: 'column', alignItems: 'stretch' }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
                        <Box sx={{ mr: 2, mt: 0.5, flexShrink: 0 }}>
                          {getIcon(result.status)}
                        </Box>
                        <Box sx={{ flexGrow: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Typography variant="subtitle1">
                              {result.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {result.timestamp}
                            </Typography>
                          </Box>
                          
                          {result.status === 'error' ? (
                            <Alert severity="error" sx={{ mb: 1 }}>
                              <Typography variant="body2">
                                {result.error}
                              </Typography>
                            </Alert>
                          ) : (
                            <Alert severity="success" sx={{ mb: 1 }}>
                              <Typography variant="body2" component="pre" sx={{ 
                                whiteSpace: 'pre-wrap', 
                                fontSize: '0.875rem',
                                fontFamily: 'monospace' 
                              }}>
                                {JSON.stringify(result.data, null, 2)}
                              </Typography>
                            </Alert>
                          )}
                        </Box>
                      </Box>
                    </ListItem>
                    {index < testResults.length - 1 && <Divider />}
                  </div>
                ))}
              </List>
            </CardContent>
          </Card>
        )}

        {/* Environment Info */}
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              ข้อมูลสภาพแวดล้อม
            </Typography>
            {clientInfo.mounted ? (
              <Typography variant="body2" component="pre" sx={{ 
                backgroundColor: '#f5f5f5', 
                p: 2, 
                borderRadius: 1,
                fontSize: '0.875rem',
                fontFamily: 'monospace'
              }}>
{`NODE_ENV: ${process.env.NODE_ENV}
NEXT_PUBLIC_LIFF_ID: ${process.env.NEXT_PUBLIC_LIFF_ID || 'Not set'}
Current URL: ${clientInfo.currentUrl}
User Agent: ${clientInfo.userAgent.substring(0, 100)}...`}
              </Typography>
            ) : (
              <Alert severity="info">
                กำลังโหลดข้อมูลสภาพแวดล้อม...
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Debug Info for error=line */}
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              🐛 Debug Information สำหรับ error=line
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              หากพบ error=line ในขั้นตอน LINE Login ให้ตรวจสอบข้อมูลด้านล่าง
            </Alert>
            
            <Typography variant="subtitle2" gutterBottom>
              สาเหตุที่เป็นไปได้:
            </Typography>
            
            <Box component="ul" sx={{ pl: 2, mb: 2 }}>
              <Typography component="li" variant="body2">
                LINE Channel ไม่ได้ activate ใน LINE Developers Console
              </Typography>
              <Typography component="li" variant="body2">
                Callback URL ไม่ตรงกัน (ต้องเป็น: http://localhost:3000/api/auth/callback/line)
              </Typography>
              <Typography component="li" variant="body2">
                Channel ID หรือ Channel Secret ผิด
              </Typography>
              <Typography component="li" variant="body2">
                Environment variables ไม่โหลดถูกต้อง
              </Typography>
              <Typography component="li" variant="body2">
                Browser cache หรือ cookies ที่เก่า
              </Typography>
            </Box>

            <Typography variant="subtitle2" gutterBottom>
              วิธีแก้ไข:
            </Typography>
            
            <Box component="ol" sx={{ pl: 2 }}>
              <Typography component="li" variant="body2">
                ตรวจสอบ LINE Developers Console: https://developers.line.biz/console/
              </Typography>
              <Typography component="li" variant="body2">
                ใช้ incognito mode เพื่อหลีกเลี่ยง cache
              </Typography>
              <Typography component="li" variant="body2">
                รีสตาร์ท development server: npm run dev
              </Typography>
              <Typography component="li" variant="body2">
                ตรวจสอบ console logs ทั้ง browser และ server
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  )
} 