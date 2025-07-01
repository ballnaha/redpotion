'use client'

import { useEffect, useState } from 'react'
import { signIn, getProviders } from 'next-auth/react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Container,
  Divider,
  List,
  ListItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Paper,
  CircularProgress
} from '@mui/material'
import {
  ExpandMore,
  BugReport,
  CheckCircle,
  Error,
  Warning,
  Info,
  Refresh
} from '@mui/icons-material'

interface DebugResult {
  name: string
  status: 'success' | 'error' | 'warning' | 'info'
  message: string
  details?: any
}

export default function DebugLinePage() {
  const [mounted, setMounted] = useState(false)
  const [results, setResults] = useState<DebugResult[]>([])
  const [loading, setLoading] = useState(false)
  const [providers, setProviders] = useState<any>(null)

  useEffect(() => {
    setMounted(true)
    
    // ตรวจสอบ URL parameters สำหรับ errors
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const error = urlParams.get('error')
      const errorDescription = urlParams.get('error_description')
      
      if (error) {
        addResult({
          name: 'URL Error Detection',
          status: 'error',
          message: `พบ error ใน URL: ${error}`,
          details: {
            error,
            error_description: errorDescription,
            fullURL: window.location.href
          }
        })
      }
    }
    
    runAllTests()
  }, [])

  const addResult = (result: DebugResult) => {
    setResults(prev => [...prev, result])
  }

  const clearResults = () => {
    setResults([])
  }

  const runAllTests = async () => {
    setLoading(true)
    clearResults()

    // Test 1: Check NextAuth Providers
    try {
      const providersData = await getProviders()
      setProviders(providersData)
      
      if (providersData?.line) {
        addResult({
          name: 'NextAuth Providers',
          status: 'success',
          message: 'LINE provider พร้อมใช้งาน',
          details: providersData.line
        })
      } else {
        addResult({
          name: 'NextAuth Providers',
          status: 'error',
          message: 'LINE provider ไม่พบ',
          details: providersData
        })
      }
    } catch (error) {
      addResult({
        name: 'NextAuth Providers',
        status: 'error',
        message: 'เกิดข้อผิดพลาดในการโหลด providers',
        details: error
      })
    }

    // Test 2: Check Environment Variables
    try {
      const response = await fetch('/api/debug/env')
      const envData = await response.json()
      
      const missingVars = []
      if (!envData.LINE_CLIENT_ID) missingVars.push('LINE_CLIENT_ID')
      if (!envData.LINE_CLIENT_SECRET) missingVars.push('LINE_CLIENT_SECRET')
      if (!envData.NEXTAUTH_URL) missingVars.push('NEXTAUTH_URL')
      if (!envData.NEXTAUTH_SECRET) missingVars.push('NEXTAUTH_SECRET')

      if (missingVars.length === 0) {
        addResult({
          name: 'Environment Variables',
          status: 'success',
          message: 'ตัวแปร environment ครบถ้วน',
          details: envData
        })
      } else {
        addResult({
          name: 'Environment Variables',
          status: 'error',
          message: `ตัวแปร environment หายไป: ${missingVars.join(', ')}`,
          details: envData
        })
      }
    } catch (error) {
      addResult({
        name: 'Environment Variables',
        status: 'warning',
        message: 'ไม่สามารถตรวจสอบ environment variables ได้',
        details: error
      })
    }

    // Test 3: Test LINE OAuth Endpoint
    try {
      const response = await fetch('/api/auth/signin/line', {
        method: 'GET',
        redirect: 'manual'
      })
      
      if (response.status === 302) {
        const location = response.headers.get('location')
        if (location?.includes('access.line.me')) {
          addResult({
            name: 'LINE OAuth Endpoint',
            status: 'success',
            message: 'LINE OAuth redirect ทำงานปกติ',
            details: { status: response.status, location }
          })
        } else {
          addResult({
            name: 'LINE OAuth Endpoint',
            status: 'warning',
            message: 'Redirect ทำงาน แต่ไม่ไปยัง LINE',
            details: { status: response.status, location }
          })
        }
      } else {
        addResult({
          name: 'LINE OAuth Endpoint',
          status: 'error',
          message: `Status code ไม่ถูกต้อง: ${response.status}`,
          details: { status: response.status }
        })
      }
    } catch (error) {
      addResult({
        name: 'LINE OAuth Endpoint',
        status: 'error',
        message: 'เกิดข้อผิดพลาดในการทดสอบ LINE OAuth',
        details: error
      })
    }

    // Test 4: Test Callback Endpoint
    try {
      const response = await fetch('/api/auth/callback/line?test=true', {
        method: 'GET'
      })
      
      if (response.ok) {
        addResult({
          name: 'LINE Callback Endpoint',
          status: 'success',
          message: 'Callback endpoint ตอบสนองปกติ',
          details: { status: response.status }
        })
      } else {
        addResult({
          name: 'LINE Callback Endpoint',
          status: 'warning',
          message: `Callback endpoint status: ${response.status}`,
          details: { status: response.status }
        })
      }
    } catch (error) {
      addResult({
        name: 'LINE Callback Endpoint',
        status: 'error',
        message: 'เกิดข้อผิดพลาดในการทดสอบ callback',
        details: error
      })
    }

    // Test 5: Browser Environment
    if (mounted) {
      const browserInfo = {
        userAgent: navigator.userAgent,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
        currentUrl: window.location.href,
        localStorage: typeof(Storage) !== "undefined",
        sessionStorage: typeof(Storage) !== "undefined"
      }

      addResult({
        name: 'Browser Environment',
        status: 'info',
        message: 'ข้อมูล browser environment',
        details: browserInfo
      })
    }

    setLoading(false)
  }

  const testLineLogin = async () => {
    try {
      // เพิ่ม timestamp เพื่อ debug
      const timestamp = Date.now()
      console.log(`🧪 Starting LINE login test at ${timestamp}`)
      
      // ทดสอบ LINE login พร้อม logging
      await signIn('line', { 
        callbackUrl: `/debug-line?test=${timestamp}`,
        redirect: true 
      })
    } catch (error) {
      console.error('❌ LINE login test failed:', error)
      addResult({
        name: 'LINE Login Test',
        status: 'error',
        message: 'LINE login test ล้มเหลว',
        details: error
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle color="success" />
      case 'error': return <Error color="error" />
      case 'warning': return <Warning color="warning" />
      case 'info': return <Info color="info" />
      default: return <Info />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'success'
      case 'error': return 'error'
      case 'warning': return 'warning'
      case 'info': return 'info'
      default: return 'default'
    }
  }

  if (!mounted) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <BugReport sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
              <Typography variant="h4" component="h1">
                LINE Login Debug Tool
              </Typography>
            </Box>
            <Typography variant="body1" color="text.secondary">
              เครื่องมือตรวจสอบและแก้ไขปัญหา LINE Login error
            </Typography>
          </CardContent>
        </Card>

        {/* Control Panel */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
              <Button
                variant="contained"
                startIcon={<Refresh />}
                onClick={runAllTests}
                disabled={loading}
                fullWidth
              >
                {loading ? 'กำลังตรวจสอบ...' : 'ตรวจสอบระบบทั้งหมด'}
              </Button>
              <Button
                variant="outlined"
                color="warning"
                onClick={testLineLogin}
                fullWidth
              >
                ทดสอบ LINE Login จริง
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Results */}
        {results.length > 0 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                ผลการตรวจสอบ ({results.length} รายการ)
              </Typography>
              
              <List>
                {results.map((result, index) => (
                  <Box key={index}>
                    <ListItem sx={{ px: 0 }}>
                      <Accordion sx={{ width: '100%' }}>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                            {getStatusIcon(result.status)}
                            <Typography sx={{ ml: 2, flex: 1 }}>
                              {result.name}
                            </Typography>
                            <Chip
                              label={result.status}
                              color={getStatusColor(result.status) as any}
                              size="small"
                              sx={{ mr: 2 }}
                            />
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Alert severity={result.status} sx={{ mb: 2 }}>
                            {result.message}
                          </Alert>
                          
                          {result.details && (
                            <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                              <Typography variant="subtitle2" gutterBottom>
                                รายละเอียด:
                              </Typography>
                              <Typography
                                component="pre"
                                sx={{
                                  fontSize: '0.875rem',
                                  fontFamily: 'monospace',
                                  whiteSpace: 'pre-wrap',
                                  wordBreak: 'break-word'
                                }}
                              >
                                {JSON.stringify(result.details, null, 2)}
                              </Typography>
                            </Paper>
                          )}
                        </AccordionDetails>
                      </Accordion>
                    </ListItem>
                    {index < results.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              คำแนะนำการแก้ไขปัญหา
            </Typography>
            
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                ขั้นตอนการตรวจสอบ:
              </Typography>
              <Typography component="div">
                1. กดปุ่ม "ตรวจสอบระบบทั้งหมด" เพื่อดูสถานะปัจจุบัน<br/>
                2. แก้ไขปัญหาที่พบตามคำแนะนำ<br/>
                3. กดปุ่ม "ทดสอบ LINE Login จริง" เพื่อทดสอบ<br/>
                4. ดู server logs ใน console สำหรับข้อมูล debug
              </Typography>
            </Alert>

            <Alert severity="warning">
              <Typography variant="subtitle2" gutterBottom>
                หากยังมี error=line:
              </Typography>
              <Typography component="div">
                • ตรวจสอบ LINE Developers Console: https://developers.line.biz/console/<br/>
                • Callback URL ต้องเป็น: http://localhost:3000/api/auth/callback/line<br/>
                • ตรวจสอบ Channel ID และ Channel Secret<br/>
                • เปิด OpenID Connect ใน LINE Console
              </Typography>
            </Alert>
          </CardContent>
        </Card>
      </Box>
    </Container>
  )
} 