'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  Container,
  Button,
  Divider,
} from '@mui/material'
import { Error as ErrorIcon, Home, Login } from '@mui/icons-material'
import Link from 'next/link'
import Image from 'next/image'

const errorMessages: Record<string, string> = {
  Configuration: 'เกิดข้อผิดพลาดในการตั้งค่าระบบ',
  AccessDenied: 'การเข้าถึงถูกปฏิเสธ กรุณาตรวจสอบสิทธิ์การเข้าถึง',
  Verification: 'ลิงก์การยืนยันไม่ถูกต้องหรือหมดอายุ',
  OAuthSignin: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย OAuth',
  OAuthCallback: 'เกิดข้อผิดพลาดในการ callback จาก OAuth provider',
  OAuthCreateAccount: 'ไม่สามารถสร้างบัญชีใหม่ได้',
  EmailCreateAccount: 'ไม่สามารถสร้างบัญชีด้วยอีเมลได้',
  Callback: 'เกิดข้อผิดพลาดในการ callback',
  OAuthAccountNotLinked: 'บัญชี OAuth ไม่ได้เชื่อมโยงกับบัญชีที่มีอยู่',
  EmailSignin: 'เกิดข้อผิดพลาดในการส่งอีเมลเข้าสู่ระบบ',
  CredentialsSignin: 'ข้อมูลการเข้าสู่ระบบไม่ถูกต้อง',
  SessionRequired: 'ต้องเข้าสู่ระบบก่อนเข้าถึงหน้านี้',
  line: 'เกิดปัญหาในการเข้าสู่ระบบด้วย LINE - โปรดตรวจสอบการตั้งค่า',
  OAuthProfile: 'ไม่สามารถดึงข้อมูลโปรไฟล์จาก LINE ได้',
  Default: 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'
}

const errorSolutions: Record<string, string> = {
  Configuration: 'ติดต่อผู้ดูแลระบบเพื่อตรวจสอบการตั้งค่า',
  AccessDenied: 'ตรวจสอบว่าคุณได้อนุญาตให้แอปเข้าถึงข้อมูลหรือไม่ หรือลองเข้าสู่ระบบใหม่อีกครั้ง',
  Verification: 'ขอลิงก์การยืนยันใหม่หรือติดต่อผู้ดูแลระบบ',
  OAuthSignin: 'ลองเข้าสู่ระบบใหม่อีกครั้ง หรือใช้วิธีการเข้าสู่ระบบอื่น',
  OAuthCallback: 'ลองเข้าสู่ระบบใหม่อีกครั้ง หรือตรวจสอบการตั้งค่า callback URL',
  OAuthCreateAccount: 'ลองใช้อีเมลอื่นหรือเข้าสู่ระบบด้วยบัญชีที่มีอยู่',
  EmailCreateAccount: 'ตรวจสอบรูปแบบอีเมลหรือใช้อีเมลอื่น',
  Callback: 'ลองเข้าสู่ระบบใหม่อีกครั้ง',
  OAuthAccountNotLinked: 'ใช้วิธีการเข้าสู่ระบบที่เคยใช้มาก่อนหรือติดต่อผู้ดูแลระบบ',
  EmailSignin: 'ตรวจสอบการตั้งค่าอีเมลหรือลองใหม่อีกครั้ง',
  CredentialsSignin: 'ตรวจสอบอีเมลและรหัสผ่านให้ถูกต้อง',
  SessionRequired: 'กรุณาเข้าสู่ระบบก่อนใช้งาน',
  line: '1. ตรวจสอบการตั้งค่า LINE Developers Console 2. ตรวจสอบ Callback URL: http://localhost:3000/api/auth/callback/line 3. ตรวจสอบ Channel ID และ Channel Secret 4. ลองเข้าสู่ระบบใหม่อีกครั้ง',
  OAuthProfile: 'ข้อมูลโปรไฟล์จาก LINE ไม่สมบูรณ์ ลองเข้าสู่ระบบใหม่หรือติดต่อผู้ดูแลระบบ',
  Default: 'ลองรีเฟรชหน้าเว็บหรือเข้าสู่ระบบใหม่อีกครั้ง'
}

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const [errorType, setErrorType] = useState<string>('Default')

  useEffect(() => {
    const error = searchParams.get('error')
    if (error && errorMessages[error]) {
      setErrorType(error)
    }
  }, [searchParams])

  const errorMessage = errorMessages[errorType] || errorMessages.Default
  const errorSolution = errorSolutions[errorType] || errorSolutions.Default

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Card>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            {/* Logo */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, justifyContent: 'center' }}>
              <Image src="/images/logo_trim.png" alt="logo" width={150} height={100} />
            </Box>

            {/* Error Icon */}
            <Box sx={{ mb: 3 }}>
              <ErrorIcon sx={{ fontSize: 64, color: 'error.main' }} />
            </Box>

            <Typography variant="h5" align="center" gutterBottom sx={{ color: 'error.main', fontWeight: 'bold' }}>
              เกิดข้อผิดพลาด
            </Typography>

            <Typography variant="h6" align="center" gutterBottom sx={{ mt: 2, mb: 2 }}>
              {errorMessage}
            </Typography>

            {/* Error Details */}
            <Alert severity="error" sx={{ mt: 3, mb: 3, textAlign: 'left' }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>รหัสข้อผิดพลาด:</strong> {errorType}
              </Typography>
              <Typography variant="body2">
                <strong>แนวทางแก้ไข:</strong> {errorSolution}
              </Typography>
            </Alert>

            <Divider sx={{ my: 3 }} />

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Link href="/auth/signin" style={{ textDecoration: 'none' }}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<Login />}
                  sx={{ py: 1.5 }}
                >
                  ลองเข้าสู่ระบบอีกครั้ง
                </Button>
              </Link>

              <Link href="/" style={{ textDecoration: 'none' }}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<Home />}
                  sx={{ py: 1.5 }}
                >
                  กลับหน้าหลัก
                </Button>
              </Link>
            </Box>

            {/* Development Info */}
            {process.env.NODE_ENV === 'development' && (
              <Alert severity="info" sx={{ mt: 3, textAlign: 'left' }}>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  <strong>Development Info:</strong><br />
                  Error: {searchParams.get('error')}<br />
                  Error Description: {searchParams.get('error_description')}<br />
                  Error URI: {searchParams.get('error_uri')}
                </Typography>
              </Alert>
            )}
          </CardContent>
        </Card>
      </Box>
    </Container>
  )
} 