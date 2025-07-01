import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // ตรวจสอบเฉพาะในโหมด development เท่านั้น
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: 'This endpoint is only available in development mode' },
        { status: 403 }
      )
    }

    // ส่งกลับข้อมูล environment variables โดยไม่เปิดเผยค่าจริงของ secrets
    const envStatus = {
      NODE_ENV: process.env.NODE_ENV || 'not set',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'not set',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'set' : 'not set',
      NEXTAUTH_SECRET_LENGTH: process.env.NEXTAUTH_SECRET?.length || 0,
      LINE_CLIENT_ID: process.env.LINE_CLIENT_ID || 'not set',
      LINE_CLIENT_SECRET: process.env.LINE_CLIENT_SECRET ? 'set' : 'not set',
      LINE_CLIENT_SECRET_LENGTH: process.env.LINE_CLIENT_SECRET?.length || 0,
      NEXT_PUBLIC_LIFF_ID: process.env.NEXT_PUBLIC_LIFF_ID || 'not set',
      DATABASE_URL: process.env.DATABASE_URL ? 'set' : 'not set',
      // เพิ่มข้อมูลเพิ่มเติมสำหรับ debug
      timestamp: new Date().toISOString(),
      platform: process.platform,
      nodeVersion: process.version
    }

    console.log('🔍 Environment variables check:', {
      ...envStatus,
      // ไม่ log ค่าจริงของ secrets
      NEXTAUTH_SECRET: envStatus.NEXTAUTH_SECRET,
      LINE_CLIENT_SECRET: envStatus.LINE_CLIENT_SECRET
    })

    return NextResponse.json(envStatus)
  } catch (error) {
    console.error('❌ Error checking environment variables:', error)
    return NextResponse.json(
      { error: 'Failed to check environment variables', details: error },
      { status: 500 }
    )
  }
} 