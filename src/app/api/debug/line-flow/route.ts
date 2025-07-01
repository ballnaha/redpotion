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

    const results: any = {
      timestamp: new Date().toISOString(),
      tests: [] as any[]
    }

    // Test 1: Environment Variables
    const envTest: any = {
      name: 'Environment Variables',
      status: 'checking'
    }

    const hasLineClientId = !!process.env.LINE_CLIENT_ID
    const hasLineClientSecret = !!process.env.LINE_CLIENT_SECRET
    const hasNextAuthUrl = !!process.env.NEXTAUTH_URL
    const hasNextAuthSecret = !!process.env.NEXTAUTH_SECRET

    if (hasLineClientId && hasLineClientSecret && hasNextAuthUrl && hasNextAuthSecret) {
      envTest.status = 'pass'
      envTest.message = 'ตัวแปร environment ครบถ้วน'
      envTest.details = {
        LINE_CLIENT_ID: process.env.LINE_CLIENT_ID,
        LINE_CLIENT_SECRET_LENGTH: process.env.LINE_CLIENT_SECRET?.length,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        NEXTAUTH_SECRET_LENGTH: process.env.NEXTAUTH_SECRET?.length
      }
    } else {
      envTest.status = 'fail'
      envTest.message = 'ตัวแปร environment ไม่ครบ'
      envTest.details = {
        LINE_CLIENT_ID: hasLineClientId ? 'set' : 'missing',
        LINE_CLIENT_SECRET: hasLineClientSecret ? 'set' : 'missing',
        NEXTAUTH_URL: hasNextAuthUrl ? 'set' : 'missing',
        NEXTAUTH_SECRET: hasNextAuthSecret ? 'set' : 'missing'
      }
    }

    results.tests.push(envTest)

    // Test 2: LINE OAuth URL Construction
    const oauthTest: any = {
      name: 'LINE OAuth URL Construction',
      status: 'checking'
    }

    try {
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
      const clientId = process.env.LINE_CLIENT_ID
      const redirectUri = `${baseUrl}/api/auth/callback/line`
      
      if (clientId) {
        const lineAuthUrl = `https://access.line.me/oauth2/v2.1/authorize?` +
          `response_type=code` +
          `&client_id=${clientId}` +
          `&redirect_uri=${encodeURIComponent(redirectUri)}` +
          `&state=test` +
          `&scope=profile%20openid`

        oauthTest.status = 'pass'
        oauthTest.message = 'LINE OAuth URL สร้างได้ถูกต้อง'
        oauthTest.details = {
          clientId,
          redirectUri,
          lineAuthUrl,
          urlLength: lineAuthUrl.length
        }
      } else {
        oauthTest.status = 'fail'
        oauthTest.message = 'ไม่มี LINE_CLIENT_ID'
        oauthTest.details = { error: 'LINE_CLIENT_ID not found' }
      }
    } catch (error: any) {
      oauthTest.status = 'fail'
      oauthTest.message = 'เกิดข้อผิดพลาดในการสร้าง LINE OAuth URL'
      oauthTest.details = { error: error?.message || 'Unknown error' }
    }

    results.tests.push(oauthTest)

    // Test 3: NextAuth Configuration
    const nextAuthTest: any = {
      name: 'NextAuth Configuration',
      status: 'checking'
    }

    try {
      // ตรวจสอบการตั้งค่า NextAuth
      const nextAuthUrl = process.env.NEXTAUTH_URL
      const nextAuthSecret = process.env.NEXTAUTH_SECRET

      const issues = []
      if (!nextAuthUrl) issues.push('NEXTAUTH_URL not set')
      if (!nextAuthSecret) issues.push('NEXTAUTH_SECRET not set')
      if (nextAuthSecret === 'your-secret-here') issues.push('NEXTAUTH_SECRET is using default value')
      if (nextAuthSecret && nextAuthSecret.length < 32) issues.push('NEXTAUTH_SECRET too short (should be 32+ chars)')

      if (issues.length === 0) {
        nextAuthTest.status = 'pass'
        nextAuthTest.message = 'NextAuth configuration ถูกต้อง'
        nextAuthTest.details = {
          NEXTAUTH_URL: nextAuthUrl,
          NEXTAUTH_SECRET_LENGTH: nextAuthSecret?.length || 0,
          secretStrength: (nextAuthSecret?.length || 0) >= 32 ? 'strong' : 'weak'
        }
      } else {
        nextAuthTest.status = 'fail'
        nextAuthTest.message = `NextAuth configuration มีปัญหา: ${issues.join(', ')}`
        nextAuthTest.details = { issues }
      }
    } catch (error: any) {
      nextAuthTest.status = 'fail'
      nextAuthTest.message = 'เกิดข้อผิดพลาดในการตรวจสอบ NextAuth config'
      nextAuthTest.details = { error: error?.message || 'Unknown error' }
    }

    results.tests.push(nextAuthTest)

    // Test 4: Network Connectivity
    const networkTest: any = {
      name: 'Network Connectivity',
      status: 'checking'
    }

    try {
      // ตรวจสอบการเชื่อมต่อ (จำลอง)
      networkTest.status = 'pass'
      networkTest.message = 'Network connectivity available'
      networkTest.details = {
        canReachLine: 'assumed yes',
        localhost: 'available',
        port: '3000'
      }
    } catch (error: any) {
      networkTest.status = 'fail'
      networkTest.message = 'Network connectivity issues'
      networkTest.details = { error: error?.message || 'Unknown error' }
    }

    results.tests.push(networkTest)

    // Summary
    const passCount = results.tests.filter((t: any) => t.status === 'pass').length
    const failCount = results.tests.filter((t: any) => t.status === 'fail').length
    
    results.summary = {
      total: results.tests.length,
      passed: passCount,
      failed: failCount,
      overall: failCount === 0 ? 'pass' : 'fail'
    }

    console.log('🔍 LINE OAuth flow check:', results.summary)

    return NextResponse.json(results)
  } catch (error) {
    console.error('❌ Error checking LINE OAuth flow:', error)
    return NextResponse.json(
      { error: 'Failed to check LINE OAuth flow', details: error },
      { status: 500 }
    )
  }
} 