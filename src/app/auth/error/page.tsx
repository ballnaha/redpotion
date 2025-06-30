'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Container,
  CircularProgress,
} from '@mui/material'
import { ErrorOutline } from '@mui/icons-material'
import Link from 'next/link'
import Image from 'next/image'

const errorMessages: Record<string, { title: string; description: string; suggestion: string }> = {
  Configuration: {
    title: 'การตั้งค่าผิดพลาด',
    description: 'มีปัญหาในการตั้งค่าระบบ',
    suggestion: 'โปรดติดต่อผู้ดูแลระบบ'
  },
  AccessDenied: {
    title: 'การเข้าสู่ระบบถูกปฏิเสธ',
    description: 'คุณไม่มีสิทธิ์เข้าใช้งานระบบนี้ หรือยกเลิกการอนุญาตจาก LINE',
    suggestion: 'โปรดลองเข้าสู่ระบบใหม่อีกครั้ง หรือติดต่อผู้ดูแลระบบ'
  },
  OAuthCreateAccount: {
    title: 'ไม่สามารถสร้างบัญชีได้',
    description: 'เกิดปัญหาในการสร้างบัญชีผู้ใช้จาก LINE Login อาจเป็นปัญหาการเชื่อมต่อฐานข้อมูล',
    suggestion: 'ระบบกำลังปรับปรุง โปรดลองใหม่อีกครั้งในภายหลัง หรือติดต่อผู้ดูแลระบบ'
  },
  Verification: {
    title: 'การยืนยันตัวตนผิดพลาด',
    description: 'ไม่สามารถยืนยันตัวตนได้',
    suggestion: 'โปรดลองเข้าสู่ระบบใหม่อีกครั้ง'
  },
  Default: {
    title: 'เกิดข้อผิดพลาด',
    description: 'มีปัญหาในการเข้าสู่ระบบ',
    suggestion: 'โปรดลองเข้าสู่ระบบใหม่อีกครั้ง'
  }
}

function AuthErrorContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const errorParam = searchParams.get('error')
    setError(errorParam || 'Default')
  }, [searchParams])

  const errorInfo = errorMessages[error] || errorMessages.Default

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Card>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, justifyContent: 'center' }}>
              <Image src="/images/logo_trim.png" alt="logo" width={150} height={100} />
            </Box>

            <Box sx={{ mb: 3 }}>
              <ErrorOutline sx={{ fontSize: 64, color: '#EF4444', mb: 2 }} />
              <Typography variant="h4" gutterBottom sx={{ color: '#EF4444', fontWeight: 600 }}>
                {errorInfo.title}
              </Typography>
            </Box>

            <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
              <Typography variant="body1" sx={{ mb: 1 }}>
                {errorInfo.description}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {errorInfo.suggestion}
              </Typography>
            </Alert>

            {error === 'AccessDenied' && (
              <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
                <Typography variant="body2">
                  <strong>เคล็ดลับ:</strong> หากใช้ LINE Login โปรดตรวจสอบว่าได้อนุญาตให้แอปพลิเคชันเข้าถึงข้อมูลโปรไฟล์แล้ว
                </Typography>
              </Alert>
            )}

            {error === 'OAuthCreateAccount' && (
              <Alert severity="warning" sx={{ mb: 3, textAlign: 'left' }}>
                <Typography variant="body2">
                  <strong>ปัญหาระบบ:</strong> ไม่สามารถเชื่อมต่อฐานข้อมูลได้ หรือมีปัญหาในการสร้างบัญชีผู้ใช้
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  กรุณารอระบบกลับมาปกติ หรือติดต่อทีมงาน
                </Typography>
              </Alert>
            )}

            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => router.push('/auth/signin')}
                sx={{ flex: 1 }}
              >
                ลองเข้าสู่ระบบใหม่
              </Button>
              
              <Button
                variant="outlined"
                onClick={() => router.push('/')}
                sx={{ flex: 1 }}
              >
                กลับหน้าหลัก
              </Button>
            </Box>

            {error && (
              <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Error Code: {error}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Container>
  )
}

function AuthErrorFallback() {
  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    </Container>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<AuthErrorFallback />}>
      <AuthErrorContent />
    </Suspense>
  )
} 